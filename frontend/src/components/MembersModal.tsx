import { useState } from "react";
import { useMutation } from "@apollo/client";
import { ADD_MEMBER } from "../graphql/operations";

export interface Member {
  user: { id: string; username: string };
  role: string;
}

interface Props {
  boardId: string;
  members: Member[];
  onClose: () => void;
}

const ROLE_BADGE: Record<string, string> = { owner: "👑", member: "👤" };

export default function MembersModal({ boardId, members, onClose }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const [addMember, { loading }] = useMutation(ADD_MEMBER, {
    onError: (err) => setError(err.message),
    onCompleted: () => setInput(""),
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError("");
    await addMember({ variables: { boardId, usernameOrEmail: input.trim() } });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Board members</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <ul className="member-list">
          {members.map((m) => (
            <li key={m.user.id} className="member-row">
              <span className="avatar">{m.user.username[0].toUpperCase()}</span>
              <span className="member-name">{m.user.username}</span>
              <span className="member-role">{ROLE_BADGE[m.role] ?? m.role}</span>
            </li>
          ))}
        </ul>

        <form className="field" onSubmit={handleInvite}>
          <span>Invite by username or email</span>
          <div className="invite-row">
            <input
              placeholder="username or email…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "…" : "Invite"}
            </button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
