/** Stable API _id: numeric id as string */
export const toApiId = (row) => {
  if (!row) return null;
  return String(row.id);
};

/**
 * Resolve SQL fragment for lookup by route :id (numeric id)
 * Returns { clause: 'id = ?', params: [n] }
 */
export const idLookup = (param) => {
  if (param == null || param === '') return null;
  const s = String(param);
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && String(n) === s) {
    return { clause: 'id = ?', params: [n] };
  }
  return { clause: 'id = ?', params: [n] };
};
