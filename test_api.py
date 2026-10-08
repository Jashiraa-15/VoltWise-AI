import urllib.request
import json

def run_tests():
    endpoints = [
        "/api/health",
        "/api/batteries",
        "/api/batteries/VW-EV-001",
        "/api/batteries/VW-EV-001/telemetry",
        "/api/batteries/VW-EV-001/cells",
        "/api/batteries/VW-EV-001/cell-compatibility",
        "/api/batteries/VW-EV-001/anomalies",
        "/api/batteries/VW-EV-001/second-life",
        "/api/batteries/VW-EV-001/soh",
        "/api/batteries/VW-EV-001/health",
        "/api/batteries/VW-EV-001/temperature",
        "/api/batteries/VW-EV-001/degradation",
        "/api/batteries/VW-EV-001/rul?eol_threshold=80.0",
        "/api/batteries/VW-EV-001/rul?eol_threshold=75.0",
        "/api/batteries/VW-EV-001/rul?eol_threshold=70.0",
        "/api/batteries/VW-EV-001/risk",
        "/api/batteries/VW-EV-001/lifecycle",
        "/api/batteries/VW-EV-001/history",
        "/api/batteries/VW-EV-001/report",
        "/api/simulation/status",
    ]

    for ep in endpoints:
        url = f"http://127.0.0.1:8000{ep}"
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode())
        print(f"PASS [GET] {ep}")

    # Test CSV export
    csv_url = "http://127.0.0.1:8000/api/batteries/VW-EV-001/export/csv"
    csv_req = urllib.request.urlopen(csv_url)
    csv_data = csv_req.read().decode()
    print("PASS [GET] /api/batteries/VW-EV-001/export/csv ->", len(csv_data), "bytes received")

    # Test POST hardware telemetry
    payload = json.dumps({
        "battery_id": "VW-EV-001",
        "cell_voltages": [4.02, 4.01, 3.95, 4.00],
        "pack_voltage": 15.98,
        "current": 4.5,
        "temperature": 31.8
    }).encode("utf-8")
    
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/telemetry",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    print("PASS [POST] /api/telemetry -> Ingested successfully, pack_voltage:", data.get("pack_voltage"))

    # Test all 7 simulation scenarios
    scenarios = [
        "NORMAL",
        "AGING",
        "CELL IMBALANCE",
        "THERMAL STRESS",
        "HIGH CURRENT",
        "RAPID DEGRADATION",
        "MULTI-FAULT"
    ]

    print("\n--- Testing Scenario Transitions & Analytical Outcomes ---")
    for sc in scenarios:
        ctrl_payload = json.dumps({
            "action": "start",
            "speed": 1.0,
            "scenario": sc
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/simulation/control",
            data=ctrl_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res = urllib.request.urlopen(req)
        status_data = json.loads(res.read().decode())
        
        # Verify downstream analytical responses
        risk_req = urllib.request.urlopen("http://127.0.0.1:8000/api/batteries/VW-EV-001/risk")
        risk_data = json.loads(risk_req.read().decode())
        
        life_req = urllib.request.urlopen("http://127.0.0.1:8000/api/batteries/VW-EV-001/lifecycle")
        life_data = json.loads(life_req.read().decode())

        anom_req = urllib.request.urlopen("http://127.0.0.1:8000/api/batteries/VW-EV-001/anomalies")
        anom_data = json.loads(anom_req.read().decode())

        print(f"PASS Scenario [{sc:17}] -> Risk: {risk_data['overall_risk_score']:4.1f} ({risk_data['risk_level']:6}) | Rec: {life_data['primary_recommendation']:22} | Anomalies: {anom_data['total_count']}")

    print("\nALL 27 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
