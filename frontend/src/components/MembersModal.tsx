import { useState } from "react";
import { useMutation } from "@apollo/client";
import { ADD_MEMBER } from "../graphql/operations";

interface Member {
  user: { id: string; username: string };
  role: string;
}

interface Props {
  boardId: string;
  members: Member[];
  onClose: () => void;
}

export default function MembersModal({ boardId, members, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [addMember] = useMutation(ADD_MEMBER, {
    onCompleted: () => {
      setSearch("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    await addMember({ variables: { boardId, usernameOrEmail: search.trim() } });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Board members</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="member-list">
          {members.map((member) => (
            <div key={member.user.id} className="member-row">
              <span>{member.user.username}</span>
              <small>{member.role}</small>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="add-member-form">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Add by username or email"
          />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
}
