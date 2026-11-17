import type { Fraction } from "./score";
export function parseMusicalFraction(text: string): Fraction {
  const parsed = /^(\d+)(?:\/(\d+))?$/u.exec(text.trim());
  if (!parsed)
    throw new Error(
      "Use a whole quarter-note position or a fraction such as 1/2.",
    );
  const n = Number(parsed[1]);
  const d = Number(parsed[2] ?? 1);
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d) || d < 1)
    throw new Error(
      "The musical fraction is outside supported exact precision.",
    );
  return { n, d };
}
export function musicalFraction(value: Fraction) {
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
}
