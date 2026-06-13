import { nanoid } from "nanoid";

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 72);
}

export function withShortId(value: string): string {
  const base = slugify(value);
  return `${base || "link"}-${nanoid(6)}`;
}
