from typing import Dict, List, Optional
from backend.app.schemas.battery import (
    LifecycleRecommendationResponse,
    SecondLifeAssessmentResponse,
)
from backend.app.services.second_life_service import SecondLifeService

class LifecycleService:
    """
    Lifecycle Decision Support Engine:
    Evaluates multi-vector battery health, risk profile, and thermal dynamics to determine
    the optimal operational and end-of-life stage:
    1. CONTINUE USE
    2. SERVICE / MAINTENANCE
    3. SECOND-LIFE REPURPOSING
    4. RECYCLE / RETIRE

    Includes hard safety overrides for elevated thermal conditions (> 50°C) or severe series divergence (> 100mV).
    """

    @staticmethod
    def evaluate_lifecycle(battery_id: str, telemetry: Dict, nominal_capacity_ah: float = 51.0) -> LifecycleRecommendationResponse:
        soh = float(telemetry.get("soh", 84.0))
        spread_mv = float(telemetry.get("cell_voltage_spread_mv", 70.0))
        temp = float(telemetry.get("temperature", 31.4))
        cycles = int(telemetry.get("cycle_count", 428))

        # 2nd Life Assessment
        second_life_summary = SecondLifeService.evaluate_second_life(battery_id, telemetry, nominal_capacity_ah)

        # Check for Critical Safety Override
        safety_override = False
        safety_reason = None

        if temp >= 50.0:
            safety_override = True
            safety_reason = f"CRITICAL THERMAL SAFETY OVERRIDE: Core temperature at {temp}°C exceeds critical safety limits. Pack must be isolated."
        elif spread_mv >= 100.0:
            safety_override = True
            safety_reason = f"CRITICAL IMBALANCE SAFETY OVERRIDE: Severe cell spread delta ({spread_mv} mV) indicates internal cell failure risk."

        # Decision Logic
        if safety_override:
            if soh >= 70.0:
                primary_rec = "SERVICE / MAINTENANCE"
                rec_category = "SERVICE"
                req_actions = [
                    "Immediate pack isolation from high-current charging.",
                    "Perform individual cell internal impedance and thermal imaging diagnostics.",
                    "Service or replace divergent cell channel prior to resuming operation."
                ]
            else:
                primary_rec = "RECYCLE / RETIRE"
                rec_category = "RECYCLE"
                req_actions = [
                    "Decommission pack immediately.",
                    "Discharge to safe storage voltage (0V immersion or safe resistive discharge).",
                    "Dispatch to certified hydrometallurgical recycling facility."
                ]
        elif soh >= 80.0:
            if spread_mv > 50.0 or temp > 40.0:
                primary_rec = "SERVICE / MAINTENANCE"
                rec_category = "SERVICE"
                req_actions = [
                    "Initiate active cell balancing overnight protocol.",
                    "Inspect thermal interface material and coolant circulation loop.",
                    "Verify busbar contact torques."
                ]
            else:
                primary_rec = "CONTINUE USE"
                rec_category = "CONTINUE"
                req_actions = [
                    "Continue standard automotive fleet operations.",
                    "Maintain standard periodic diagnostics schedule."
                ]
        elif soh >= 65.0:
            if spread_mv > 65.0 or temp > 43.0:
                primary_rec = "SERVICE / MAINTENANCE"
                rec_category = "SERVICE"
                req_actions = [
                    "Perform cell balancing and capacity re-calibration test.",
                    "Evaluate feasibility for stationary BESS repurposing."
                ]
            else:
                primary_rec = "SECOND-LIFE REPURPOSING"
                rec_category = "SECOND_LIFE"
                req_actions = [
                    "Transition from primary automotive duty cycle to stationary screening.",
                    "Perform 0.2C / 0.5C standard charge-discharge characterization for BESS."
                ]
        else:
            primary_rec = "RECYCLE / RETIRE"
            rec_category = "RECYCLE"
            req_actions = [
                "Decommission pack from all electrical storage duties.",
                "Initiate closed-loop material recycling for 95%+ recovery of Li, Ni, Co."
            ]

        # Rationales
        rationales = [
            f"SOH: {soh}% with {cycles} accumulated cycles.",
            f"Risk Level: {'Low' if soh >= 80 else 'Medium'}",
            f"Cell spread: {spread_mv} mV",
            f"Temperature stability: {'Good' if temp < 35 else 'Elevated'}",
            f"Degradation rate: {'Stable' if cycles < 500 else 'Moderate'}"
        ]
        if safety_override and safety_reason:
            rationales.insert(0, safety_reason)

        return LifecycleRecommendationResponse(
            battery_id=battery_id,
            soh_pct=soh,
            current_cycle=cycles,
            primary_recommendation=primary_rec,
            recommendation_category=rec_category,
            safety_override_active=safety_override,
            safety_override_reason=safety_reason,
            repurposing_suitability_score=second_life_summary.second_life_suitability_score,
            economic_value_remaining_usd=second_life_summary.economic_value_remaining_usd,
            confidence_pct=second_life_summary.confidence_pct,
            key_rationales=rationales,
            required_actions=req_actions,
            suitable_applications=second_life_summary.potential_applications if rec_category in ["CONTINUE", "SECOND_LIFE"] else ["Certified Recycling Facility"],
            unsuitable_applications=["Automotive High-Demand EV"] if rec_category != "CONTINUE" else ["Premature Decommissioning"],
            second_life_summary=second_life_summary
        )
