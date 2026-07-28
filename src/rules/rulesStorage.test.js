import { describe, it, expect } from 'vitest';
import { isDxFlagged, isFullyReady } from './rulesStorage';

function makeRule(overrides = {}) {
  return { id: '1', payer: 'Medicaid', level: '3.5', type: 'DX', code: 'F10.10', ...overrides };
}

function makeClaim(overrides = {}) {
  return {
    payer: { name: 'Medicaid' },
    asamLevel: '3.5',
    service: { diagnosisCode: 'F10.10' },
    eligibilityStatus: 'eligible',
    ediErrors: [],
    ...overrides
  };
}

describe('isDxFlagged', () => {
  it('flags a claim that matches a rule on payer, level, and DX code', () => {
    const rules = [makeRule()];
    expect(isDxFlagged(rules, makeClaim())).toBe(true);
  });

  it('does not flag when the payer differs', () => {
    const rules = [makeRule({ payer: 'Medicaid' })];
    const claim = makeClaim({ payer: { name: 'BCBS' } });
    expect(isDxFlagged(rules, claim)).toBe(false);
  });

  it('does not flag when the ASAM level differs', () => {
    const rules = [makeRule({ level: '3.5' })];
    const claim = makeClaim({ asamLevel: '2.1' });
    expect(isDxFlagged(rules, claim)).toBe(false);
  });

  it('does not flag when the diagnosis code differs', () => {
    const rules = [makeRule({ code: 'F10.10' })];
    const claim = makeClaim({ service: { diagnosisCode: 'F41.1' } });
    expect(isDxFlagged(rules, claim)).toBe(false);
  });

  it('does not flag against a CPT-type rule, even with matching payer/level/code', () => {
    const rules = [makeRule({ type: 'CPT', code: '90837' })];
    const claim = makeClaim({ service: { diagnosisCode: '90837' } });
    expect(isDxFlagged(rules, claim)).toBe(false);
  });

  it('returns false when there are no rules at all', () => {
    expect(isDxFlagged([], makeClaim())).toBe(false);
  });
});

describe('isFullyReady', () => {
  it('is true when EDI-ready and not rule-flagged', () => {
    const rules = [];
    expect(isFullyReady(makeClaim(), rules)).toBe(true);
  });

  it('is false when EDI-ready but rule-flagged', () => {
    const rules = [makeRule()]; // matches makeClaim() defaults
    expect(isFullyReady(makeClaim(), rules)).toBe(false);
  });

  it('is false when not EDI-ready, even with no matching rules', () => {
    const rules = [];
    const claim = makeClaim({ eligibilityStatus: 'not eligible' });
    expect(isFullyReady(claim, rules)).toBe(false);
  });

  it('is false when not EDI-ready AND rule-flagged (both reasons)', () => {
    const rules = [makeRule()];
    const claim = makeClaim({ ediErrors: ['Auth Number'] });
    expect(isFullyReady(claim, rules)).toBe(false);
  });
});