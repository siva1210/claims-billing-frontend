import "./Dashboard.css"

function Dashboard({ claims }) {
  const totalChecked = claims.filter(claim => claim.eligibilityStatus).length;
  const eligibleCount = claims.filter(claim => claim.eligibilityStatus === "eligible").length;

  const percentage = totalChecked === 0 ? 0 : (eligibleCount / totalChecked) * 100;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const filledLength = (percentage / 100) * circumference;

  return (
    <div className="pipeline-step">
      <p className="step-label">1. Eligibility</p>
      <div className="dashboard">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="12" />
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="#0F9D58"
            strokeWidth="12"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 75 75)"
          />
          <text x="75" y="75" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="600" fill="#1C2333">
            {eligibleCount}/{totalChecked}
          </text>
        </svg>
        <p className="dashboard-label">Eligible</p>
      </div>
    </div>
  );
}

export default Dashboard;