// Tiny classname joiner — keeps conditional Tailwind lists readable.
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
