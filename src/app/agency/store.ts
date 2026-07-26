import { useSyncExternalStore } from "react";
import { ALL_PROPERTIES, type Prop } from "../data";

// ─── Extended type (adds fields beyond core Prop) ─────────────────────────────
export interface StoreProp extends Prop {
  videoUrl?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
}

// ─── Module-level mutable state ───────────────────────────────────────────────
let _props: StoreProp[]          = ALL_PROPERTIES.map(p => ({ ...p }));
let _nextId: number              = ALL_PROPERTIES.length + 1;
const _subs = new Set<() => void>();

function _emit() { _subs.forEach(f => f()); }
function _snap() { return _props; }
function _sub(fn: () => void) { _subs.add(fn); return () => { _subs.delete(fn); }; }

function makeRef(id: number) {
  return `IS-${new Date().getFullYear()}-${String(id).padStart(3, "0")}`;
}

function today() { return new Date().toISOString().split("T")[0]; }

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProperties() {
  return useSyncExternalStore(_sub, _snap);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
export function addProperty(data: Omit<StoreProp, "id" | "ref" | "createdAt">): StoreProp {
  const id  = _nextId++;
  const prop: StoreProp = { ...data, id, ref: makeRef(id), createdAt: today() };
  _props = [..._props, prop];
  _emit();
  return prop;
}

export function updateProperty(id: number, patch: Partial<StoreProp>) {
  _props = _props.map(p => p.id === id ? { ...p, ...patch } : p);
  _emit();
}

export function deleteProperty(id: number) {
  _props = _props.filter(p => p.id !== id);
  _emit();
}

export function duplicateProperty(id: number): StoreProp | null {
  const src = _props.find(p => p.id === id);
  if (!src) return null;
  const newId = _nextId++;
  const dup: StoreProp = {
    ...src,
    id:        newId,
    ref:       makeRef(newId),
    title:     `Copie — ${src.title}`,
    status:    "disponible",
    tag:       null,
    views:     0,
    createdAt: today(),
  };
  _props = [..._props, dup];
  _emit();
  return dup;
}
