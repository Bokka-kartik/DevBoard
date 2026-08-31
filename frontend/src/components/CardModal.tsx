import { useState } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_CARD } from "../graphql/operations";

export interface CardData {
  id: string;
  title: string;
  description?: string;
  labels: string[];
  dueDate?: string | null;
  assignee?: { id: string; username: string } | null;
}

export interface Member {
  user: { id: string; username: string };
  role: string;
}

interface Props {
  card: CardData;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
  onDelete: (id: string) => void;
}

// Converts an ISO date string to the yyyy-mm-dd value a date input expects.
const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

export default function CardModal({ card, members, onClose, onSaved, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [assigneeId, setAssigneeId] = useState(card.assignee?.id || "");
  const [dueDate, setDueDate] = useState(toDateInput(card.dueDate));
  const [labels, setLabels] = useState((card.labels || []).join(", "));

  const [updateCard, { loading }] = useMutation(UPDATE_CARD);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCard({
      variables: {
        id: card.id,
        title: title.trim(),
        description,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        labels: labels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
      },
    });
    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <div className="modal-header">
          <input
            className="modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description…"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Assignee</span>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.username}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>Labels (comma separated)</span>
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="bug, urgent, frontend"
          />
        </label>

        <div className="modal-actions">
          <button
            type="button"
            className="danger-sm"
            onClick={() => {
              onDelete(card.id);
              onClose();
            }}
          >
            Delete card
          </button>
          <div className="modal-actions-right">
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
