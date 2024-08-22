// import momentjs
import React, { useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import moment from "moment";

import { minutesToPixels, pixelsToMinutes } from "./util";

export interface Entry {
  id: number;
  title: string;
  startDt: any;
  duration: number;
}

export interface EntryWithPosition extends Entry {
  x: number;
  y: number;
  width: number | string;
  column: number;
  maxColumn: number;
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
}

export function DraggableEntry({
  id,
  startDt,
  duration: _duration,
  title,
  x,
  y,
  width,
  setDuration: _setDuration,
}: DraggableEntryProps) {
  const resizeStartRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(_duration);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
    width,
    height: minutesToPixels(duration),
  };

  //   console.log("<rerender>", id, title, x, y);
  // console.log(document.body.style.cursor);

  const resizeHandler = (e) => {
    // e.stopPropagation();
    // console.log('ref', sidebarRef.current);
    resizeStartRef.current = e.clientY;
    document.body.style.cursor = "ns-resize";
    setIsDragging(true);

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
      setIsDragging(false);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  };

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  let text;
  if (duration <= 20) {
    text = (
      <div>
        {title}, {newStart} - {newEnd}
      </div>
    );
  } else {
    text = (
      <>
        <div>{title}</div>
        <div>
          {newStart} - {newEnd}
        </div>
      </>
    );
  }

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
        style={{ cursor: isDragging ? undefined : "grab" }}
        {...listeners}
        {...attributes}
      >
        {text}
      </div>
      <div className="resize-handle" onMouseDown={resizeHandler}></div>
    </button>
  );
}
