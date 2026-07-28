import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ClaimsList from './ClaimsList';

function makeClaim(overrides = {}) {
  return {
    claimId: 'CLM1',
    patient: { fullName: 'Jane Doe', memberId: 'M1', dob: '1990-01-01' },
    provider: { name: 'Dr. Smith', npi: '123' },
    payer: { name: 'Medicaid' },
    service: {
      dos: '2026-01-01', diagnosisCode: 'F10.10', procedureCode: '90837',
      billedAmount: '100', authNumber: 'A1'
    },
    asamLevel: '3.5',
    validationErrors: [],
    ediErrors: [],
    eligibilityStatus: 'eligible',
    ...overrides
  };
}

afterEach(() => {
  cleanup();
});

describe('ClaimsList EDI Ready column text ordering', () => {
  // Regression test for the original ordering bug: "Not eligible" was
  // checked before "Incomplete", so an unchecked/blocked claim falsely
  // showed "Not eligible" instead of "Incomplete".
  it('shows "Incomplete" (not "Not eligible") when validation fails, even with eligibilityStatus unset', () => {
    const claim = makeClaim({
      validationErrors: ['Member ID'],
      eligibilityStatus: undefined,
      ediErrors: ['Member ID']
    });
    render(<ClaimsList claims={[claim]} setClaims={() => {}} />);
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Incomplete')).toHaveLength(2); // Eligibility column + EDI Ready column
    expect(screen.queryByText('Not eligible')).not.toBeInTheDocument();
  });

  it('shows "Not eligible" when validation passes but eligibility check failed', () => {
    const claim = makeClaim({
      validationErrors: [],
      eligibilityStatus: 'not eligible',
      ediErrors: []
    });
    render(<ClaimsList claims={[claim]} setClaims={() => {}} />);
    expect(screen.getByText('Not eligible')).toBeInTheDocument();
  });

  it('shows "Ready" when eligible, complete, and not rule-flagged', () => {
    render(<ClaimsList claims={[makeClaim()]} setClaims={() => {}} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});