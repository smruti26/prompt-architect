// Client-side persistence for marketplace analytics, favorites, and collections.
// All data is stored in localStorage; safe no-ops during SSR.

import type { TemplateCategoryId, TemplateType } from "./marketplace";

const EVENTS_KEY = "marketplace.events.v1";
const FAVS_KEY = "marketplace.favs.v1";
const COLLECTIONS_KEY = "marketplace.collections.v1";

export type EventKind = "view" | "launch" | "generate" | "detail";

export interface TemplateEvent {
  id: string;
  templateId: string;
  name: string;
  category: TemplateCategoryId;
  type: TemplateType;
  kind: EventKind;
  ts: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  templateIds: string[];
  createdAt: number;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ----- Events / analytics -----

export function trackEvent(e: Omit<TemplateEvent, "id" | "ts">) {
  if (!isBrowser()) return;
  const list = read<TemplateEvent[]>(EVENTS_KEY, []);
  list.push({ ...e, id: crypto.randomUUID(), ts: Date.now() });
  // cap at 5000 most-recent events
  const trimmed = list.length > 5000 ? list.slice(-5000) : list;
  write(EVENTS_KEY, trimmed);
  try { window.dispatchEvent(new CustomEvent("marketplace:events")); } catch { /* noop */ }
}

export function getEvents(): TemplateEvent[] {
  return read<TemplateEvent[]>(EVENTS_KEY, []);
}

export function clearEvents() {
  write(EVENTS_KEY, []);
  try { window.dispatchEvent(new CustomEvent("marketplace:events")); } catch { /* noop */ }
}

// ----- Favorites -----

export function getFavorites(): string[] {
  return read<string[]>(FAVS_KEY, []);
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) favs.splice(idx, 1); else favs.unshift(id);
  write(FAVS_KEY, favs);
  try { window.dispatchEvent(new CustomEvent("marketplace:favs")); } catch { /* noop */ }
  return idx < 0;
}

// ----- Collections -----

export function getCollections(): Collection[] {
  return read<Collection[]>(COLLECTIONS_KEY, []);
}

export function createCollection(name: string, description?: string): Collection {
  const c: Collection = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled collection",
    description,
    templateIds: [],
    createdAt: Date.now(),
  };
  const list = getCollections();
  list.unshift(c);
  write(COLLECTIONS_KEY, list);
  try { window.dispatchEvent(new CustomEvent("marketplace:collections")); } catch { /* noop */ }
  return c;
}

export function deleteCollection(id: string) {
  write(COLLECTIONS_KEY, getCollections().filter((c) => c.id !== id));
  try { window.dispatchEvent(new CustomEvent("marketplace:collections")); } catch { /* noop */ }
}

export function addToCollection(collectionId: string, templateId: string) {
  const list = getCollections();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return;
  if (!c.templateIds.includes(templateId)) c.templateIds.unshift(templateId);
  write(COLLECTIONS_KEY, list);
  try { window.dispatchEvent(new CustomEvent("marketplace:collections")); } catch { /* noop */ }
}

export function removeFromCollection(collectionId: string, templateId: string) {
  const list = getCollections();
  const c = list.find((x) => x.id === collectionId);
  if (!c) return;
  c.templateIds = c.templateIds.filter((t) => t !== templateId);
  write(COLLECTIONS_KEY, list);
  try { window.dispatchEvent(new CustomEvent("marketplace:collections")); } catch { /* noop */ }
}

// ----- Aggregates for the analytics dashboard -----

export interface TemplateStat {
  templateId: string;
  name: string;
  category: TemplateCategoryId;
  type: TemplateType;
  views: number;
  launches: number;
  generates: number;
  conversion: number; // generates / views
}

export interface AnalyticsSummary {
  totals: { views: number; launches: number; generates: number; conversion: number };
  byTemplate: TemplateStat[];
  byCategory: Array<{ category: TemplateCategoryId; views: number; launches: number; generates: number }>;
  byType: Array<{ type: TemplateType; views: number; launches: number; generates: number }>;
  byDay: Array<{ day: string; views: number; launches: number; generates: number }>;
  topByCategory: Record<string, TemplateStat[]>;
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const events = getEvents();
  const tplMap = new Map<string, TemplateStat>();
  const catMap = new Map<TemplateCategoryId, { views: number; launches: number; generates: number }>();
  const typeMap = new Map<TemplateType, { views: number; launches: number; generates: number }>();
  const dayMap = new Map<string, { views: number; launches: number; generates: number }>();

  let totalViews = 0, totalLaunches = 0, totalGenerates = 0;

  for (const ev of events) {
    if (ev.kind === "detail") continue;
    const t = tplMap.get(ev.templateId) ?? {
      templateId: ev.templateId, name: ev.name, category: ev.category, type: ev.type,
      views: 0, launches: 0, generates: 0, conversion: 0,
    };
    if (ev.kind === "view") { t.views++; totalViews++; }
    if (ev.kind === "launch") { t.launches++; totalLaunches++; }
    if (ev.kind === "generate") { t.generates++; totalGenerates++; }
    tplMap.set(ev.templateId, t);

    const c = catMap.get(ev.category) ?? { views: 0, launches: 0, generates: 0 };
    if (ev.kind === "view") c.views++;
    if (ev.kind === "launch") c.launches++;
    if (ev.kind === "generate") c.generates++;
    catMap.set(ev.category, c);

    const ty = typeMap.get(ev.type) ?? { views: 0, launches: 0, generates: 0 };
    if (ev.kind === "view") ty.views++;
    if (ev.kind === "launch") ty.launches++;
    if (ev.kind === "generate") ty.generates++;
    typeMap.set(ev.type, ty);

    const day = new Date(ev.ts).toISOString().slice(0, 10);
    const d = dayMap.get(day) ?? { views: 0, launches: 0, generates: 0 };
    if (ev.kind === "view") d.views++;
    if (ev.kind === "launch") d.launches++;
    if (ev.kind === "generate") d.generates++;
    dayMap.set(day, d);
  }

  const byTemplate: TemplateStat[] = [];
  for (const t of tplMap.values()) {
    t.conversion = t.views > 0 ? t.generates / t.views : 0;
    byTemplate.push(t);
  }
  byTemplate.sort((a, b) => (b.launches + b.generates) - (a.launches + a.generates));

  const topByCategory: Record<string, TemplateStat[]> = {};
  for (const t of byTemplate) {
    (topByCategory[t.category] ||= []).push(t);
  }
  for (const k of Object.keys(topByCategory)) {
    topByCategory[k] = topByCategory[k].slice(0, 5);
  }

  return {
    totals: {
      views: totalViews,
      launches: totalLaunches,
      generates: totalGenerates,
      conversion: totalViews > 0 ? totalGenerates / totalViews : 0,
    },
    byTemplate,
    byCategory: Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.views - a.views),
    byType: Array.from(typeMap.entries()).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.views - a.views),
    byDay: Array.from(dayMap.entries()).map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
    topByCategory,
  };
}
