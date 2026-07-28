import { useState, useEffect, Fragment } from "react";
import * as XLSX from "xlsx";
import { fetchRules, updateClaim, deleteClaim } from "../api";
import "./ClaimsList.css";

// Mirrors the old isDxFlagged/isFullyReady from rulesStorage.js, now
// operating on rules fetched from the API instead of localStorage.
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

function ClaimsList({ claims, onChanged }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingClaimId, setEditingClaimId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [rules, setRules] = useState([]);
  const [actionError, setActionError] = useState(null);
  const pageSize = 50;

  useEffect(() => {
    fetchRules().then(setRules).catch(err => setActionError(err.message));
  }, [claims]); // refetch rules whenever claims change too, so a rule added elsewhere reflects promptly

  useEffect(() => {
    setCurrentPage(1);
  }, [claims, searchTerm, statusFilter]);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch =
      claim.claimId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "incomplete"
        ? claim.validationErrors && claim.validationErrors.length > 0
        : statusFilter === "edi-ready"
        ? isFullyReady(claim, rules)
        : statusFilter === "edi-not-ready"
        ? !isFullyReady(claim, rules)
        : statusFilter === "flagged"
        ? isDxFlagged(rules, claim)
        : statusFilter === "not-flagged"
        ? !isDxFlagged(rules, claim)
        : claim.eligibilityStatus === statusFilter);

    return matchesSearch && matchesStatus;
  });

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedClaims = filteredClaims.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredClaims.length / pageSize);

  function exportToExcel() {
    const exportData = filteredClaims.map(claim => ({
      "Claim ID": claim.claimId,
      "Patient Name": claim.patient.fullName,
      "Member ID": claim.patient.memberId,
      "Provider": claim.provider.name,
      "Date of Service": claim.service.dos,
      "Eligibility Status": claim.validationErrors.length > 0 ? "Incomplete" : (claim.eligibilityStatus || "Not checked"),
      "Missing Fields (Eligibility)": claim.validationErrors.join(", "),
      "EDI Ready": isFullyReady(claim, rules) ? "Yes" : "No",
      "Missing Fields (EDI)": claim.ediErrors ? claim.ediErrors.join(", ") : "",
      "Rule Flag": isDxFlagged(rules, claim) ? "Flagged" : ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Claims");
    XLSX.writeFile(workbook, "claims_export.xlsx");
  }

  function startEdit(claim) {
    setEditingClaimId(claim.claimId);
    setEditForm({
      fullName: claim.patient.fullName,
      memberId: claim.patient.memberId,
      dob: claim.patient.dob,
      providerName: claim.provider.name,
      npi: claim.provider.npi,
      procedureCode: claim.service.procedureCode,
      diagnosisCode: claim.service.diagnosisCode,
      billedAmount: claim.service.billedAmount,
      authNumber: claim.service.authNumber
    });
  }

  function cancelEdit() {
    setEditingClaimId(null);
    setEditForm({});
  }

  async function saveEdit(claim) {
    setActionError(null);
    try {
      // Split the fullName back into first/last for the patients table,
      // best-effort — assumes "First Last" format like the rest of the app does.
      const [firstName, ...rest] = editForm.fullName.trim().split(" ");
      const lastName = rest.join(" ");

      await updateClaim(claim.id, {
        patient: {
          firstName,
          lastName,
          memberId: editForm.memberId,
          dob: editForm.dob
        },
        provider: {
          name: editForm.providerName,
          npi: editForm.npi
        },
        service: {
          procedureCode: editForm.procedureCode,
          diagnosisCode: editForm.diagnosisCode,
          billedAmount: editForm.billedAmount,
          authNumber: editForm.authNumber
        }
      });

      setEditingClaimId(null);
      setEditForm({});
      await onChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(claim) {
    const confirmed = window.confirm("Delete this claim? This can't be undone.");
    if (!confirmed) return;

    setActionError(null);
    try {
      await deleteClaim(claim.id);
      await onChanged();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <>
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search by claim ID or patient name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">All</option>
          <option value="eligible">Eligible</option>
          <option value="not eligible">Not Eligible</option>
          <option value="incomplete">Incomplete</option>
          <option value="edi-ready">EDI Ready</option>
          <option value="edi-not-ready">EDI Not Ready</option>
          <option value="flagged">Flagged</option>
          <option value="not-flagged">Not Flagged</option>
        </select>
        <button className="export-btn" onClick={exportToExcel} disabled={filteredClaims.length === 0}>
          Export to Excel
        </button>
      </div>

      {actionError && <p className="action-error">Action failed: {actionError}</p>}

      <table className="claims-table">
        <thead>
          <tr>
            <th>Claim ID</th>
            <th>Patient Name</th>
            <th>Date of Service</th>
            <th>Provider</th>
            <th>Eligibility</th>
            <th>EDI Ready</th>
            <th>Rule Flag</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-state">
                No claims uploaded yet — upload an Excel file to get started.
              </td>
            </tr>
          ) : pagedClaims.length === 0 ? (
            <tr>
              <td colSpan="8" className="empty-state">
                No claims match your search or filter.
              </td>
            </tr>
          ) : (
            pagedClaims.map((claim) => {
              const statusClass =
                claim.validationErrors && claim.validationErrors.length > 0
                  ? "invalid"
                  : claim.eligibilityStatus === "eligible"
                  ? "eligible"
                  : claim.eligibilityStatus === "not eligible"
                  ? "not-eligible"
                  : "";

              const ediReady = isFullyReady(claim, rules);
              const ruleFlagged = isDxFlagged(rules, claim);

              let ediCellText;
              if (ediReady) {
                ediCellText = "Ready";
              } else if (claim.validationErrors && claim.validationErrors.length > 0) {
                ediCellText = "Incomplete";
              } else if (claim.eligibilityStatus !== "eligible") {
                ediCellText = "Not eligible";
              } else if (ruleFlagged) {
                ediCellText = "Rule flagged";
              } else if (claim.ediErrors && claim.ediErrors.length > 0) {
                ediCellText = `Missing: ${claim.ediErrors.join(", ")}`;
              } else {
                ediCellText = "Not ready";
              }

              const isEditing = editingClaimId === claim.claimId;

              return (
                <Fragment key={claim.claimId}>
                  <tr key={claim.claimId} className={statusClass}>
                    <td>{claim.claimId}</td>
                    <td>{claim.patient.fullName}</td>
                    <td>{claim.service.dos}</td>
                    <td>{claim.provider.name}</td>
                    <td>
                      {claim.validationErrors && claim.validationErrors.length > 0
                        ? "Incomplete"
                        : claim.eligibilityStatus || "Not checked"}
                    </td>
                    <td className={ediReady ? "edi-ready" : "edi-not-ready"}>
                      {ediCellText}
                    </td>
                    <td className={ruleFlagged ? "rule-flagged" : ""}>
                      {ruleFlagged ? "⚠ Flagged" : ""}
                    </td>
                    <td>
                      {!isEditing && (
                        <>
                          <button className="edit-btn" onClick={() => startEdit(claim)}>
                            Edit
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete(claim)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  {isEditing && (
                    <tr className="edit-row">
                      <td colSpan="8">
                        <div className="edit-form">
                          <label>
                            Patient Name
                            <input
                              value={editForm.fullName}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            />
                          </label>
                          <label>
                            Member ID
                            <input
                              value={editForm.memberId}
                              onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                            />
                          </label>
                          <label>
                            DOB
                            <input
                              value={editForm.dob}
                              onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                            />
                          </label>
                          <label>
                            Provider Name
                            <input
                              value={editForm.providerName}
                              onChange={(e) => setEditForm({ ...editForm, providerName: e.target.value })}
                            />
                          </label>
                          <label>
                            Provider NPI
                            <input
                              value={editForm.npi}
                              onChange={(e) => setEditForm({ ...editForm, npi: e.target.value })}
                            />
                          </label>
                          <label>
                            Procedure Code
                            <input
                              value={editForm.procedureCode}
                              onChange={(e) => setEditForm({ ...editForm, procedureCode: e.target.value })}
                            />
                          </label>
                          <label>
                            Diagnosis Code
                            <input
                              value={editForm.diagnosisCode}
                              onChange={(e) => setEditForm({ ...editForm, diagnosisCode: e.target.value })}
                            />
                          </label>
                          <label>
                            Billed Amount
                            <input
                              value={editForm.billedAmount}
                              onChange={(e) => setEditForm({ ...editForm, billedAmount: e.target.value })}
                            />
                          </label>
                          <label>
                            Auth Number
                            <input
                              value={editForm.authNumber}
                              onChange={(e) => setEditForm({ ...editForm, authNumber: e.target.value })}
                            />
                          </label>
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => saveEdit(claim)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages || totalPages === 0}>
          Next
        </button>
      </div>
    </>
  );
}

export default ClaimsList;