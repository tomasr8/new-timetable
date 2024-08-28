import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  useDroppable,
  pointerWithin,
  DragEndEvent,
} from "@dnd-kit/core";
import { createSnapModifier } from "@dnd-kit/modifiers";
import moment from "moment";

import "./App.scss";

import { DraggableBlockEntry, DraggableEntry } from "./Entry";
import { minutesToPixels, pixelsToMinutes } from "./util";
import { getGroup, layout, layoutGroupAfterMove } from "./layout";
import { BlockEntry, ChildEntry, TopLevelEntry } from "./types";

const dummyEntries: TopLevelEntry[] = [
  {
    type: "break",
    id: 1,
    title: "Lunch break",
    startDt: moment("2024-01-01T05:00:00"),
    duration: 60,
    x: 0,
    y: minutesToPixels(300),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "contrib",
    id: 2,
    title: "Keynote",
    startDt: moment("2024-01-01T07:00:00"),
    duration: 60,
    x: 0,
    y: minutesToPixels(420),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "contrib",
    id: 3,
    title: "Workshop 2",
    startDt: moment("2024-01-01T03:00:00"),
    duration: 30,
    x: 0,
    y: minutesToPixels(180),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "contrib",
    id: 4,
    title: "Meeting 2",
    startDt: moment("2024-01-01T06:00:00"),
    duration: 30,
    x: 0,
    y: minutesToPixels(360),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "contrib",
    id: 5,
    title: "Workshop 1",
    startDt: moment("2024-01-01T03:30:00"),
    duration: 30,
    x: 0,
    y: minutesToPixels(210),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "contrib",
    id: 6,
    title: "Meeting 1",
    startDt: moment("2024-01-01T06:30:00"),
    duration: 30,
    x: 0,
    y: minutesToPixels(390),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
  {
    type: "block",
    id: 7,
    title: "Scientific Computing",
    startDt: moment("2024-01-01T06:00:00"),
    duration: 120,
    x: 0,
    y: minutesToPixels(360),
    width: "100%",
    column: 0,
    maxColumn: 0,
    children: [
      {
        type: "contrib",
        id: 8,
        parentId: 7,
        title: "Scientific Computing 1",
        startDt: moment("2024-01-01T06:00:00"),
        duration: 60,
        x: 0,
        y: minutesToPixels(0),
        width: "100%",
        column: 0,
        maxColumn: 0,
      },
      {
        type: "contrib",
        id: 9,
        parentId: 7,
        title: "Scientific Computing 2",
        startDt: moment("2024-01-01T07:00:00"),
        duration: 60,
        x: 0,
        y: minutesToPixels(60),
        width: "100%",
        column: 0,
        maxColumn: 0,
      },
    ],
  },
  {
    type: "block",
    id: 10,
    title: "HPC",
    startDt: moment("2024-01-01T08:00:00"),
    duration: 120,
    x: 0,
    y: minutesToPixels(480),
    width: "100%",
    column: 0,
    maxColumn: 0,
    children: [
      {
        type: "contrib",
        id: 11,
        parentId: 10,
        title: "HPC 1",
        startDt: moment("2024-01-01T08:00:00"),
        duration: 60,
        x: 0,
        y: minutesToPixels(0),
        width: "100%",
        column: 0,
        maxColumn: 0,
      },
      {
        type: "contrib",
        id: 12,
        parentId: 10,
        title: "HPC 2",
        startDt: moment("2024-01-01T09:00:00"),
        duration: 60,
        x: 0,
        y: minutesToPixels(60),
        width: "100%",
        column: 0,
        maxColumn: 0,
      },
    ],
  },
  {
    type: "break",
    id: 13,
    title: "Break",
    startDt: moment("2024-01-01T04:00:00"),
    duration: 30,
    x: 0,
    y: minutesToPixels(240),
    width: "100%",
    column: 0,
    maxColumn: 0,
  },
];

export default function App() {
  const mouseEventRef = useRef<MouseEvent | null>(null);
  const gridSize = minutesToPixels(5);
  const snapToGridModifier = createSnapModifier(gridSize);
  const [entries, setEntries] = useState<TopLevelEntry[]>(layout(dummyEntries));

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      mouseEventRef.current = event;
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const makeSetDuration = (id: number) => (duration: number) => {
    setEntries((entries) =>
      layout(
        entries.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              duration,
            };
          }
          return entry;
        })
      )
    );
  };

  const makeSetChildren = (id: number) => (children: ChildEntry[]) => {
    setEntries((entries) =>
      layout(
        entries.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              children,
            };
          }
          return entry;
        })
      )
    );
  };

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      modifiers={[snapToGridModifier]}
      collisionDetection={pointerWithin}
    >
      <div style={{ display: "flex" }}>
        <TimeGutter />
        <DnDCalendar>
          {entries.map((entry) =>
            entry.type === "block" ? (
              <DraggableBlockEntry
                key={entry.id}
                setDuration={makeSetDuration(entry.id)}
                setChildren={makeSetChildren(entry.id)}
                {...entry}
              />
            ) : (
              <DraggableEntry
                key={entry.id}
                setDuration={makeSetDuration(entry.id)}
                setChildren={makeSetChildren(entry.id)}
                {...entry}
              />
            )
          )}
        </DnDCalendar>
      </div>
    </DndContext>
  );

  function handleDragEnd(event: DragEndEvent) {
    if (event?.over?.id === "calendar") {
      handleDropOnCalendar(event);
    } else {
      handleDropOnBlock(event);
    }
  }

  function handleDropOnCalendar(event: DragEndEvent) {
    if (!event.over) {
      return; // not over any droppable area, the item will return back to its original position
    }

    if (mouseEventRef.current === null) {
      return;
    }

    const { id } = event.active;
    const { x, y } = event.delta;
    const deltaMinutes = pixelsToMinutes(y);
    const mousePosition =
      (mouseEventRef.current.pageX - event.over.rect.left) /
      event.over.rect.width;

    let entry = entries.find((entry) => entry.id === id);
    let fromBlock: BlockEntry | undefined;
    if (!entry) {
      // maybe a break from inside a block
      fromBlock = entries
        .filter((e) => e.type === "block")
        .find((b) => b.children.find((c) => c.id === id));

      if (!fromBlock) {
        return;
      }

      entry = fromBlock.children.find((c) => c.id === id);
      if (!entry || entry.type !== "break") {
        return;
      }
    }
    entry = {
      ...entry,
      startDt: moment(entry.startDt).add(deltaMinutes, "minutes"),
      x: entry.x + x,
      // y: entry.y + y,
      y: minutesToPixels(
        moment(entry.startDt)
          .add(deltaMinutes, "minutes")
          .diff(moment(entry.startDt).startOf("day"), "minutes")
      ),
    };
    if (entry.type === "block") {
      entry = {
        ...entry,
        children: entry.children.map((e) => ({
          ...e,
          startDt: moment(e.startDt).add(deltaMinutes, "minutes"),
        })),
      };
    }

    const groupIds = getGroup(
      entry,
      entries.filter((e) => e.id !== entry.id)
    );
    let group = entries.filter((e) => groupIds.has(e.id));
    group = layoutGroupAfterMove(group, entry, mousePosition);

    if (!fromBlock) {
      const otherEntries = entries.filter(
        (e) => !groupIds.has(e.id) && e.id !== entry.id
      );
      setEntries(layout([...otherEntries, ...group]));
    } else {
      const otherEntries = entries.filter(
        (e) => !groupIds.has(e.id) && e.id !== entry.id && e.id !== fromBlock.id
      );
      const fromChildren = fromBlock.children.filter((e) => e.id !== entry.id);
      group = group.filter((e) => e.id !== fromBlock.id); // might contain the block
      setEntries(
        layout([
          ...otherEntries,
          ...group,
          { ...fromBlock, children: fromChildren },
        ])
      );
    }
  }

  function handleDropOnBlock(event: DragEndEvent) {
    if (!event.over) {
      return;
    }

    if (mouseEventRef.current === null) {
      return;
    }

    const overId = event.over.id;
    const toBlock: BlockEntry = entries.find(
      (entry) => entry.id === overId
    )! as BlockEntry;
    const fromBlock = entries
      .filter((e) => e.type === "block")
      .find((entry) => !!entry.children.find((c) => c.id === event.active.id));

    const { id } = event.active;
    const { x, y } = event.delta;
    const deltaMinutes = pixelsToMinutes(y);
    const mousePosition =
      (mouseEventRef.current.pageX - event.over.rect.left) /
      event.over.rect.width;

    let entry: ChildEntry | undefined;
    if (!fromBlock) {
      entry = entries.find((e) => e.id === event.active.id);
      if (!entry || entry.type !== "break") {
        return;
      }
    } else {
      entry = fromBlock.children.find((entry) => entry.id === id)!;
    }

    entry = {
      ...entry,
      startDt: moment(entry.startDt).add(deltaMinutes, "minutes"),
      x: entry.x + x,
      // y: entry.y + y,
      y: minutesToPixels(
        moment(entry.startDt)
          .add(deltaMinutes, "minutes")
          .diff(moment(toBlock.startDt), "minutes")
      ),
    };

    if (entry.startDt.isBefore(moment(toBlock.startDt))) {
      return;
    }
    if (
      moment(entry.startDt)
        .add(entry.duration, "minutes")
        .isAfter(moment(toBlock.startDt).add(toBlock.duration, "minutes"))
    ) {
      return;
    }

    const groupIds = getGroup(
      entry,
      toBlock.children.filter((e) => e.id !== entry.id)
    );
    let group = toBlock.children.filter((e) => groupIds.has(e.id));
    group = layoutGroupAfterMove(group, entry, mousePosition);

    const otherChildren = toBlock.children.filter(
      (e) => !groupIds.has(e.id) && e.id !== entry.id
    );

    if (!fromBlock) {
      setEntries(
        layout([
          ...entries.filter((e) => e.id !== entry.id && e.id !== toBlock.id),
          { ...toBlock, children: [...otherChildren, ...group] },
        ])
      );
    } else if (toBlock.id === fromBlock.id) {
      const otherEntries = entries.filter((e) => e.id !== toBlock.id);
      setEntries(
        layout([
          ...otherEntries,
          { ...toBlock, children: [...otherChildren, ...group] },
        ])
      );
    } else {
      const otherEntries = entries.filter(
        (e) => e.id !== toBlock.id && e.id !== fromBlock.id
      );
      const fromChildren = fromBlock.children.filter((e) => e.id !== entry.id);

      setEntries(
        layout([
          ...otherEntries,
          { ...fromBlock, children: fromChildren },
          { ...toBlock, children: [...otherChildren, ...group] },
        ])
      );
    }
  }
}

function DnDCalendar({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: "calendar",
  });

  return (
    <div ref={setNodeRef} className="calendar">
      {children}
    </div>
  );
}

function TimeGutter() {
  const hours = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div className="time-gutter">
      {hours.map((hour) => (
        <div key={hour} style={{ height: minutesToPixels(60) }}>
          {hour}:00
        </div>
      ))}
    </div>
  );
}
