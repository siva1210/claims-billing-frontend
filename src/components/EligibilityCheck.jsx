import { useState } from "react";
import { updateClaim } from "../api";
import "./EligibilityCheck.css"

function EligibilityCheck({ claims, onChecked }) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  async function checkEligibility() {
    setChecking(true);
    setError(null);

    try {
      const claimsToCheck = claims.filter(
        claim => !(claim.validationErrors && claim.validationErrors.length > 0)
      );

      await Promise.all(
        claimsToCheck.map(claim => {
          const isEligible = Math.random() < 0.80;
          return updateClaim(claim.id, {
            eligibilityStatus: isEligible ? "eligible" : "not eligible"
          });
        })
      );

      await onChecked();
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="eligibility-wrapper">
      <button className="eligibility-btn" onClick={checkEligibility} disabled={checking}>
        {checking ? "Checking..." : "Check Eligibility"}
      </button>
      {error && <span className="eligibility-error">Check failed: {error}</span>}
    </div>
  );
}

export default EligibilityCheck;