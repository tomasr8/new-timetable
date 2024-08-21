// import momentjs
import React from "react";
import { useDraggable } from "@dnd-kit/core";
import moment from "moment";

import { minutesToPixels, pixelsToMinutes } from "./util";

export interface Entry {
  id: number;
  title: string;
  startDt: any;
  duration: number;
  displayOrder: number;
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

export function DraggableEntry({
  id,
  startDt,
  duration,
  title,
  x,
  y,
  width,
}: EntryWithPosition) {
  const start = moment(startDt).format("HH:mm");
  const end = moment(startDt).add(duration, "minutes").format("HH:mm");

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

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  return (
    <button
      ref={setNodeRef}
      className="entry"
      style={style}
      {...listeners}
      {...attributes}
    >
      <div>
        <div>{title}</div>
        <div>
          {newStart} - {newEnd}
        </div>
      </div>
    </button>
  );
}
