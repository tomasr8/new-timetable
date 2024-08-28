// import momentjs
import {
  useEffect,
  useRef,
  useState,
  MouseEvent as SyntheticMouseEvent,
} from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import moment, { Moment } from "moment";

import { minutesToPixels, pixelsToMinutes } from "./util";
import { layout } from "./layout";
import { ChildEntry, ContribEntry, BreakEntry, BlockEntry } from "./types";

interface _DraggableEntryProps {
  setDuration: (duration: number) => void;
  setChildren: (children: ChildEntry[]) => void;
  parentEndDt?: moment.Moment;
}

type DraggableEntryProps = _DraggableEntryProps & (ContribEntry | BreakEntry);
type DraggableBlockEntryProps = _DraggableEntryProps & BlockEntry;

function ResizeHandle({
  duration,
  minDuration,
  maxDuration,
  resizeStartRef,
  setLocalDuration,
  setGlobalDuration,
  setIsResizing,
}: {
  duration: number;
  minDuration?: number;
  maxDuration?: number;
  resizeStartRef: React.MutableRefObject<number | null>;
  setLocalDuration: (d: number) => void;
  setGlobalDuration: (d: number) => void;
  setIsResizing: (b: boolean) => void;
}) {
  function resizeHandler(e: SyntheticMouseEvent) {
    resizeStartRef.current = e.clientY;
    document.body.style.cursor = "ns-resize";
    setIsResizing(true);

    function mouseMoveHandler(e: MouseEvent) {
      if (resizeStartRef.current === null) {
        return;
      }

      const dy = e.clientY - resizeStartRef.current;
      const newDuration = duration + pixelsToMinutes(dy);
      if (newDuration >= 10) {
        setLocalDuration(newDuration);
      }
    }

    const mouseUpHandler = (e: MouseEvent) => {
      document.removeEventListener("mouseup", mouseUpHandler);
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.body.style.cursor = "";

      if (resizeStartRef.current === null) {
        return;
      }

      const dy = e.clientY - resizeStartRef.current;
      const newDuration = duration + pixelsToMinutes(dy);

      if (
        (minDuration && newDuration < minDuration) ||
        (maxDuration && newDuration > maxDuration)
      ) {
        setLocalDuration(duration); // reset to original duration
      } else if (newDuration >= 10) {
        setGlobalDuration(newDuration);
      }
      setIsResizing(false);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  return <div className="resize-handle" onMouseDown={resizeHandler}></div>;
}

export function DraggableEntry({
  type,
  id,
  startDt,
  duration: _duration,
  title,
  x,
  y,
  width,
  column,
  maxColumn,
  setDuration: _setDuration,
  parentEndDt,
}: DraggableEntryProps) {
  const resizeStartRef = useRef<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [duration, setDuration] = useState(_duration);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
    });
  let style: Record<string, string | number | undefined> = transform
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
    width: column === maxColumn ? width : `calc(${width} - 6px)`,
    height: minutesToPixels(duration),
    zIndex: isResizing ? 900 : style.zIndex,
    cursor: isResizing ? undefined : isDragging ? "grabbing" : "grab",
  };

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  return (
    <button
      className={`entry ${type === "break" ? "break" : ""}`}
      style={style}
    >
      <div
        className="drag-handle"
        ref={setNodeRef}
        {...listeners}
        {...attributes}
      >
        <ContributionTitle
          title={title}
          start={newStart}
          end={newEnd}
          duration={duration}
        />
      </div>
      <ResizeHandle
        duration={duration}
        maxDuration={parentEndDt?.diff(startDt, "minutes")}
        resizeStartRef={resizeStartRef}
        setLocalDuration={setDuration}
        setGlobalDuration={_setDuration}
        setIsResizing={setIsResizing}
      />
    </button>
  );
}

function ContributionTitle({
  title,
  start,
  end,
  duration,
}: {
  title: string;
  start: string;
  end: string;
  duration: number;
}) {
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
  children: _children,
  setDuration: _setDuration,
  setChildren: _setChildren,
}: DraggableBlockEntryProps) {
  const mouseEventRef = useRef<MouseEvent | null>(null);
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
  let style: Record<string, string | number | undefined> = transform
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
    width: column === maxColumn ? width : `calc(${width} - 6px)`,
    height: minutesToPixels(duration),
    textAlign: "left",
    zIndex: isResizing ? 900 : style.zIndex,
  };

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      mouseEventRef.current = event;
    }

    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const deltaMinutes = pixelsToMinutes(transform?.y || 0);
  const newStart = moment(startDt).add(deltaMinutes, "minutes").format("HH:mm");
  const newEnd = moment(startDt)
    .add(deltaMinutes + duration, "minutes")
    .format("HH:mm");

  // shift children startDt by deltaMinutes
  const children = _children.map((child) => ({
    ...child,
    startDt: moment(child.startDt).add(deltaMinutes, "minutes"),
  }));

  const makeSetDuration = (id: number) => (d: number) => {
    _setChildren(
      layout(
        children.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              duration: moment(entry.startDt)
                .add(d, "minutes")
                .isBefore(moment(startDt).add(duration, "minutes"))
                ? d
                : entry.duration,
            };
          }
          return entry;
        })
      )
    );
  };

  const latestChildEndDt = children.reduce((acc, child) => {
    const endDt = moment(child.startDt).add(child.duration, "minutes");
    return endDt.isAfter(acc) ? endDt : acc;
  }, moment(startDt));

  return (
    <button className="entry block" style={style}>
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
        <SessionBlockTitle title={title} start={newStart} end={newEnd} />
      </div>
      <div
        ref={setDroppableNodeRef}
        style={{
          flexGrow: 1,
          position: "relative",
          borderRadius: 6,
        }}
      >
        {children.map((child) => (
          <DraggableEntry
            key={child.id}
            setChildren={() => {}}
            setDuration={makeSetDuration(child.id)}
            parentEndDt={moment(startDt).add(
              deltaMinutes + duration,
              "minutes"
            )}
            {...child}
          />
        ))}
      </div>
      {/* TODO cannot resize to be smaller than its contents */}
      <ResizeHandle
        duration={duration}
        minDuration={latestChildEndDt.diff(startDt, "minutes")}
        resizeStartRef={resizeStartRef}
        setLocalDuration={setDuration}
        setGlobalDuration={_setDuration}
        setIsResizing={setIsResizing}
      />
    </button>
  );
}

function SessionBlockTitle({
  title,
  start,
  end,
}: {
  title: string;
  start: string;
  end: string;
}) {
  return (
    <div>
      {title} ({start} - {end})
    </div>
  );
}
