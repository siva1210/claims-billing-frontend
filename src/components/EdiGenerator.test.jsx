import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import EdiGenerator from './EdiGenerator';

function makeReadyClaim(overrides = {}) {
  return {
    claimId: 'CLM1',
    patient: {
      memberId: 'M1', firstName: 'Jane', lastName: 'Doe',
      dob: '1990-01-01', gender: 'F', address: '1 Main St, Austin, TX 78701'
    },
    provider: {
      name: 'Dr. Smith', npi: '1234567890', taxId: '11-1111111',
      address: '2 Main St, Austin, TX 78701', taxonomyCode: '261QM0850X'
    },
    payer: { name: 'Medicaid', payerId: 'MCD001' },
    service: {
      dos: '2026-01-01', placeOfService: '11', diagnosisCode: 'F10.10',
      procedureCode: '90837', modifier: 'HF', units: 1,
      billedAmount: '100.00', authNumber: 'A1'
    },
    asamLevel: '3.5',
    eligibilityStatus: 'eligible',
    validationErrors: [],
    ediErrors: [],
    ...overrides
  };
}

afterEach(() => {
  cleanup();
});

describe('EdiGenerator stale generatedFile on prop change', () => {
  it('clears the download button when the claims prop changes after generating', () => {
    const claim = makeReadyClaim();
    const { rerender } = render(<EdiGenerator claims={[claim]} setEdiContent={() => {}} />);

    fireEvent.click(screen.getByText('Convert to 837P'));
    expect(screen.getByText('Download 837P File')).toBeInTheDocument();

    // Simulate a re-upload: claims prop changes
    const newClaim = makeReadyClaim({ claimId: 'CLM2' });
    rerender(<EdiGenerator claims={[newClaim]} setEdiContent={() => {}} />);

    expect(screen.queryByText('Download 837P File')).not.toBeInTheDocument();
  });
});