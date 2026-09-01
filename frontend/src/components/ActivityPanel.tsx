import { useQuery, useSubscription } from "@apollo/client";
import { useState } from "react";
import { ACTIVITY_LOG, ACTIVITY_UPDATED } from "../graphql/operations";

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityTitle: string;
  details?: string;
  performedByUsername?: string;
  createdAt: string;
}

const ACTION_ICON: Record<string, string> = {
  created: "✦",
  updated: "✎",
  moved: "⇄",
  deleted: "✕",
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

interface Props {
  boardId: string;
  onClose: () => void;
}

export default function ActivityPanel({ boardId, onClose }: Props) {
  const { data, loading } = useQuery(ACTIVITY_LOG, {
    variables: { boardId, limit: 50 },
  });

  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  const allEntries: ActivityEntry[] = [...entries, ...(data?.activityLog ?? [])]
    .reduce<ActivityEntry[]>((acc, entry) => {
      if (!acc.find((item) => item.id === entry.id)) acc.unshift(entry);
      return acc;
    }, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useSubscription(ACTIVITY_UPDATED, {
    variables: { boardId },
    onData: ({ data: sub }) => {
      const entry = sub.data?.activityUpdated;
      if (entry) setEntries((prev) => [entry, ...prev]);
    },
  });

  return (
    <div className="activity-panel">
      <div className="activity-header">
        <span>Activity</span>
        <button className="ghost" onClick={onClose}>×</button>
      </div>
      <div className="activity-list">
        {loading && <p className="activity-empty">Loading…</p>}
        {!loading && allEntries.length === 0 && (
          <p className="activity-empty">No activity yet.</p>
        )}
        {allEntries.map((entry) => (
          <div key={entry.id} className="activity-entry">
            <span className="activity-icon">{ACTION_ICON[entry.action] ?? "·"}</span>
            <div className="activity-body">
              <span className="activity-who">{entry.performedByUsername ?? "—"}</span>
              <span className="activity-action"> {entry.action}</span>
              <span className="activity-title"> "{entry.entityTitle}"</span>
              {entry.details && <span className="activity-details"> {entry.details}</span>}
            </div>
            <span className="activity-time">{formatTime(entry.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
