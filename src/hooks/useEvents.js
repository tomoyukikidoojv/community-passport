import { useState, useEffect } from 'react';
import { loadEvents, EVENTS_CHANGED } from '../lib/eventStorage';

export function useEvents() {
  const [events, setEvents] = useState(loadEvents);
  useEffect(() => {
    const h = () => setEvents(loadEvents());
    window.addEventListener(EVENTS_CHANGED, h);
    return () => window.removeEventListener(EVENTS_CHANGED, h);
  }, []);
  return events;
}
