import { useState, useEffect } from 'react';
import { loadEvents, EVENTS_CHANGED } from '../lib/eventStorage';
import { fetchEventsFromCloud, saveEventsToCloud } from '../lib/userService';

export function useEvents() {
  const [events, setEvents] = useState(loadEvents);

  // 同じブラウザ内での変更をリッスン（管理者がイベントを編集したとき）
  useEffect(() => {
    const h = () => setEvents(loadEvents());
    window.addEventListener(EVENTS_CHANGED, h);
    return () => window.removeEventListener(EVENTS_CHANGED, h);
  }, []);

  // 起動時にFirestoreから最新データを取得（他デバイスの管理者更新を反映）
  useEffect(() => {
    fetchEventsFromCloud().then(cloudEvents => {
      if (cloudEvents === null) {
        // Firestoreが空 → デフォルトをシード
        saveEventsToCloud(loadEvents());
      } else {
        localStorage.setItem("cp_events", JSON.stringify(cloudEvents));
        setEvents(cloudEvents);
      }
    });
  }, []);

  return events;
}
