import { useState, useEffect } from "react";
import { fetchRules, addRule, deleteRule } from "../api";
import "./RulesEngine.css";

function RulesEngine() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ payer: "", level: "", type: "DX", code: "" });

  async function loadRules() {
    try {
      setError(null);
      const data = await fetchRules();
      setRules(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadRules();
      setLoading(false);
    }
    init();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.payer || !form.level || !form.type || !form.code) {
      alert("All fields are required to add a rule.");
      return;
    }

    try {
      await addRule(form);
      setForm({ payer: "", level: "", type: "DX", code: "" });
      await loadRules();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this rule? This can't be undone.");
    if (!confirmed) return;

    try {
      await deleteRule(id);
      await loadRules();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="rules-engine">
      <h2>Billing Rules</h2>
      <p className="rules-subtitle">
        Rules flag a payer/level/code combination as invalid — matching a rule means the claim is flagged, not automatically rejected.
      </p>

      {error && <p className="rules-error">Error: {error}</p>}

      <form className="rule-form" onSubmit={handleAdd}>
        <input
          placeholder="Payer (e.g. Medicaid)"
          value={form.payer}
          onChange={(e) => setForm({ ...form, payer: e.target.value })}
        />
        <input
          placeholder="Level (e.g. 3.5)"
          value={form.level}
          onChange={(e) => setForm({ ...form, level: e.target.value })}
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="DX">DX (Diagnosis)</option>
          <option value="CPT">CPT (Procedure)</option>
        </select>
        <input
          placeholder="Code (e.g. F10.10)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        <button type="submit" className="add-rule-btn">Add Rule</button>
      </form>

      {loading ? (
        <p>Loading rules...</p>
      ) : (
        <table className="rules-table">
          <thead>
            <tr>
              <th>Payer</th>
              <th>Level</th>
              <th>Type</th>
              <th>Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">No rules added yet.</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.payer}</td>
                  <td>{rule.level}</td>
                  <td>{rule.type}</td>
                  <td>{rule.code}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDelete(rule.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RulesEngine;