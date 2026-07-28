import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { uploadClaims } from "../api";
import "./ExcelUpload.css";

function mapRowToClaim(row) {
  return {
    claimId: row['Claim ID'],
    asamLevel: row['ASAM Level'],
    eligibilityStatus: row['Eligibility Status'] === 'ineligible' ? 'not eligible' : row['Eligibility Status'],
    patient: {
      memberId: row['Subscriber ID'],
      firstName: row['First Name'],
      lastName: row['Last Name'],
      fullName: `${row['First Name']} ${row['Last Name']}`.trim(),
      dob: row['DOB'],
      gender: row['Gender'],
      address: row['Patient Address']
    },
    provider: {
      name: row['Billing Provider'],
      npi: row['Provider NPI'],
      taxId: row['Provider Tax ID'],
      address: row['Provider Address'],
      taxonomyCode: row['Taxonomy Code']
    },
    payer: {
      name: row['Payer'],
      payerId: row['Payer ID']
    },
    service: {
      dos: row['Date of Service'],
      placeOfService: row['Place of Service'],
      diagnosisCode: row['ICD-10 (Diag)'],
      procedureCode: row['CPT (Proc)'],
      modifier: row['Modifier'] || '',
      units: row['Units'],
      billedAmount: row['Billed Amount'],
      authNumber: row['Auth Number'] || ''
    }
  };
}

function ExcelUpload({ onUploaded, resetSignal }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setFile(null);
  }, [resetSignal]);

  async function handleFileChange(event) {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setError(null);
    setUploading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { raw: false });

      const claims = rows.map(mapRowToClaim);

      await uploadClaims(claims);
      await onUploaded();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="upload-wrapper">
      <label htmlFor="excel-upload" className="upload-btn">
        {uploading ? "Uploading..." : "Upload File to Check Eligibility"}
      </label>
      <input
        id="excel-upload"
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="upload-input"
        disabled={uploading}
      />
      {file && <span className="upload-filename">{file.name}</span>}
      {error && <span className="upload-error">Upload failed: {error}</span>}
    </div>
  );
}

export default ExcelUpload;