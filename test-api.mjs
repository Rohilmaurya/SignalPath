import fs from "fs";

async function runTests() {
  console.log("=== SignalPath Live API Verification Tests ===");
  const baseUrl = "http://localhost:3000/api/analyze";

  // Test 1: Valid Sample Upload
  console.log("\n[Test 1] Valid sample telemetry & dependencies upload...");
  const sampleCsv = fs.readFileSync("./public/sample-telemetry.csv");
  const sampleJson = fs.readFileSync("./public/sample-dependencies.json");

  const formData1 = new FormData();
  formData1.append("telemetry", new Blob([sampleCsv], { type: "text/csv" }), "sample-telemetry.csv");
  formData1.append("dependencies", new Blob([sampleJson], { type: "application/json" }), "sample-dependencies.json");
  formData1.append("source", "sample");

  const res1 = await fetch(baseUrl, { method: "POST", body: formData1 });
  console.log("HTTP Status:", res1.status);
  const data1 = await res1.json();
  console.log("Status field:", data1.status);
  console.log("Predicted service:", data1.prediction?.serviceId, "Risk:", data1.prediction?.riskScore);
  console.log("Explanation Source:", data1.prediction?.explanationSource);
  console.log("Evidence items count:", data1.evidence?.length);
  console.log("Cascade affected services:", data1.cascade?.affectedServiceIds);
  console.log("Scenarios count:", data1.scenarios?.length);
  console.log("Scenario 1 label:", data1.scenarios?.[0]?.label, "Risk:", data1.scenarios?.[0]?.remainingSystemRisk);
  console.log("Do-nothing rank:", data1.scenarios?.find(s => s.id === "do-nothing")?.rank);

  // Invariant assertions:
  if (res1.status !== 200) throw new Error("Test 1 failed: Expected status 200");
  if (data1.status !== "complete") throw new Error("Test 1 failed: Expected complete status");
  if (!data1.prediction?.serviceId) throw new Error("Test 1 failed: Missing predicted service");
  if (data1.scenarios?.[0]?.remainingSystemRisk > data1.scenarios?.[data1.scenarios.length - 1]?.remainingSystemRisk) {
    throw new Error("Test 1 failed: Scenarios not sorted by lowest remainingSystemRisk");
  }

  // Check evidence ID citations
  const evidenceIdSet = new Set(data1.evidence.map(e => e.id));
  for (const citedId of data1.prediction.evidenceIds) {
    if (!evidenceIdSet.has(citedId)) {
      throw new Error(`Test 1 failed: Cited evidence ID ${citedId} is not in evidence list!`);
    }
  }
  console.log("✓ All cited evidence IDs exist in evidence ledger!");

  // Test 2: Missing required column in CSV
  console.log("\n[Test 2] Invalid CSV (missing required headers)...");
  const badCsv = "random_col,other_col\n1,2";
  const formData2 = new FormData();
  formData2.append("telemetry", new Blob([badCsv], { type: "text/csv" }), "bad.csv");
  formData2.append("dependencies", new Blob([sampleJson], { type: "application/json" }), "sample-dependencies.json");

  const res2 = await fetch(baseUrl, { method: "POST", body: formData2 });
  console.log("HTTP Status:", res2.status);
  const data2 = await res2.json();
  console.log("Error code:", data2.error?.code);
  console.log("Error issues:", data2.error?.issues?.map(i => i.message));
  if (res2.status !== 400 || data2.error?.code !== "INVALID_TELEMETRY") {
    throw new Error("Test 2 failed: Expected 400 INVALID_TELEMETRY");
  }
  console.log("✓ Correctly returned 400 INVALID_TELEMETRY");

  // Test 3: Malformed JSON dependencies
  console.log("\n[Test 3] Malformed dependencies JSON...");
  const badJson = "{ invalid-json ";
  const formData3 = new FormData();
  formData3.append("telemetry", new Blob([sampleCsv], { type: "text/csv" }), "sample-telemetry.csv");
  formData3.append("dependencies", new Blob([badJson], { type: "application/json" }), "bad.json");

  const res3 = await fetch(baseUrl, { method: "POST", body: formData3 });
  console.log("HTTP Status:", res3.status);
  const data3 = await res3.json();
  console.log("Error code:", data3.error?.code);
  if (res3.status !== 400 || data3.error?.code !== "INVALID_DEPENDENCIES") {
    throw new Error("Test 3 failed: Expected 400 INVALID_DEPENDENCIES");
  }
  console.log("✓ Correctly returned 400 INVALID_DEPENDENCIES");

  // Test 4: Unknown service reference
  console.log("\n[Test 4] Unknown service in dependencies...");
  const unknownDepJson = JSON.stringify({
    services: ["api-gateway"],
    dependencies: [{ from: "api-gateway", to: "phantom-service-does-not-exist" }]
  });
  const formData4 = new FormData();
  formData4.append("telemetry", new Blob([sampleCsv], { type: "text/csv" }), "sample-telemetry.csv");
  formData4.append("dependencies", new Blob([unknownDepJson], { type: "application/json" }), "unknown-dep.json");

  const res4 = await fetch(baseUrl, { method: "POST", body: formData4 });
  console.log("HTTP Status:", res4.status);
  const data4 = await res4.json();
  console.log("Error code:", data4.error?.code);
  console.log("Unknown issues:", data4.error?.issues?.map(i => i.message));
  if (res4.status !== 400 || data4.error?.code !== "INVALID_DEPENDENCIES") {
    throw new Error("Test 4 failed: Expected 400 for unknown service reference");
  }
  console.log("✓ Correctly rejected unknown service reference with 400");

  // Test 5: Insufficient History Handling
  console.log("\n[Test 5] Insufficient temporal history upload...");
  const insufficientCsv = fs.readFileSync("./public/insufficient-telemetry.csv");
  const formData5 = new FormData();
  formData5.append("telemetry", new Blob([insufficientCsv], { type: "text/csv" }), "insufficient.csv");
  formData5.append("dependencies", new Blob([sampleJson], { type: "application/json" }), "sample-dependencies.json");

  const res5 = await fetch(baseUrl, { method: "POST", body: formData5 });
  console.log("HTTP Status:", res5.status);
  const data5 = await res5.json();
  console.log("Status field:", data5.status);
  console.log("Sufficient for forecast:", data5.dataQuality?.sufficientForForecast);
  console.log("Prediction available:", data5.prediction?.available);
  console.log("Predicted service:", data5.prediction?.serviceId);
  console.log("Cascade available:", data5.cascade?.available);
  console.log("Warnings:", data5.dataQuality?.warnings);

  if (data5.status !== "insufficient_data") {
    throw new Error("Test 5 failed: Expected insufficient_data status");
  }
  if (data5.prediction?.available !== false || data5.prediction?.serviceId !== null) {
    throw new Error("Test 5 failed: Prediction should not be available or assert a service ID for insufficient history!");
  }
  if (data5.cascade?.available !== false) {
    throw new Error("Test 5 failed: Cascade should not be available for insufficient history!");
  }
  console.log("✓ Correctly withheld prediction & cascade when temporal history is insufficient!");

  // Test 6: 3 records over 30s but completely nominal (no anomalies, low risk)
  console.log("\n[Test 6] 3 records over 30s with nominal telemetry (signal gate test)...");
  const nominalCsv = `timestamp,service,level,message,latency_ms,error_rate,cpu_pct
2026-10-25T10:00:00.000Z,api-gateway,info,Ingress health check ok,10,0.00,12.0
2026-10-25T10:00:20.000Z,orders-service,info,Routine heartbeat,12,0.00,14.0
2026-10-25T10:00:40.000Z,inventory-db,info,Routine pool check,8,0.00,10.0`;

  const formData6 = new FormData();
  formData6.append("telemetry", new Blob([nominalCsv], { type: "text/csv" }), "nominal.csv");
  formData6.append("dependencies", new Blob([sampleJson], { type: "application/json" }), "sample-dependencies.json");

  const res6 = await fetch(baseUrl, { method: "POST", body: formData6 });
  console.log("HTTP Status:", res6.status);
  const data6 = await res6.json();
  console.log("Status field:", data6.status);
  console.log("Prediction available:", data6.prediction?.available);
  console.log("Prediction serviceId:", data6.prediction?.serviceId);
  console.log("Prediction summary:", data6.prediction?.causeSummary);

  if (data6.prediction?.available !== false || data6.prediction?.serviceId !== null) {
    throw new Error("Test 6 failed: Prediction should not assert a failure culprit when all telemetry is nominal!");
  }
  console.log("✓ Correctly withheld failure prediction when telemetry signals are nominal!");

  console.log("\n=== ALL 6 API INVARIANT TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
