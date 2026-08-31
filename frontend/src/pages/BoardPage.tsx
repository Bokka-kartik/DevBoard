import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  BOARD,
  CREATE_COLUMN,
  CREATE_CARD,
  DELETE_CARD,
  MOVE_CARD,
} from "../graphql/operations";
import CardModal, { Member } from "../components/CardModal";

interface Card {
  id: string;
  title: string;
  description?: string;
  order: number;
  labels: string[];
  dueDate?: string | null;
  assignee?: { id: string; username: string } | null;
}

interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

function DraggableCard({
  card,
  onDelete,
  onOpen,
}: {
  card: Card;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="card">
      <div className="card-body" {...attributes} {...listeners} onClick={onOpen}>
        <span className="card-title">{card.title}</span>
        {card.labels?.length > 0 && (
          <div className="card-labels">
            {card.labels.map((l) => (
              <span key={l} className="chip">{l}</span>
            ))}
          </div>
        )}
        {card.description && <p className="card-desc">{card.description}</p>}
        {(card.dueDate || card.assignee) && (
          <div className="card-meta">
            {card.dueDate && <span className="due">📅 {card.dueDate.slice(0, 10)}</span>}
            {card.assignee && (
              <span className="avatar" title={card.assignee.username}>
                {card.assignee.username[0].toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        className="card-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ×
      </button>
    </div>
  );
}

function DroppableColumn({
  column,
  onAddCard,
  onDeleteCard,
  onOpenCard,
}: {
  column: Column;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenCard: (card: Card) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCard(column.id, title.trim());
    setTitle("");
    setAdding(false);
  };

  return (
    <div ref={setNodeRef} className={`column ${isOver ? "column-over" : ""}`}>
      <h3 className="column-title">{column.title}</h3>
      <div className="column-cards">
        {column.cards.map((c) => (
          <DraggableCard
            key={c.id}
            card={c}
            onDelete={() => onDeleteCard(c.id)}
            onOpen={() => onOpenCard(c)}
          />
        ))}
      </div>
      {adding ? (
        <form onSubmit={submit} className="add-card-form">
          <input
            autoFocus
            placeholder="Card title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="add-card-actions">
            <button type="submit">Add</button>
            <button type="button" className="ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="add-card-btn" onClick={() => setAdding(true)}>
          + Add a card
        </button>
      )}
    </div>
  );
}

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, refetch } = useQuery(BOARD, { variables: { id } });

  const [columns, setColumns] = useState<Column[]>([]);
  const [newColumn, setNewColumn] = useState("");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [createColumn] = useMutation(CREATE_COLUMN, {
    refetchQueries: [{ query: BOARD, variables: { id } }],
  });
  const [createCard] = useMutation(CREATE_CARD, {
    refetchQueries: [{ query: BOARD, variables: { id } }],
  });
  const [deleteCard] = useMutation(DELETE_CARD, {
    refetchQueries: [{ query: BOARD, variables: { id } }],
  });
  const [moveCard] = useMutation(MOVE_CARD);

  useEffect(() => {
    if (data?.board?.columns) {
      setColumns(structuredClone(data.board.columns));
    }
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const targetColumnId = String(over.id);

    const sourceColumn = columns.find((col) => col.cards.some((c) => c.id === cardId));
    if (!sourceColumn || sourceColumn.id === targetColumnId) return;

    const card = sourceColumn.cards.find((c) => c.id === cardId)!;
    const targetColumn = columns.find((col) => col.id === targetColumnId)!;
    const toOrder = targetColumn.cards.length;

    // Optimistic local update.
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        if (col.id === targetColumnId) {
          return { ...col, cards: [...col.cards, card] };
        }
        return col;
      })
    );

    await moveCard({ variables: { id: cardId, toColumnId: targetColumnId, toOrder } });
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumn.trim()) return;
    await createColumn({ variables: { boardId: id, title: newColumn.trim() } });
    setNewColumn("");
  };

  if (loading) return <div className="page"><p>Loading board…</p></div>;
  if (!data?.board) return <div className="page"><p>Board not found.</p></div>;

  return (
    <div className="page board-page">
      <header className="topbar">
        <button className="ghost" onClick={() => navigate("/")}>← Boards</button>
        <h1>{data.board.name}</h1>
        <span />
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="columns">
          {columns.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              onAddCard={(columnId, title) =>
                createCard({ variables: { columnId, title } })
              }
              onDeleteCard={(cardId) => deleteCard({ variables: { id: cardId } })}
              onOpenCard={(card) => setSelectedCard(card)}
            />
          ))}

          <form className="add-column" onSubmit={handleAddColumn}>
            <input
              placeholder="+ Add column"
              value={newColumn}
              onChange={(e) => setNewColumn(e.target.value)}
            />
          </form>
        </div>
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          members={(data.board.members || []) as Member[]}
          onClose={() => setSelectedCard(null)}
          onSaved={() => refetch()}
          onDelete={(cardId) => deleteCard({ variables: { id: cardId } })}
        />
      )}
    </div>
  );
}
