import { useState, useEffect } from "react";
import { fetchRules } from "../api";
import "./EdiReadyRing.css";

function isDxFlagged(rules, claim) {
  return rules.some(r =>
    r.payer === claim.payer.name &&
    r.level === claim.asamLevel &&
    r.type === 'DX' &&
    r.code === claim.service.diagnosisCode
  );
}

function isFullyReady(claim, rules) {
  const ediReady = claim.eligibilityStatus === "eligible" && claim.ediErrors && claim.ediErrors.length === 0;
  return ediReady && !isDxFlagged(rules, claim);
}

function EdiReadyRing({ claims }) {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    fetchRules().then(setRules).catch(() => setRules([]));
  }, [claims]); // refetch when claims change, so a rule added elsewhere reflects promptly

  const eligibleClaims = claims.filter(claim => claim.eligibilityStatus === "eligible");
  const ediReadyCount = eligibleClaims.filter(claim => isFullyReady(claim, rules)).length;
  const eligibleCount = eligibleClaims.length;

  const percentage = eligibleCount === 0 ? 0 : (ediReadyCount / eligibleCount) * 100;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentage / 100) * circumference;

  return (
    <div className="pipeline-step">
      <p className="step-label">EDI Ready</p>
      <div className="dashboard">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="#1E3A5F"
            strokeWidth="12"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
          />
          <text x="75" y="75" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="600" fill="#1C2333">
            {ediReadyCount}/{eligibleCount}
          </text>
        </svg>
        <p className="dashboard-label">EDI Ready</p>
      </div>
    </div>
  );
}

export default EdiReadyRing;