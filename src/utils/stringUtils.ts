export function compactWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function titleCase(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
