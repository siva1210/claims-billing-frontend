import { describe, it, expect } from 'vitest';
import { validateForEligibility, validateForEdi, isEdiReady } from './claimValidation';

function makeCompleteClaim(overrides = {}) {
  return {
    patient: { memberId: 'M123', fullName: 'Jane Doe', dob: '1990-01-01' },
    provider: { npi: '1234567890', name: 'Dr. Smith' },
    service: {
      procedureCode: '99213',
      diagnosisCode: 'F41.1',
      billedAmount: '150.00',
      authNumber: 'AUTH001'
    },
    eligibilityStatus: 'eligible',
    ediErrors: [],
    ...overrides
  };
}

describe('validateForEligibility', () => {
  it('returns no errors when all eligibility-required fields are present', () => {
    const claim = makeCompleteClaim();
    expect(validateForEligibility(claim)).toEqual([]);
  });

  it('flags missing patient fields by label', () => {
    const claim = makeCompleteClaim({
      patient: { memberId: '', fullName: 'Jane Doe', dob: '1990-01-01' }
    });
    expect(validateForEligibility(claim)).toEqual(['Member ID']);
  });

  it('does not check EDI-only fields (e.g. missing NPI should not fail eligibility)', () => {
    const claim = makeCompleteClaim({ provider: { npi: '', name: '' } });
    expect(validateForEligibility(claim)).toEqual([]);
  });
});

describe('validateForEdi', () => {
  it('returns no errors when all 9 required fields are present', () => {
    const claim = makeCompleteClaim();
    expect(validateForEdi(claim)).toEqual([]);
  });

  it('flags multiple missing fields across patient/provider/service', () => {
    const claim = makeCompleteClaim({
      provider: { npi: '', name: 'Dr. Smith' },
      service: {
        procedureCode: '99213',
        diagnosisCode: '',
        billedAmount: '150.00',
        authNumber: ''
      }
    });
    expect(validateForEdi(claim)).toEqual(['Provider NPI', 'Diagnosis Code', 'Auth Number']);
  });
});

describe('isEdiReady (single source of truth)', () => {
  it('is true only when eligible AND ediErrors is empty', () => {
    const claim = makeCompleteClaim({ eligibilityStatus: 'eligible', ediErrors: [] });
    expect(isEdiReady(claim)).toBe(true);
  });

  it('is false when eligible but ediErrors has entries', () => {
    const claim = makeCompleteClaim({ eligibilityStatus: 'eligible', ediErrors: ['Auth Number'] });
    expect(isEdiReady(claim)).toBeFalsy();
  });

  it('is false when ediErrors is empty but not eligible', () => {
    const claim = makeCompleteClaim({ eligibilityStatus: 'not eligible', ediErrors: [] });
    expect(isEdiReady(claim)).toBe(false);
  });

  // Regression test: before consolidation, different callers computed
  // "ready" independently and disagreed. This also guards the case where
  // ediErrors hasn't been computed yet (shouldn't throw).
  it('does not throw when ediErrors is undefined (not yet validated)', () => {
    const claim = makeCompleteClaim({ eligibilityStatus: 'eligible', ediErrors: undefined });
    expect(() => isEdiReady(claim)).not.toThrow();
    expect(isEdiReady(claim)).toBeFalsy();
  });
});