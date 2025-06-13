function UTCDate(date: string) {
  if (date.endsWith("Z")) {
    return new Date(date)
  }
  return new Date(date + "Z")
}

export function formatUTCDate(date: string) {
  return UTCDate(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}