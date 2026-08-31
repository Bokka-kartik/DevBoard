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
  moved:   "⇄",
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

  // Merge initial query data.
  const allEntries: ActivityEntry[] = [
    ...entries,
    ...(data?.activityLog ?? []),
  ].reduce<ActivityEntry[]>((acc, e) => {
    if (!acc.find((x) => x.id === e.id)) acc.unshift(e);
    return acc;
  }, []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Prepend live events from subscription.
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
        {allEntries.map((e) => (
          <div key={e.id} className="activity-entry">
            <span className="activity-icon">{ACTION_ICON[e.action] ?? "·"}</span>
            <div className="activity-body">
              <span className="activity-who">{e.performedByUsername ?? "—"}</span>
              {" "}<span className="activity-action">{e.action}</span>
              {" "}<span className="activity-title">"{e.entityTitle}"</span>
              {e.details && <span className="activity-details"> {e.details}</span>}
            </div>
            <span className="activity-time">{formatTime(e.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
