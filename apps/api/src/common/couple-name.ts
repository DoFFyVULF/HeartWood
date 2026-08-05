/** «Имя и Имя» для названия пары. Используется и при регистрации
 * (auth.service), и при вступлении второй половинки (couple.service). */
export function coupleNameOf(...names: string[]): string {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length <= 1) return cleaned[0] ?? 'Наша пара';
  return `${cleaned[0]} и ${cleaned.slice(1).join(' и ')}`;
}
