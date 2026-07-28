import "./Claim.css"

function Claim({ claim }) {
  const statusClass =
    claim.eligibilityStatus === "eligible"
      ? "eligible"
      : claim.eligibilityStatus === "not eligible"
      ? "not-eligible"
      : "";

  return (
    <div className={`card ${statusClass}`}>
      <p>CLAIM ID: {claim.claimId}</p>
      <p>CLAIM LEVEL: {claim.level}</p>
      <p>DOS START: {claim.dosStart}</p>
      <p>DOS END: {claim.dosEnd}</p>
      <p>CPT: {claim.procCode}</p>
      <p>MODIFIER: {claim.modifier}</p>
      <p>DX CODE: {claim.dxCode}</p>
      <p>PA#: {claim.authNumber}</p>
      <p>ELIGIBILITY: {claim.eligibilityStatus || "Not checked"}</p>
      <p>PATIENT NAME: {claim.patient.name}</p>
      <p>PATIENT DOB: {claim.patient.dob}</p>
      <p>DOCTOR NAME: {claim.provider.name}</p>
      <p>DOCTOR NPI: {claim.provider.npi}</p>
    </div>
  );
}

export default Claim;