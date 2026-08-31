import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";
import { MY_BOARDS, CREATE_BOARD, DELETE_BOARD } from "../graphql/operations";
import { useAuth } from "../auth/AuthContext";

interface BoardListItem {
  id: string;
  name: string;
  createdAt: string;
}

export default function BoardsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const { data, loading } = useQuery(MY_BOARDS);
  const [createBoard] = useMutation(CREATE_BOARD, { refetchQueries: [MY_BOARDS] });
  const [deleteBoard] = useMutation(DELETE_BOARD, { refetchQueries: [MY_BOARDS] });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createBoard({ variables: { name: name.trim() } });
    setName("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>DevBoard</h1>
        <div className="topbar-right">
          <span>Hi, {user?.username}</span>
          <button className="ghost" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="boards-main">
        <form className="new-board" onSubmit={handleCreate}>
          <input
            placeholder="New board name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Create board</button>
        </form>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="board-grid">
            {data?.myBoards?.map((b: BoardListItem) => (
              <div className="board-tile" key={b.id}>
                <Link to={`/board/${b.id}`} className="board-tile-link">
                  <h3>{b.name}</h3>
                </Link>
                <button
                  className="danger-sm"
                  onClick={() => deleteBoard({ variables: { id: b.id } })}
                >
                  Delete
                </button>
              </div>
            ))}
            {data?.myBoards?.length === 0 && <p>No boards yet. Create your first one!</p>}
          </div>
        )}
      </main>
    </div>
  );
}
