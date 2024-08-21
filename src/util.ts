export function minutesToPixels(minutes: number) {
  return minutes * 2;
}

export function pixelsToMinutes(pixels: number) {
  return pixels / 2;
}

export function minutesFromStartOfDay(dt: any) {
  return dt.diff(dt.startOf("day"), "minutes");
}