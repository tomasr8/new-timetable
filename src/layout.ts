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
  // console.log(newEntries);
  return newEntries;
}

export function layoutGroup(group: EntryWithPosition[]) {
  // const columns = 2; // TODO: calculate based on max number of parallel entries in the group
  // const columnWidth = 100 / columns;
  const sortedGroup = [...group].sort((a, b) => a.column - b.column);
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

export function layoutGroupAfterMove(
  group: EntryWithPosition[],
  newEntry: EntryWithPosition,
  mousePosition: number
) {
  const columnCounts = new Set(group.map((entry) => entry.maxColumn + 1));
  const newColumnCount = lcm(...columnCounts);
  group = group.map((entry) => ({
    ...entry,
    column: ((entry.column + 1) * newColumnCount) / (1 + entry.maxColumn) - 1,
    maxColumn: newColumnCount,
  }));
  console.log("newColumnCount", newColumnCount);
  console.log(
    "new columns",
    group.map((entry) => entry.column)
  );
  newEntry = {
    ...newEntry,
    column:
      ((newEntry.column + 1) * newColumnCount) / (1 + newEntry.maxColumn) - 1,
    maxColumn: newColumnCount,
  };

  const selectedColumn = Math.floor(newColumnCount * mousePosition);
  console.log(
    "selectedColumn",
    selectedColumn,
    newColumnCount * mousePosition,
    mousePosition
  );

  const rightToLeft = selectedColumn < newEntry.column;
  console.log("rightToLeft", rightToLeft);
  if (selectedColumn === 0) {
    group = group.map((entry) => ({
      ...entry,
      column: entry.column + 1,
    }));
  } else if (selectedColumn === newColumnCount - 1) {
  } else if (rightToLeft) {
    group = group.map((entry) => ({
      ...entry,
      column: entry.column < selectedColumn ? entry.column : entry.column + 1,
    }));
  } else {
    group = group.map((entry) => ({
      ...entry,
      column: entry.column <= selectedColumn ? entry.column : entry.column + 1,
    }));
  }

  // group = group.map((entry) => ({
  //   ...entry,
  //   column:
  //     selectedColumn === 0
  //       ? entry.column + 1
  //       : entry.column < selectedColumn
  //       ? entry.column
  //       : entry.column + 1,
  // }));
  console.log(
    "after",
    group.map((entry) => entry.column)
  );
  console.log(
    "newEntry.column",
    rightToLeft ? selectedColumn : selectedColumn + 1
  );
  group = [
    ...group,
    {
      ...newEntry,
      column: rightToLeft ? selectedColumn : selectedColumn + 1,
      maxColumn: newColumnCount,
    },
  ];
  // const columns = 2; // TODO: calculate based on max number of parallel entries in the group
  // const columnWidth = 100 / columns;
  const sortedGroup = [...group].sort((a, b) => a.column - b.column);
  console.log(
    "sorted",
    sortedGroup.map((entry) => entry.column)
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

export function getGroup(
  entry: EntryWithPosition,
  entries: EntryWithPosition[]
) {
  const group = new Set<number>();
  const seen = new Set<number>();
  seen.add(entry.id);
  dfs(entry, entries, group, seen);
  return group;
}

// lcm of arbitratory number of numbers
export function lcm(...args: number[]) {
  return args.reduce((acc, curr) => (acc * curr) / gcd(acc, curr), 1);
}

// export function lcm(a: number, b: number) {
//   return Math.abs(a * b) / gcd(a, b);
// }

export function gcd(a: number, b: number) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
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
