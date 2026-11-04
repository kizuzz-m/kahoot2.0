"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  questions: Question[];
  selectedId: string | null;
  invalidIds: Set<string>;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: () => void;
}

export function QuestionList({ questions, selectedId, invalidIds, onSelect, onReorder, onAdd }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = questions.findIndex((q) => q.id === e.active.id);
    const to = questions.findIndex((q) => q.id === e.over!.id);
    if (from >= 0 && to >= 0) onReorder(from, to);
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Leertaste zum Aufnehmen, Pfeiltasten zum Verschieben, Leertaste zum Ablegen, Escape zum Abbrechen.",
          },
        }}
      >
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-2">
            {questions.map((q, i) => (
              <SortableItem
                key={q.id}
                question={q}
                index={i}
                selected={q.id === selectedId}
                invalid={invalidIds.has(q.id)}
                onSelect={() => onSelect(q.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-2xl border-2 border-dashed border-line px-4 py-3 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand"
      >
        + Frage hinzufügen
      </button>
    </div>
  );
}

function SortableItem({
  question,
  index,
  selected,
  invalid,
  onSelect,
}: {
  question: Question;
  index: number;
  selected: boolean;
  invalid: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-stretch overflow-hidden rounded-2xl border bg-ink-2 transition-colors",
        selected ? "border-brand" : "border-line hover:border-muted/60",
        isDragging && "z-10 shadow-2xl shadow-black/50",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Frage ${index + 1} verschieben`}
        className="grid w-8 shrink-0 cursor-grab touch-none place-items-center text-muted hover:bg-white/5 active:cursor-grabbing"
      >
        <svg viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor" aria-hidden>
          {[2, 8, 14].flatMap((y) => [<circle key={`a${y}`} cx="2" cy={y} r="1.5" />, <circle key={`b${y}`} cx="8" cy={y} r="1.5" />])}
        </svg>
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 px-3 py-2.5 text-left">
        <span className="flex items-center gap-2 text-xs font-semibold text-muted">
          Frage {index + 1} · {question.timeLimit}s
          {invalid && <span className="h-2 w-2 rounded-full bg-a1" title="Unvollständig" />}
        </span>
        <span className="mt-0.5 block truncate text-sm font-medium">
          {question.text || <em className="text-muted">Ohne Fragetext</em>}
        </span>
      </button>
    </li>
  );
}
