export const claims = [
  {
    claimId: "CLM001",
    level: "L1 - Outpatient",
    dosStart: "2026-01-05",
    dosEnd: "2026-01-05",
    procCode: "H0004",
    modifier: "HF",
    dxCode: "F10.10",
    authNumber: "AUTH123",
    patient: { name: "John Doe", dob: "1990-04-12" },
    provider: { name: "Dr. Smith", npi: "1234567890" }
  },
  {
    claimId: "CLM002",
    level: "L2.1 - Intensive Outpatient",
    dosStart: "2026-01-06",
    dosEnd: "2026-01-06",
    procCode: "H0015",
    modifier: "HF",
    dxCode: "F41.1",
    authNumber: "AUTH456",
    patient: { name: "Jane Roe", dob: "1985-09-22" },
    provider: { name: "Dr. Lee", npi: "9876543210" }
  }
];