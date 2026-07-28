// rules/rulesStorage.js
// Persists billing rules to localStorage, mirroring the C++ RulesEngine's
// loadRules/saveRules, but backed by browser storage instead of a CSV file.

const STORAGE_KEY = 'billing_rules';

export function loadRules() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRules(rules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addRule(rules, { payer, level, type, code }) {
  const newRule = {
    id: Date.now().toString(),
    payer,
    level,
    type,
    code
  };
  const updated = [...rules, newRule];
  saveRules(updated);
  return updated;
}

export function deleteRule(rules, id) {
  const updated = rules.filter(r => r.id !== id);
  saveRules(updated);
  return updated;
}

// Mirrors the C++ isInvalid(): a claim is flagged if a rule with the exact
// same payer/level/type/code combination exists. No match = not flagged.
export function isRuleFlagged(rules, { payer, level, type, code }) {
  return rules.some(r =>
    r.payer === payer &&
    r.level === level &&
    r.type === type &&
    r.code === code
  );
}

// Checks a claim against DX rules only, matching the original C++
// validateAll() call site behavior. Uses the claim's actual payer
// (the C++ version hardcoded "Medicaid" regardless of the claim's
// real payer — using the real payer here is a deliberate improvement).
export function isDxFlagged(rules, claim) {
  return isRuleFlagged(rules, {
    payer: claim.payer.name,
    level: claim.asamLevel,
    type: "DX",
    code: claim.service.diagnosisCode
  });
}
import { isEdiReady } from '../validation/claimValidation';

// Single source of truth for "will this claim actually make it into
// the generated EDI file" — combines structural EDI-readiness with
// rule compliance. Use this everywhere instead of checking isEdiReady
// and isDxFlagged separately, to avoid them drifting out of sync.
export function isFullyReady(claim, rules) {
  return isEdiReady(claim) && !isDxFlagged(rules, claim);
}