import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  useDroppable,
  useDraggable,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import {
  createSnapModifier,
  snapCenterToCursor,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import moment from "moment";

import "./App.scss";

import {
  DraggableBlockEntry,
  DraggableEntry,
  Entry,
  EntryWithPosition,
} from "./Entry";
import { minutesToPixels, pixelsToMinutes } from "./util";
import { getGroup, getGroups, layout, layoutGroupAfterMove } from "./layout";

function App() {
  // const [isDropped, setIsDropped] = useState(false);
  // const mouseSensor = useSensor(MouseSensor, {
  //   activationConstraint: {
  //     distance: 0,
  //   },
  // });
  // const sensors = useSensors(mouseSensor);
  // const draggableMarkup = <Draggable>Lunch break, 11-12</Draggable>;
  const wrapperRef = useRef(null);
  const mouseEventRef = useRef(null);
  const gridSize = minutesToPixels(5); // pixels
  const snapToGridModifier = createSnapModifier(gridSize);
  const _entries: EntryWithPosition[] = [
    {
      type: "contrib",
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
  const [entries, setEntries] = useState<EntryWithPosition[]>(layout(_entries));

  // console.log("entries", entries);
  // console.log("getGroups", getGroups(entries));

  useEffect(() => {
    function onMouseMove(event) {
      mouseEventRef.current = event;
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const makeSetDuration = (id) => (duration) => {
    // console.log("make setting duration", duration);
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

  const makeSetChildren = (id) => (children) => {
    // console.log("setting children", children);
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

  console.log(entries);

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      // sensors={sensors}
      modifiers={[
        snapToGridModifier,
        // restrictToParentElement,
        // snapCenterToCursor
      ]}
      collisionDetection={pointerWithin}
    >
      <div style={{ display: "flex" }}>
        <TimeGutter />
        <div ref={wrapperRef}>
          <DroppableCalendar>
            {entries.map((entry) =>
              entry.children ? (
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
          </DroppableCalendar>
        </div>
      </div>
    </DndContext>
  );

  function handleDragStart(event) {
    // console.log("event start", event);
  }

  function handleDragEnd(event) {
    // console.log("event", event, mouseRef.current.pageX);
    // console.log("event", event);
    // console.log(
    //   "mouse",
    //   mouseEventRef.current.pageX - event.over.rect.left,
    //   event.delta.y
    // );
    // console.log(
    //   "mouse position",
    //   mouseEventRef.current.pageX - wrapperRef.current.offsetLeft,
    //   // get the width of wrapperRef
    //   wrapperRef.current.offsetWidth
    // );
    if (!event.over) {
      console.log("not over anything..");
      return;
    }
    if (event.over.id === "calendar") {
      const mousePosition =
        (mouseEventRef.current.pageX - wrapperRef.current.offsetLeft) /
        wrapperRef.current.offsetWidth;
      const { id } = event.active;
      const { x, y } = event.delta;
      // const dx = x / 800; // Change this
      const deltaMinutes = pixelsToMinutes(y);
      // console.log("x", x, "y", y);
      let entry = entries.find((entry) => entry.id === id);
      let fromBlock;
      if (!entry) {
        // maybe a break from inside a block
        fromBlock = entries.find(
          (b) => b.type === "block" && b.children.find((c) => c.id === id)
        );

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

        children: entry.children
          ? entry.children.map((e) => ({
              ...e,
              startDt: moment(e.startDt).add(deltaMinutes, "minutes"),
            }))
          : entry.children,
      };
      // console.log("new entry start", entry.startDt.format("HH:mm"));
      const groupIds = getGroup(
        entry,
        entries.filter((e) => e.id !== entry.id)
      );
      let group = entries.filter((e) => groupIds.has(e.id));
      // console.log(
      //   "new group",
      //   group.map((e) => e.title)
      // );
      group = layoutGroupAfterMove(group, entry, mousePosition);

      if (!fromBlock) {
        const otherEntries = entries.filter(
          (e) => !groupIds.has(e.id) && e.id !== entry.id
        );
        setEntries(layout([...otherEntries, ...group]));
      } else {
        const otherEntries = entries.filter(
          (e) =>
            !groupIds.has(e.id) && e.id !== entry.id && e.id !== fromBlock.id
        );
        const fromChildren = fromBlock.children.filter(
          (e) => e.id !== entry.id
        );
        group = group.filter((e) => e.id !== fromBlock.id); // might contain the block
        setEntries(
          layout([
            ...otherEntries,
            ...group,
            { ...fromBlock, children: fromChildren },
          ])
        );
      }
    } else {
      // const id = event.over.id;
      const toBlock = entries.find((entry) => entry.id === event.over.id)!;
      const fromBlock = entries
        .filter((e) => !!e.children)
        .find(
          (entry) => !!entry.children.find((c) => c.id === event.active.id)
        );

      console.log("from block", fromBlock?.id, "to block", toBlock.id);
      const mousePosition =
        (mouseEventRef.current.pageX - event.over.rect.left) /
        event.over.rect.width;
      const { id } = event.active;
      const { x, y } = event.delta;
      // const dx = x / 800; // Change this
      const deltaMinutes = pixelsToMinutes(y);

      let entry;
      if (!fromBlock) {
        entry = entries.find((e) => e.id === event.active.id);
        if (!entry || entry.type !== "break") {
          console.log("can only drop from other blocks");
          return;
        }
      } else {
        entry = fromBlock.children.find((entry) => entry.id === id)!;
      }

      // console.log("x", x, "y", y);
      // if (!entry) {
      //   console.log("can only handle entries from the same block for now");
      //   return;
      // }
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

      console.log("here!");
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
      // console.log('here still!')

      // console.log("new entry start", entry.startDt.format("HH:mm"));
      const groupIds = getGroup(
        entry,
        toBlock.children.filter((e) => e.id !== entry.id)
      );
      let group = toBlock.children.filter((e) => groupIds.has(e.id));
      // console.log(
      //   "new group",
      //   group.map((e) => e.title)
      // );
      group = layoutGroupAfterMove(group, entry, mousePosition);

      // console.log("after move", group);
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
        // console.log("other  entries", otherEntries);
        // console.log([...otherEntries, ...group]);
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
        const fromChildren = fromBlock.children.filter(
          (e) => e.id !== entry.id
        );

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
}

export default App;

function DroppableCalendar(props) {
  const { setNodeRef } = useDroppable({
    id: "calendar",
  });

  return (
    <div ref={setNodeRef} className="calendar">
      {props.children}
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
