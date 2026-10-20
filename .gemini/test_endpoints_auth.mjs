async function testEndpoints() {
  console.log("=== Testing Endpoint Behavior & Bearer Auth ===");

  const timestamp = Date.now();
  const testUser = {
    name: "Swagger Tester",
    email: `swagger_${timestamp}@example.com`,
    password: "Password123!",
  };

  // 1. Register
  console.log("\n1. Testing User Service Register...");
  const regRes = await fetch("http://localhost:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });
  const regData = await regRes.json();
  console.log(`Register status: ${regRes.status}, success: ${regData.success}`);
  if (regRes.status !== 201) throw new Error("Register failed: " + JSON.stringify(regData));
  const token = regData.data.accessToken;

  // 2. Test Protected /api/auth/me without token -> expect 401
  console.log("\n2. Testing /api/auth/me without token (expect 401)...");
  const meNoAuth = await fetch("http://localhost:3001/api/auth/me");
  console.log(`Status without auth: ${meNoAuth.status}`);
  if (meNoAuth.status !== 401) throw new Error("Expected 401 without auth token");

  // 3. Test Protected /api/auth/me with token -> expect 200
  console.log("3. Testing /api/auth/me with Bearer token (expect 200)...");
  const meAuth = await fetch("http://localhost:3001/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meAuth.json();
  console.log(`Status with auth: ${meAuth.status}, user: ${meData.data.email}`);
  if (meAuth.status !== 200) throw new Error("Me endpoint failed");

  // 4. Test URL creation without token -> expect 401
  console.log("\n4. Testing POST /api/urls without token (expect 401)...");
  const urlNoAuth = await fetch("http://localhost:3002/api/urls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalUrl: "https://example.com/swagger-test" }),
  });
  console.log(`Status without auth: ${urlNoAuth.status}`);
  if (urlNoAuth.status !== 401) throw new Error("Expected 401 on URL creation without token");

  // 5. Test URL creation with token -> expect 201
  console.log("5. Testing POST /api/urls with Bearer token (expect 201)...");
  const urlAuth = await fetch("http://localhost:3002/api/urls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ originalUrl: "https://example.com/swagger-test" }),
  });
  const urlData = await urlAuth.json();
  console.log(`Status with auth: ${urlAuth.status}, shortCode: ${urlData.data?.url?.shortCode}`);
  if (urlAuth.status !== 201) throw new Error("Create URL failed");
  const shortCode = urlData.data.url.shortCode;

  // 6. Test Redirect Service -> expect 302
  console.log(`\n6. Testing Redirect GET /${shortCode} (expect 302)...`);
  const redirectRes = await fetch(`http://localhost:3003/${shortCode}`, {
    redirect: "manual",
  });
  console.log(`Redirect status: ${redirectRes.status}, Location: ${redirectRes.headers.get("location")}`);
  if (redirectRes.status !== 302) throw new Error("Expected 302 redirect");

  // 7. Test Analytics without token -> expect 401
  console.log(`\n7. Testing GET /api/analytics/${shortCode} without token (expect 401)...`);
  const analyticsNoAuth = await fetch(`http://localhost:3004/api/analytics/${shortCode}`);
  console.log(`Status without auth: ${analyticsNoAuth.status}`);
  if (analyticsNoAuth.status !== 401) throw new Error("Expected 401 on Analytics without token");

  // 8. Test Analytics with token -> expect 200
  console.log(`8. Testing GET /api/analytics/${shortCode} with Bearer token (expect 200)...`);
  const analyticsAuth = await fetch(`http://localhost:3004/api/analytics/${shortCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const analyticsData = await analyticsAuth.json();
  console.log(`Analytics status: ${analyticsAuth.status}, totalClicks: ${analyticsData.data?.totalClicks}`);
  if (analyticsAuth.status !== 200) throw new Error("Analytics retrieval failed");

  console.log("\n>>> ALL ENDPOINT TESTS & BEARER AUTH CHECKS PASSED SUCCESSFULLY! <<<");
}

testEndpoints().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
