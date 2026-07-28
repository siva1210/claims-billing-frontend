const STORAGE_KEY = 'edi_control_number';

export function getNextControlNumber() {
  const current = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}