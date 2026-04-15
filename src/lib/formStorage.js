const FORMS_KEY = "cp_event_forms";

export function loadForms() {
  try { return JSON.parse(localStorage.getItem(FORMS_KEY)) || {}; }
  catch { return {}; }
}

export function saveForm(eventId, config) {
  const all = loadForms();
  all[eventId] = config;
  localStorage.setItem(FORMS_KEY, JSON.stringify(all));
}

export function getForm(eventId) {
  return loadForms()[eventId] || null;
}

export function isFormActive(eventId) {
  const form = getForm(eventId);
  if (!form || !form.enabled) return false;
  const now = new Date();
  if (form.openDate && new Date(form.openDate) > now) return false;
  if (form.closeDate && new Date(form.closeDate + "T23:59:59") < now) return false;
  return true;
}
