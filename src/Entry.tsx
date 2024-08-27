// import momentjs
import React, { useEffect, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import moment from "moment";

import { minutesToPixels, pixelsToMinutes } from "./util";
import { layout } from "./layout";

export interface Entry {
  id: number;
  title: string;
  startDt: any;
  duration: number;
}

export interface ChildEntryWithPosition extends Entry {
  x: number;
  y: number;
  width: number | string;
  column: number;
  maxColumn: number;
}

export interface EntryWithPosition extends ChildEntryWithPosition {
  children?: ChildEntryWithPosition[];
}

export function TimetableEntry({ id, title, startDt, duration }: Entry) {
  const start = moment(startDt).format("HH:mm");
  const end = moment(startDt).add(duration, "minutes").format("HH:mm");

  return (
    <div style={{ backgroundColor: "blue", borderRadius: 8 }}>
      <div>
        {title} ({start} - {end})
      </div>
    </div>
  );
}

interface DraggableEntryProps extends EntryWithPosition {
  setDuration: (duration: number) => void;
  setChildren: (children: ChildEntryWithPosition[]) => void;
}

export function DraggableEntry({
  id,
  startDt,
  duration: _duration,
  title,
  x,
  y,
  width,
  column,
  maxColumn,
  children,
  setDuration: _setDuration,
}: DraggableEntryProps) {
  const resizeStartRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [duration, setDuration] = useState(_duration);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });
  let style: Record<string, any> = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 900,
      }
    : {};
  style = {
    ...style,
    position: "absolute",
    top: y,
    left: x,
    // width,
    width: column === maxColumn ? width : `calc(${width} - 6px)`,
    height: minutesToPixels(duration),
  };

  //   console.log("<rerender>", id, title, x, y);
  // console.log(document.body.style.cursor);

  const resizeHandler = (e) => {
    // e.stopPropagation();
    // console.log('ref', sidebarRef.current);
    resizeStartRef.current = e.clientY;
    document.body.style.cursor = "ns-resize";
    setIsResizing(true);

    function mouseMoveHandler(e) {
      // const dx = x - e.clientX; // Resize from left to right
      const dx = e.clientY - (resizeStartRef.current || 0); // Resix=ze from right to left
      const newWidth = duration + pixelsToMinutes(dx);

      if (newWidth >= 10) {
        setDuration(newWidth);
      }
    }

    const mouseUpHandler = (e) => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.body.style.cursor = "";
      const dx = e.clientY - (resizeStartRef.current || 0); // Resix=ze from right to left
      const newWidth = duration + pixelsToMinutes(dx);
      console.log("setting duration", newWidth);

      if (newWidth >= 10) {
        _setDuration(newWidth);
      }
      setIsResizing(false);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  const component = (
    <Contribution
      title={title}
      start={newStart}
      end={newEnd}
      duration={duration}
    />
  );

  return (
    <button
      // ref={setNodeRef}
      className="entry"
      style={style}
      // {...listeners}
      // {...attributes}
    >
      <div
        className="drag-handle"
        ref={setNodeRef}
        style={{
          cursor: isResizing ? undefined : isDragging ? "grabbing" : "grab",
        }}
        {...listeners}
        {...attributes}
      >
        {component}
      </div>
      <div className="resize-handle" onMouseDown={resizeHandler}></div>
    </button>
  );
}

function Contribution({ title, start, end, duration }) {
  if (duration <= 20) {
    return (
      <div style={{ whiteSpace: "nowrap" }}>
        {title}, {start} - {end}
      </div>
    );
  }
  return (
    <>
      <div>{title}</div>
      <div>
        {start} - {end}
      </div>
    </>
  );
}

export function DraggableBlockEntry({
  id,
  startDt,
  duration: _duration,
  title,
  x,
  y,
  width,
  column,
  maxColumn,
  children,
  setDuration: _setDuration,
  setChildren,
}: DraggableEntryProps) {
  if (!children) {
    throw new Error("Children is required");
  }

  const mouseEventRef = useRef(null);
  const resizeStartRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [duration, setDuration] = useState(_duration);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id,
  });
  let style: Record<string, any> = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 900,
      }
    : {};
  style = {
    ...style,
    position: "absolute",
    top: y,
    left: x,
    // width,
    width: column === maxColumn ? width : `calc(${width} - 6px)`,
    height: minutesToPixels(duration),
    // flexDirection: "column",
    textAlign: "left",
  };

  useEffect(() => {
    function onMouseMove(event) {
      mouseEventRef.current = event;
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const resizeHandler = (e) => {
    // e.stopPropagation();
    // console.log('ref', sidebarRef.current);
    resizeStartRef.current = e.clientY;
    document.body.style.cursor = "ns-resize";
    setIsResizing(true);

    function mouseMoveHandler(e) {
      // const dx = x - e.clientX; // Resize from left to right
      const dx = e.clientY - (resizeStartRef.current || 0); // Resix=ze from right to left
      const newWidth = duration + pixelsToMinutes(dx);

      if (newWidth >= 10) {
        setDuration(newWidth);
      }
    }

    const mouseUpHandler = (e) => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.body.style.cursor = "";
      const dx = e.clientY - (resizeStartRef.current || 0); // Resix=ze from right to left
      const newWidth = duration + pixelsToMinutes(dx);
      console.log("setting duration", newWidth);

      if (newWidth >= 10) {
        _setDuration(newWidth);
      }
      setIsResizing(false);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  const component = (
    <SessionBlock
      title={title}
      start={newStart}
      end={newEnd}
      duration={duration}
      children={children}
    />
  );

  const makeSetDuration = (id: number) => (duration: number) => {
    setChildren(
      layout(
        children.map((entry) => {
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
    <button
      className="entry"
      style={style}
      // {...listeners}
      // {...attributes}
    >
      <div
        className="drag-handle"
        ref={setNodeRef}
        style={{
          cursor: isResizing ? undefined : isDragging ? "grabbing" : "grab",
          width: 100,
        }}
        {...listeners}
        {...attributes}
      >
        {component}
      </div>
      <div
        ref={setDroppableNodeRef}
        style={{ backgroundColor: "purple", flexGrow: 1, position: "relative" }}
      >
        {children.map((child) => (
          <DraggableEntry
            key={child.id}
            setChildren={() => {}}
            setDuration={makeSetDuration(child.id)}
            {...child}
          />
        ))}
      </div>
      <div className="resize-handle" onMouseDown={resizeHandler}></div>
    </button>
  );
}

function SessionBlock({
  title,
  start,
  end,
  duration,
  children,
}: {
  title: string;
  start: string;
  end: string;
  duration: number;
  children: ChildEntryWithPosition[];
}) {
  return (
    <div>
      {"<B>"}
      {title} ({start} - {end})
    </div>
  );
}

function BlockChildren({ children }) {}
