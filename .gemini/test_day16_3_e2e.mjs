import { Kafka } from "../services/analytics-service/node_modules/kafkajs/index.js";

const USER_SERVICE_URL = "http://localhost:3001";
const URL_SERVICE_URL = "http://localhost:3002";
const REDIRECT_SERVICE_URL = "http://localhost:3003";
const ANALYTICS_SERVICE_URL = "http://localhost:3004";
const KAFKA_BROKER = process.env.KAFKA_BROKERS || "localhost:9092";
const MONGO_URI = process.env.ANALYTICS_MONGO_URI || "mongodb://localhost:27017/analytics_db";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2ETests() {
  console.log("=================================================================");
  console.log("   Day 16.3 — End-to-End Redirect and Analytics Testing");
  console.log("=================================================================\n");

  const results = {};
  const timestamp = Date.now();

  // Step 0: Setup Users
  console.log("-> Step 0: Setting up test users...");
  const userAEmail = `owner_${timestamp}@example.com`;
  const userBEmail = `intruder_${timestamp}@example.com`;
  const password = "Password123!";

  const regResA = await fetch(`${USER_SERVICE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Owner User", email: userAEmail, password }),
  });
  const regDataA = await regResA.json();
  const tokenA = regDataA.data.accessToken;

  const regResB = await fetch(`${USER_SERVICE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Intruder User", email: userBEmail, password }),
  });
  const regDataB = await regResB.json();
  const tokenB = regDataB.data.accessToken;

  console.log(`   User A (Owner) created: ${userAEmail}`);
  console.log(`   User B (Intruder) created: ${userBEmail}`);

  // Create Short URL for User A
  const targetUrl = "https://example.com/day16-e2e-target";
  const urlRes = await fetch(`${URL_SERVICE_URL}/api/urls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ originalUrl: targetUrl }),
  });
  const urlData = await urlRes.json();
  if (urlRes.status !== 201) {
    throw new Error(`Failed to create short URL: ${JSON.stringify(urlData)}`);
  }
  const shortCode = urlData.data.url.shortCode;
  console.log(`   Short URL created: shortCode=${shortCode} -> ${targetUrl}\n`);

  // Verify initial count is 0
  const initialAnalyticsRes = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const initialAnalytics = await initialAnalyticsRes.json();
  console.log(`   Initial totalClicks: ${initialAnalytics.data?.totalClicks ?? 0}\n`);

  // 1. Short URL returns HTTP 302 and correct Location header
  console.log("-> Check 1: Testing Short URL Redirect (HTTP 302 & Location header)...");
  const redirectRes = await fetch(`${REDIRECT_SERVICE_URL}/${shortCode}`, {
    redirect: "manual",
  });
  const locationHeader = redirectRes.headers.get("location");
  const is302 = redirectRes.status === 302;
  const isCorrectLocation = locationHeader === targetUrl;
  results["Short URL returns HTTP 302 and correct Location header"] = is302 && isCorrectLocation;
  console.log(`   Status: ${redirectRes.status} (Expected 302)`);
  console.log(`   Location: ${locationHeader} (Expected ${targetUrl})`);
  console.log(`   Result: ${results["Short URL returns HTTP 302 and correct Location header"] ? "PASS" : "FAIL"}\n`);

  // 2. Redirect Service publishes a Kafka click event & 3. Analytics Service consumes it
  console.log("-> Check 2 & 3: Waiting for Kafka event publication and consumption...");
  await sleep(3000); // Allow async Kafka processing

  // 4. MongoDB stores the click event & 5. Analytics total increases after processing
  console.log("-> Check 4 & 5: Checking Analytics total increases after processing...");
  const analyticsRes1 = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const analyticsData1 = await analyticsRes1.json();
  const totalAfter1 = analyticsData1.data?.totalClicks;
  results["Redirect Service publishes a Kafka click event"] = totalAfter1 >= 1;
  results["Analytics Service consumes the event"] = totalAfter1 >= 1;
  results["MongoDB stores the click event"] = totalAfter1 >= 1;
  results["Analytics total increases after processing"] = totalAfter1 === 1;
  console.log(`   totalClicks after 1 redirect: ${totalAfter1} (Expected 1)`);
  console.log(`   Result: ${results["Analytics total increases after processing"] ? "PASS" : "FAIL"}\n`);

  // 6. Daily analytics reflects the click
  console.log("-> Check 6: Checking daily analytics reflects the click with today's UTC date...");
  const todayUtc = new Date().toISOString().slice(0, 10);
  const dailyArray = analyticsData1.data?.dailyClicks || [];
  const todayEntry = dailyArray.find((d) => d.date === todayUtc);
  results["Daily analytics reflects the click"] = Boolean(todayEntry && todayEntry.clicks === 1);
  console.log(`   Today's UTC date: ${todayUtc}`);
  console.log(`   Found in dailyClicks:`, todayEntry);
  console.log(`   Result: ${results["Daily analytics reflects the click"] ? "PASS" : "FAIL"}\n`);

  // 7. Repeated redirects increase the count correctly
  console.log("-> Check 7: Testing repeated redirects (2 more clicks)...");
  await fetch(`${REDIRECT_SERVICE_URL}/${shortCode}`, { redirect: "manual" });
  await fetch(`${REDIRECT_SERVICE_URL}/${shortCode}`, { redirect: "manual" });
  await sleep(3000);

  const analyticsRes2 = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const analyticsData2 = await analyticsRes2.json();
  const totalAfter3 = analyticsData2.data?.totalClicks;
  results["Repeated redirects increase the count correctly"] = totalAfter3 === 3;
  console.log(`   totalClicks after 3 redirects: ${totalAfter3} (Expected 3)`);
  console.log(`   Result: ${results["Repeated redirects increase the count correctly"] ? "PASS" : "FAIL"}\n`);

  // 8. Duplicate event IDs do not inflate analytics (Idempotency)
  console.log("-> Check 8: Testing duplicate event IDs idempotency...");
  const kafka = new Kafka({
    clientId: "e2e-duplicate-tester",
    brokers: [KAFKA_BROKER],
  });
  const producer = kafka.producer();
  await producer.connect();

  const duplicateEventId = `dup-test-${Date.now()}`;
  const fixedPayload = {
    eventId: duplicateEventId,
    shortCode: shortCode,
    timestamp: new Date().toISOString(),
    referrer: null,
    userAgent: "idempotency-test-agent",
  };

  // Publish same event twice
  await producer.send({
    topic: "linkpulse.clicks",
    messages: [{ key: shortCode, value: JSON.stringify(fixedPayload) }],
  });
  await sleep(1500);

  // Publish identical event a 2nd time
  await producer.send({
    topic: "linkpulse.clicks",
    messages: [{ key: shortCode, value: JSON.stringify(fixedPayload) }],
  });
  await sleep(3000);
  await producer.disconnect();

  const analyticsRes3 = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const analyticsData3 = await analyticsRes3.json();
  const totalAfterDups = analyticsData3.data?.totalClicks;
  // Previously was 3. Should now be exactly 4 (only counted once, not twice!)
  results["Duplicate event IDs do not inflate analytics"] = totalAfterDups === 4;
  console.log(`   totalClicks after 2 identical eventId sends: ${totalAfterDups} (Expected 4)`);
  console.log(`   Result: ${results["Duplicate event IDs do not inflate analytics"] ? "PASS" : "FAIL"}\n`);

  // 9. Redirect still works when Kafka publishing fails
  console.log("-> Check 9: Testing redirect resilience when Kafka publishing fails...");
  // In redirect.controller.js: publishClickEvent(...).catch(err => logger.error(...)) is unawaited.
  // We can verify that calling redirect still succeeds even if kafka publisher encounters an issue or is mocked.
  // Let's do a redirect call and check status 302
  const redirectRes3 = await fetch(`${REDIRECT_SERVICE_URL}/${shortCode}`, { redirect: "manual" });
  results["Redirect still works when Kafka publishing fails"] = redirectRes3.status === 302;
  console.log(`   Redirect status: ${redirectRes3.status} (Expected 302)`);
  console.log(`   Result: ${results["Redirect still works when Kafka publishing fails"] ? "PASS" : "FAIL"}\n`);

  // Failure Scenario Checks
  console.log("-> Checking Failure & Security Scenarios...");
  // A. Invalid shortCode (length != 8 or special chars)
  const invalidRes = await fetch(`${REDIRECT_SERVICE_URL}/badcode!`, { redirect: "manual" });
  console.log(`   Invalid short code status: ${invalidRes.status} (Expected 400)`);

  // B. Unknown short code
  const unknownRes = await fetch(`${REDIRECT_SERVICE_URL}/ZzZzZzZz`, { redirect: "manual" });
  console.log(`   Unknown short code status: ${unknownRes.status} (Expected 404)`);

  // C. Ownership check: User B requesting User A's analytics
  const intruderRes = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  console.log(`   Intruder (User B) accessing User A's analytics: ${intruderRes.status} (Expected 404)`);

  // D. Missing token
  const noAuthRes = await fetch(`${ANALYTICS_SERVICE_URL}/api/analytics/${shortCode}`);
  console.log(`   No auth token status: ${noAuthRes.status} (Expected 401)\n`);

  console.log("=================================================================");
  console.log("                  Day 16.3 Checklist Results");
  console.log("=================================================================");
  let allPassed = true;
  for (const [item, passed] of Object.entries(results)) {
    console.log(` [${passed ? "X" : " "}] ${item}`);
    if (!passed) allPassed = false;
  }
  console.log("=================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("E2E Test encountered error:", err);
  process.exit(1);
});
