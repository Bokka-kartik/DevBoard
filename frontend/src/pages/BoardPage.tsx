import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BOARD,
  CREATE_COLUMN,
  CREATE_CARD,
  DELETE_CARD,
  MOVE_CARD,
  BOARD_UPDATED,
} from "../graphql/operations";
import CardModal, { Member } from "../components/CardModal";
import MembersModal from "../components/MembersModal";

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

function SortableCard({
  card,
  onDelete,
  onOpen,
}: {
  card: Card;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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

function Column({
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
    <div className={`column ${isOver ? "column-over" : ""}`}>
      <h3 className="column-title">{column.title}</h3>
      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-cards">
          {column.cards.map((c) => (
            <SortableCard
              key={c.id}
              card={c}
              onDelete={() => onDeleteCard(c.id)}
              onOpen={() => onOpenCard(c)}
            />
          ))}
        </div>
      </SortableContext>
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
  const [showMembers, setShowMembers] = useState(false);

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

  // Live updates: apply board changes pushed from other clients.
  useSubscription(BOARD_UPDATED, {
    variables: { boardId: id },
    onData: ({ data: sub }) => {
      const updated = sub.data?.boardUpdated;
      if (updated?.columns) {
        setColumns(structuredClone(updated.columns));
      }
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Resolves the column id that a draggable/droppable id belongs to.
  const findContainer = (itemId: string): string | undefined => {
    if (columns.some((col) => col.id === itemId)) return itemId;
    return columns.find((col) => col.cards.some((c) => c.id === itemId))?.id;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    const overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((prev) => {
      const activeCol = prev.find((c) => c.id === activeContainer)!;
      const overCol = prev.find((c) => c.id === overContainer)!;
      const activeCard = activeCol.cards.find((c) => c.id === active.id);
      if (!activeCard) return prev;

      const overIndex = overCol.cards.findIndex((c) => c.id === over.id);
      const insertIndex = overIndex >= 0 ? overIndex : overCol.cards.length;

      return prev.map((col) => {
        if (col.id === activeContainer) {
          return { ...col, cards: col.cards.filter((c) => c.id !== active.id) };
        }
        if (col.id === overContainer) {
          const next = [...col.cards];
          next.splice(insertIndex, 0, activeCard);
          return { ...col, cards: next };
        }
        return col;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(String(active.id));
    if (!activeContainer) return;

    let finalColumns = columns;
    const col = columns.find((c) => c.id === activeContainer)!;
    const oldIndex = col.cards.findIndex((c) => c.id === active.id);
    const newIndex = col.cards.findIndex((c) => c.id === over.id);

    if (newIndex >= 0 && oldIndex !== newIndex) {
      finalColumns = columns.map((c) =>
        c.id === activeContainer
          ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
          : c
      );
      setColumns(finalColumns);
    }

    const targetCol = finalColumns.find((c) =>
      c.cards.some((card) => card.id === active.id)
    )!;
    const toOrder = targetCol.cards.findIndex((c) => c.id === active.id);

    await moveCard({
      variables: { id: String(active.id), toColumnId: targetCol.id, toOrder },
    });
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
        <button className="ghost" onClick={() => setShowMembers(true)}>
          👥 {data.board.members?.length ?? 0} members
        </button>
      </header>

      <DndContext
        sensors={sensors}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="columns">
          {columns.map((col) => (
            <Column
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

      {showMembers && (
        <MembersModal
          boardId={id!}
          members={data.board.members || []}
          onClose={() => setShowMembers(false)}
        />
      )}
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
