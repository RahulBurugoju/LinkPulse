const GATEWAY_URL = "http://localhost:3000";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testApiGateway() {
  console.log("=================================================================");
  console.log("             Testing LinkPulse API Gateway (Port 3000)          ");
  console.log("=================================================================\n");

  // 1. Health check
  console.log("1. Checking Gateway /health...");
  const healthRes = await fetch(`${GATEWAY_URL}/health`);
  const healthData = await healthRes.json();
  console.log(`   Status: ${healthRes.status}, Body:`, healthData);
  if (healthRes.status !== 200 || healthData.status !== "ok") {
    throw new Error("Gateway /health check failed");
  }

  // 2. Readiness check
  console.log("\n2. Checking Gateway /ready (aggregated downstream checks)...");
  const readyRes = await fetch(`${GATEWAY_URL}/ready`);
  const readyData = await readyRes.json();
  console.log(`   Status: ${readyRes.status}, Checks:`, readyData.checks);
  if (readyRes.status !== 200 || readyData.status !== "ready") {
    throw new Error("Gateway /ready check failed: " + JSON.stringify(readyData));
  }

  // 3. Gateway Info & Documentation portal
  console.log("\n3. Checking Gateway / and /api-docs...");
  const infoRes = await fetch(`${GATEWAY_URL}/`);
  const infoData = await infoRes.json();
  console.log(`   Gateway Name: "${infoData.name}"`);

  const docsRes = await fetch(`${GATEWAY_URL}/api-docs`);
  const docsText = await docsRes.text();
  console.log(`   /api-docs Status: ${docsRes.status}, Has Portal HTML: ${docsText.includes("LinkPulse API Portal")}`);

  // 4. Test User Service through Gateway (/api/auth/register & /api/auth/me)
  console.log("\n4. Testing User Service routing via Gateway...");
  const timestamp = Date.now();
  const testUser = {
    name: "Gateway Tester",
    email: `gateway_${timestamp}@example.com`,
    password: "Password123!",
  };

  const regRes = await fetch(`${GATEWAY_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  console.log(`   POST /api/auth/register -> Status: ${regRes.status}, Success: ${regData.success}`);
  const reqId = regRes.headers.get("x-request-id");
  console.log(`   Propagated X-Request-Id: ${reqId}`);
  if (regRes.status !== 201) throw new Error("Registration through gateway failed");
  const token = regData.data.accessToken;

  const meRes = await fetch(`${GATEWAY_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log(`   GET /api/auth/me -> Status: ${meRes.status}, User: ${meData.data?.email}`);
  if (meRes.status !== 200) throw new Error("Auth Me through gateway failed");

  // 5. Test URL Service through Gateway (/api/urls)
  console.log("\n5. Testing URL Service routing via Gateway...");
  const targetUrl = "https://example.com/gateway-proxy-target";
  const urlRes = await fetch(`${GATEWAY_URL}/api/urls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ originalUrl: targetUrl }),
  });
  const urlData = await urlRes.json();
  console.log(`   POST /api/urls -> Status: ${urlRes.status}, Success: ${urlData.success}`);
  if (urlRes.status !== 201) throw new Error("Create URL through gateway failed");
  const shortCode = urlData.data.url.shortCode;
  console.log(`   Short code generated: ${shortCode}`);

  // 6. Test Redirect Service through Gateway (/:shortCode)
  console.log("\n6. Testing Redirect Service routing via Gateway...");
  const redirectRes = await fetch(`${GATEWAY_URL}/${shortCode}`, {
    redirect: "manual",
  });
  const location = redirectRes.headers.get("location");
  console.log(`   GET /${shortCode} -> Status: ${redirectRes.status}, Location: ${location}`);
  if (redirectRes.status !== 302 || location !== targetUrl) {
    throw new Error(`Redirect through gateway failed. Expected 302 with Location ${targetUrl}`);
  }

  // 7. Test Analytics Service through Gateway (/api/analytics/:shortCode)
  console.log("\n7. Testing Analytics Service routing via Gateway...");
  await sleep(2500); // Wait for Kafka consumer to process the click
  const analyticsRes = await fetch(`${GATEWAY_URL}/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const analyticsData = await analyticsRes.json();
  console.log(`   GET /api/analytics/${shortCode} -> Status: ${analyticsRes.status}, totalClicks: ${analyticsData.data?.totalClicks}`);
  if (analyticsRes.status !== 200 || analyticsData.data?.totalClicks < 1) {
    throw new Error("Analytics through gateway failed");
  }

  // 8. Test 404 handling on unknown Gateway route
  console.log("\n8. Testing Gateway 404 handling...");
  const notFoundRes = await fetch(`${GATEWAY_URL}/api/unknown/service/route`);
  console.log(`   GET /api/unknown/service/route -> Status: ${notFoundRes.status}`);
  if (notFoundRes.status !== 404) {
    throw new Error("Gateway should return 404 for unknown route");
  }

  console.log("\n=================================================================");
  console.log("   >>> ALL API GATEWAY TESTS PASSED SUCCESSFULLY! <<<");
  console.log("=================================================================\n");
}

testApiGateway().catch((err) => {
  console.error("API Gateway test failed:", err);
  process.exit(1);
});
