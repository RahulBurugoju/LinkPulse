const services = [
  { name: "User Service", port: 3001, expectedTitle: "LinkPulse User Service API" },
  { name: "URL Service", port: 3002, expectedTitle: "LinkPulse URL Service API" },
  { name: "Redirect Service", port: 3003, expectedTitle: "LinkPulse Redirect Service API" },
  { name: "Analytics Service", port: 3004, expectedTitle: "LinkPulse Analytics Service API" },
];

async function run() {
  console.log("=== Verifying Swagger UI and OpenAPI Specs across all 4 services ===\n");
  let allPassed = true;

  for (const svc of services) {
    console.log(`Checking ${svc.name} on port ${svc.port}...`);

    // 1. Check Swagger HTML page
    try {
      const htmlRes = await fetch(`http://localhost:${svc.port}/api-docs/`);
      const htmlText = await htmlRes.text();
      const hasSwaggerHtml = htmlRes.status === 200 && htmlText.includes("swagger-ui");
      console.log(`  GET /api-docs/ -> Status: ${htmlRes.status}, Contains Swagger UI: ${hasSwaggerHtml}`);
      if (!hasSwaggerHtml) {
        console.error(`  FAIL: Swagger HTML did not render correctly on port ${svc.port}`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`  FAIL: Could not connect to /api-docs/ on port ${svc.port}: ${err.message}`);
      allPassed = false;
    }

    // 2. Check OpenAPI JSON spec
    try {
      const jsonRes = await fetch(`http://localhost:${svc.port}/api-docs.json`);
      if (jsonRes.status !== 200) {
        console.error(`  FAIL: /api-docs.json returned status ${jsonRes.status}`);
        allPassed = false;
      } else {
        const spec = await jsonRes.json();
        console.log(`  OpenAPI version: ${spec.openapi}`);
        console.log(`  Spec Title: "${spec.info?.title}"`);
        console.log(`  SecuritySchemes:`, Object.keys(spec.components?.securitySchemes || {}));
        console.log(`  Documented Paths:`, Object.keys(spec.paths || {}));

        if (spec.info?.title !== svc.expectedTitle) {
          console.error(`  FAIL: Expected title "${svc.expectedTitle}", got "${spec.info?.title}"`);
          allPassed = false;
        }

        if (!spec.components?.securitySchemes?.bearerAuth) {
          console.error(`  FAIL: bearerAuth securityScheme missing in ${svc.name}`);
          allPassed = false;
        }

        const pathCount = Object.keys(spec.paths || {}).length;
        if (pathCount === 0) {
          console.error(`  FAIL: No documented paths found in ${svc.name}`);
          allPassed = false;
        } else {
          console.log(`  PASS: Found ${pathCount} documented route path(s)`);
        }
      }
    } catch (err) {
      console.error(`  FAIL: Could not fetch /api-docs.json on port ${svc.port}: ${err.message}`);
      allPassed = false;
    }

    console.log("");
  }

  if (allPassed) {
    console.log(">>> ALL SERVICES PASSED SWAGGER / OPENAPI VERIFICATION! <<<");
  } else {
    console.error(">>> SOME SERVICES FAILED SWAGGER VERIFICATION <<<");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
