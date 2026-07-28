const API_BASE = 'http://localhost:4000';

function authHeaders() {
  const token = sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Converts a flat, snake_case claim row from the API into the nested,
// camelCase shape every component expects (same shape ExcelUpload.jsx's
// mapRowToClaim() produces).
function adaptClaim(row) {
  return {
    claimId: row.claim_id,
    asamLevel: row.asam_level,
    eligibilityStatus: row.eligibility_status,
    validationErrors: row.validation_errors || [],
    ediErrors: row.edi_errors || [],
    patient: {
      memberId: row.member_id,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`.trim(),
      dob: row.dob,
      gender: row.gender,
      address: row.patient_address
    },
    provider: {
      name: row.provider_name,
      npi: row.npi,
      taxId: row.tax_id,
      address: row.provider_address,
      taxonomyCode: row.taxonomy_code
    },
    payer: {
      name: row.payer_name,
      payerId: row.payer_id
    },
    service: {
      dos: row.date_of_service,
      placeOfService: row.place_of_service,
      diagnosisCode: row.diagnosis_code,
      procedureCode: row.procedure_code,
      modifier: row.modifier,
      units: row.units,
      billedAmount: row.billed_amount,
      authNumber: row.auth_number
    },
    // Kept so ClaimsList/App can reference the DB row id for PATCH/DELETE
    id: row.id
  };
}

async function handleResponse(res, fallbackMessage) {
  if (res.status === 401) {
    sessionStorage.removeItem('token');
    window.location.reload(); // bounce back to the login screen
    throw new Error('Session expired. Please log in again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || fallbackMessage);
  }
  return res.json();
}

export async function fetchClaims() {
  const res = await fetch(`${API_BASE}/claims`, { headers: authHeaders() });
  const rows = await handleResponse(res, 'Failed to fetch claims');
  return rows.map(adaptClaim);
}

export async function uploadClaims(claims) {
  const res = await fetch(`${API_BASE}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ claims }),
  });
  return handleResponse(res, 'Failed to upload claims');
}

export async function updateClaim(id, updates) {
  const res = await fetch(`${API_BASE}/claims/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(updates),
  });
  return handleResponse(res, 'Failed to update claim');
}

export async function deleteClaim(id) {
  const res = await fetch(`${API_BASE}/claims/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to delete claim');
}

export async function clearAllClaims() {
  const res = await fetch(`${API_BASE}/claims`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to clear claims');
}

export async function fetchRules() {
  const res = await fetch(`${API_BASE}/rules`, { headers: authHeaders() });
  return handleResponse(res, 'Failed to fetch rules');
}

export async function addRule(rule) {
  const res = await fetch(`${API_BASE}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(rule),
  });
  return handleResponse(res, 'Failed to add rule');
}

export async function deleteRule(id) {
  const res = await fetch(`${API_BASE}/rules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to delete rule');
}

export async function generateEdi() {
  const res = await fetch(`${API_BASE}/edi/generate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res, 'Failed to generate EDI file');
}