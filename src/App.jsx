import { useState, useEffect, useCallback } from "react";
import ExcelUpload from "./components/ExcelUpload";
import EligibilityCheck from "./components/EligibilityCheck";
import Dashboard from "./components/Dashboard";
import EdiReadyRing from "./components/EdiReadyRing";
import ClaimsList from "./components/ClaimsList";
import EdiGenerator from "./components/EdiGenerator";
import AvailityUpload from "./components/AvailityUpload";
import RulesEngine from "./components/RulesEngine";
import Login from "./components/Login";
import { useAuth } from "./AuthContext";
import { fetchClaims, clearAllClaims } from "./api";
import "./App.css"

function App() {
  const { token, logout } = useAuth();
  const [claims, setClaims] = useState([]);
  const [ediContent, setEdiContent] = useState("");
  const [activeTab, setActiveTab] = useState("claims");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);

  const refreshClaims = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await fetchClaims();
      setClaims(data);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    async function loadInitial() {
      setLoading(true);
      await refreshClaims();
      setLoading(false);
    }
    loadInitial();
  }, [token, refreshClaims]);

  async function handleClearAll() {
    const confirmed = window.confirm(
      "Delete ALL claims? This is for testing/reset purposes only and can't be undone."
    );
    if (!confirmed) return;

    try {
      await clearAllClaims();
      await refreshClaims();
      setResetSignal(prev => prev + 1);
    } catch (err) {
      setLoadError(err.message);
    }
  }

  if (!token) {
    return <Login />;
  }

  return (
    <div className="app">
      <nav className="app-tabs">
        <button
          className={activeTab === "claims" ? "tab active" : "tab"}
          onClick={() => setActiveTab("claims")}
        >
          Claims
        </button>
        <button
          className={activeTab === "rules" ? "tab active" : "tab"}
          onClick={() => setActiveTab("rules")}
        >
          Rules
        </button>
        {activeTab === "claims" && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All Claims
          </button>
        )}
        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </nav>

      {loadError && <p className="load-error">Couldn't reach the server: {loadError}</p>}

      {activeTab === "claims" && (
        <>
          <ExcelUpload onUploaded={refreshClaims} resetSignal={resetSignal} />

          <EligibilityCheck claims={claims} onChecked={refreshClaims} />

          <div className="pipeline">
            <Dashboard claims={claims} />
            <EdiReadyRing claims={claims} />
            <EdiGenerator setEdiContent={setEdiContent} />
            <AvailityUpload ediContent={ediContent} />
          </div>

          {loading ? (
            <p>Loading claims...</p>
          ) : (
            <ClaimsList claims={claims} onChanged={refreshClaims} />
          )}
        </>
      )}

      {activeTab === "rules" && <RulesEngine />}
    </div>
  );
}

export default App;