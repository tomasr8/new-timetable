import { EntryWithPosition } from "./Entry";
import { Entry } from "./types";

function overlap(a: Entry, b: Entry) {
  const aEnd = a.startDt.clone().add(a.duration, "minutes");
  const bEnd = b.startDt.clone().add(b.duration, "minutes");
  return a.startDt < bEnd && b.startDt < aEnd;
}

export function layout(entries: EntryWithPosition[]) {
  const groups = getGroups(entries);
  // console.log("groups", groups);
  let newEntries = [];
  for (const group of groups) {
    const groupEntries = entries.filter((entry) => group.has(entry.id));
    newEntries = [...newEntries, ...layoutGroup(groupEntries)];
  }
  console.log(newEntries)
  return newEntries;
}

export function layoutGroup(group: EntryWithPosition[]) {
  // const columns = 2; // TODO: calculate based on max number of parallel entries in the group
  // const columnWidth = 100 / columns;
  const sortedGroup = [...group].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  const newGroup = [];
  for (const entry of sortedGroup) {
    const overlappingEntries = newGroup.filter((e) => overlap(e, entry));
    const maxColumn = Math.max(...overlappingEntries.map((e) => e.column), 0);
    const newColumn = overlappingEntries.length === 0 ? 0 : maxColumn + 1;
    newGroup.push({
      ...entry,
      column: newColumn,
    });
  }
  const maxColumn = getMaximumParallelEntries(newGroup);
  // console.log("maxColumn", maxColumn);
  const columnWidth = 100 / (maxColumn + 1);
  return newGroup.map((entry) => ({
    ...entry,
    width: `${columnWidth}%`,
    x: `${entry.column * columnWidth}%`,
    maxColumn,
  }));
}

export function getGroups(entries: EntryWithPosition[]) {
  const groups: Set<number>[] = [];
  const seen = new Set<number>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }

    const group = new Set<number>();
    group.add(entry.id);
    seen.add(entry.id);
    dfs(entry, entries, group, seen);
    groups.push(group);
  }

  return groups;
}

function dfs(
  curr: Entry,
  entries: EntryWithPosition[],
  group: Set<number>,
  seen: Set<number>
) {
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }

    if (overlap(curr, entry)) {
      seen.add(entry.id);
      group.add(entry.id);
      dfs(entry, entries, group, seen);
    }
  }
}

function getMaximumParallelEntries(entries: EntryWithPosition[]) {
  return Math.max(...entries.map((entry) => entry.column), 0);
}

function dxToColumn(dx: number, columnWidth: number) {
  return Math.round(dx / columnWidth);
}

export function getParallelEntries(
  entry: EntryWithPosition,
  entries: EntryWithPosition[]
) {
  return entries.filter((e) => overlap(e, entry));
}
