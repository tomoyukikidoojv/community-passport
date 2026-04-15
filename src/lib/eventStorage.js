import { EVENTS as DEFAULT_EVENTS } from '../constants';

const EVENTS_KEY = "cp_events";
export const EVENTS_CHANGED = "cp_events_changed";

export function loadEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(EVENTS_KEY));
    if (saved && saved.length > 0) return saved;
  } catch {}
  return DEFAULT_EVENTS;
}

export function saveEvents(events) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent(EVENTS_CHANGED));
}
