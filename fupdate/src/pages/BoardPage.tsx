import { useEffect, useState, useMemo } from "react";
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BOARD,
  CREATE_COLUMN,
  CREATE_CARD,
  DELETE_CARD,
  MOVE_CARD,
  MOVE_COLUMN,
  BOARD_UPDATED,
} from "../graphql/operations";
import CardModal, { Member } from "../components/CardModal";
import MembersModal from "../components/MembersModal";
import ActivityPanel from "../components/ActivityPanel";

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
  filterText,
  filterLabel,
  filterAssigneeId,
}: {
  column: Column;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenCard: (card: Card) => void;
  filterText: string;
  filterLabel: string;
  filterAssigneeId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const visible = useMemo(() => column.cards.filter((c) => {
    if (filterText && !c.title.toLowerCase().includes(filterText.toLowerCase())) return false;
    if (filterLabel && !c.labels.includes(filterLabel)) return false;
    if (filterAssigneeId && c.assignee?.id !== filterAssigneeId) return false;
    return true;
  }), [column.cards, filterText, filterLabel, filterAssigneeId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCard(column.id, title.trim());
    setTitle("");
    setAdding(false);
  };

  return (
    <div className={`column ${isOver ? "column-over" : ""}`}>
      <h3 className="column-title">{column.title} <span className="col-count">{visible.length}</span></h3>
      <SortableContext
        items={visible.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="column-cards">
          {visible.map((c) => (
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
  const [showActivity, setShowActivity] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState("");

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
  const [moveColumn] = useMutation(MOVE_COLUMN);

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

    const activeId = String(active.id);
    const overId = String(over.id);

    // Column reorder: active is a column id.
    if (columns.some((c) => c.id === activeId)) {
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columns, oldIndex, newIndex);
        setColumns(reordered);
        await moveColumn({ variables: { id: activeId, toOrder: newIndex } });
      }
      return;
    }

    // Card move/reorder.
    const activeContainer = findContainer(activeId);
    if (!activeContainer) return;

    let finalColumns = columns;
    const col = columns.find((c) => c.id === activeContainer)!;
    const oldIndex = col.cards.findIndex((c) => c.id === activeId);
    const newIndex = col.cards.findIndex((c) => c.id === overId);

    if (newIndex >= 0 && oldIndex !== newIndex) {
      finalColumns = columns.map((c) =>
        c.id === activeContainer
          ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) }
          : c
      );
      setColumns(finalColumns);
    }

    const targetCol = finalColumns.find((c) =>
      c.cards.some((card) => card.id === activeId)
    )!;
    const toOrder = targetCol.cards.findIndex((c) => c.id === activeId);

    await moveCard({
      variables: { id: activeId, toColumnId: targetCol.id, toOrder },
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

  // Collect unique labels and members for filter dropdowns.
  const allLabels = [...new Set(columns.flatMap((c) => c.cards.flatMap((card) => card.labels)))];
  const allMembers: { id: string; username: string }[] = data.board.members?.map((m: any) => m.user) ?? [];

  return (
    <div className={`page board-page ${showActivity ? "with-activity" : ""}`}>
      <header className="topbar">
        <button className="ghost" onClick={() => navigate("/")}>← Boards</button>
        <h1>{data.board.name}</h1>
        <div className="topbar-right">
          <button className="ghost" onClick={() => setShowMembers(true)}>
            👥 {data.board.members?.length ?? 0}
          </button>
          <button className="ghost" onClick={() => setShowActivity((v) => !v)}>
            {showActivity ? "✕ Activity" : "⏱ Activity"}
          </button>
        </div>
      </header>

      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="🔍 Search cards…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <select value={filterLabel} onChange={(e) => setFilterLabel(e.target.value)}>
          <option value="">All labels</option>
          {allLabels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterAssigneeId} onChange={(e) => setFilterAssigneeId(e.target.value)}>
          <option value="">All assignees</option>
          {allMembers.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
        </select>
        {(filterText || filterLabel || filterAssigneeId) && (
          <button className="ghost" onClick={() => { setFilterText(""); setFilterLabel(""); setFilterAssigneeId(""); }}>
            Clear
          </button>
        )}
      </div>

      <div className="board-body">
        <DndContext
          sensors={sensors}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
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
                  filterText={filterText}
                  filterLabel={filterLabel}
                  filterAssigneeId={filterAssigneeId}
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
          </SortableContext>
        </DndContext>

        {showActivity && (
          <ActivityPanel boardId={id!} onClose={() => setShowActivity(false)} />
        )}
      </div>

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
