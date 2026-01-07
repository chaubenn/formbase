/*
  Centralised PostgREST API client.
  - apiFetch wraps fetch with JWT and error handling
  - form/field/record helpers encapsulate CRUD
*/
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'redacted';
// JWT sent with every request (PostgREST auth)
const JWT_TOKEN = process.env.EXPO_PUBLIC_API_JWT || 'redacted';
// Kept for RLS/user-context columns where needed
const STUDENT_USERNAME = process.env.EXPO_PUBLIC_USERNAME || 'redacted';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };
  // Single fetch wrapper used across the app so headers/error handling stay consistent
  const res = await fetch(url, config);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) return null;
  return res.json();
}

export const formAPI = {
  async getAll() {
    return apiFetch('/form?select=*&order=id');
  },
  async getById(id) {
    const r = await apiFetch(`/form?id=eq.${id}&select=*`);
    return r?.[0] || null;
  },
  async create(form) {
    // username included for RLS policies on the backend
    const data = { ...form, username: STUDENT_USERNAME };
    return apiFetch('/form', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id, patch) {
    // Minimal patch; PostgREST merges columns sent in the body
    return apiFetch(`/form?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  },
  async delete(id) {
    return apiFetch(`/form?id=eq.${id}`, { method: 'DELETE' });
  },
};

export const fieldAPI = {
  async getByFormId(formId) {
    // Order by order_index so UI renders fields in a predictable sequence
    return apiFetch(`/field?form_id=eq.${formId}&select=*&order=order_index`);
  },
  async create(field) {
    // username stored with the field row for ownership/traceability
    const data = { ...field, username: STUDENT_USERNAME };
    return apiFetch('/field', { method: 'POST', body: JSON.stringify(data) });
  },
};

export const recordAPI = {
  async getByFormId(formId) {
    return apiFetch(`/record?form_id=eq.${formId}&select=*&order=id.desc`);
  },
  async query(formId, filterQuery) {
    // filterQuery is the PostgREST query string built from the Filter Builder
    const path = filterQuery ? `/record?form_id=eq.${formId}&${filterQuery}` : `/record?form_id=eq.${formId}`;
    return apiFetch(path + '&select=*');
  },
  async create(record) {
    // record.values is JSONB; backend accepts arbitrary fields here
    const data = { ...record, username: STUDENT_USERNAME };
    return apiFetch('/record', { method: 'POST', body: JSON.stringify(data) });
  },
  async delete(id) {
    return apiFetch(`/record?id=eq.${id}`, { method: 'DELETE' });
  },
};

export function getErrorMessage(error) {
  if (!error?.message) return 'Unknown error';
  if (error.message.includes('401')) return 'Authentication failed';
  if (error.message.includes('403')) return 'Access denied';
  if (error.message.includes('404')) return 'Not found';
  if (error.message.includes('409')) return 'Conflict';
  return error.message;
}


