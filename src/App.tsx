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
import { createSnapModifier, snapCenterToCursor } from "@dnd-kit/modifiers";
import moment from "moment";

import "./App.scss";

import { DraggableEntry, Entry, EntryWithPosition } from "./Entry";
import { minutesToPixels, pixelsToMinutes } from "./util";
import { getGroups, layout } from "./layout";

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
      id: 1,
      title: "Lunch break",
      startDt: moment("2024-01-01T05:00:00"),
      duration: 60,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(300),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
    {
      id: 2,
      title: "Keynote",
      startDt: moment("2024-01-01T07:00:00"),
      duration: 60,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(420),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
    {
      id: 3,
      title: "Workshop 2",
      startDt: moment("2024-01-01T03:00:00"),
      duration: 30,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(180),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
    {
      id: 4,
      title: "Meeting 2",
      startDt: moment("2024-01-01T06:00:00"),
      duration: 30,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(360),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
    {
      id: 5,
      title: "Workshop 1",
      startDt: moment("2024-01-01T03:30:00"),
      duration: 30,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(210),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
    {
      id: 6,
      title: "Meeting 1",
      startDt: moment("2024-01-01T06:30:00"),
      duration: 30,
      displayOrder: 0,
      x: 0,
      y: minutesToPixels(390),
      width: "100%",
      column: 0,
      maxColumn: 0,
    },
  ];
  const [entries, setEntries] = useState(_entries);

  console.log("entries", entries);
  console.log("getGroups", getGroups(entries));

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
    console.log("make setting duration", duration);
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

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      // sensors={sensors}
      modifiers={[snapToGridModifier]}
      collisionDetection={pointerWithin}
    >
      <div style={{ display: "flex" }}>
        <TimeGutter />
        <div ref={wrapperRef}>
          <DroppableCalendar>
            {entries.map((entry) => (
              <DraggableEntry
                key={entry.id}
                setDuration={makeSetDuration(entry.id)}
                {...entry}
              />
            ))}
          </DroppableCalendar>
        </div>
      </div>
    </DndContext>
  );

  function handleDragEnd(event) {
    // console.log("event", event);
    console.log(
      "mouse position",
      mouseEventRef.current.pageX - wrapperRef.current.offsetLeft,
      // get the width of wrapperRef
      wrapperRef.current.offsetWidth
    );
    if (event.over && event.over.id === "calendar") {
      console.log("Dropped");
      const { id } = event.active;
      const { x, y } = event.delta;
      const dx = x / 800; // Change this
      const deltaMinutes = pixelsToMinutes(y);
      console.log("x", x, "y", y);
      const newEntries = entries.map((entry) => {
        if (entry.id === id) {
          return {
            ...entry,
            startDt: moment(entry.startDt).add(deltaMinutes, "minutes"),
            x: entry.x + x,
            y: entry.y + y,
          };
        }
        return entry;
      });
      setEntries(layout(newEntries));
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
