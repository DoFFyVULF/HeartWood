/** Типографский номер купона из id: «seed-1» → «01», «cp-…» → хвост id. */
export function couponNumber(id: string): string {
  const digits = id.match(/\d+/);
  if (digits) return digits[digits.length - 1].padStart(2, "0");
  const tail = id.replace(/[^a-z0-9]/gi, "").slice(-3).toUpperCase();
  return tail || "••";
}
