import { useState, useEffect } from 'react';
import { loadEvents, EVENTS_CHANGED } from '../lib/eventStorage';
import { fetchEventsFromCloud } from '../lib/userService';

export function useEvents() {
  const [events, setEvents] = useState(loadEvents);

  // 同じブラウザ内での変更をリッスン（管理者がイベントを編集したとき）
  useEffect(() => {
    const h = () => setEvents(loadEvents());
    window.addEventListener(EVENTS_CHANGED, h);
    return () => window.removeEventListener(EVENTS_CHANGED, h);
  }, []);

  // 起動時にFirestoreから最新データを取得（他デバイスの管理者更新を反映）
  // ⚠️ 安全ルール: Firestoreへの書き込みはここでは絶対に行わない
  //   - undefined (エラー)  → 何もしない（既存データを保護）
  //   - null (文書なし)     → 何もしない（管理者が保存するまで待つ）
  //   - 配列 (正常取得)     → ローカルを最新で上書き
  useEffect(() => {
    fetchEventsFromCloud().then(cloudEvents => {
      if (!cloudEvents) return; // undefined(エラー) or null(未設定) → スキップ
      localStorage.setItem("cp_events", JSON.stringify(cloudEvents));
      setEvents(cloudEvents);
    });
  }, []);

  return events;
}
