export type CaptureMode = "static" | "dynamic";
export type CaptureKind = "image" | "video";
export type SignTemplate = number[] | number[][];

export interface WordCapture {
  id: string;
  mode: CaptureMode;
  kind: CaptureKind;
  label: string;
  dataUrl: string;
  createdAt: number;
  durationSec?: number;
}

export interface TranslateWorkspaceData {
  captures: WordCapture[];
  alphabetCaptureMap: Record<string, string>;
  alphabetTemplates: Record<string, SignTemplate>;
}

export const TRANSLATE_STORAGE_KEY = "kinex.translate.workspace.v2";
export const TRANSLATE_TEMPLATES_STORAGE_KEY = "kinex.translate.templates.v1";
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const DEFAULT_DATA: TranslateWorkspaceData = {
  captures: [],
  alphabetCaptureMap: {},
  alphabetTemplates: {},
};

const DB_NAME = "KinexTranslateDB";
const STORE_NAME = "workspace";
const DB_VERSION = 1;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveWorkspace(data: TranslateWorkspaceData): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(data, "current_workspace");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function idbLoadWorkspace(): Promise<TranslateWorkspaceData | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get("current_workspace");
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbClearWorkspace(): Promise<boolean> {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export function loadTranslateWorkspaceData(): TranslateWorkspaceData {
  try {
    const raw = localStorage.getItem(TRANSLATE_STORAGE_KEY);
    const templateRaw = localStorage.getItem(TRANSLATE_TEMPLATES_STORAGE_KEY);
    if (!raw && !templateRaw) return DEFAULT_DATA;

    const parsed = raw ? (JSON.parse(raw) as Partial<TranslateWorkspaceData>) : {};
    const templateParsed = templateRaw ? (JSON.parse(templateRaw) as Partial<TranslateWorkspaceData>) : {};

    const captures = Array.isArray(parsed.captures) ? parsed.captures : [];
    const validLabels = new Set(captures.map((c) => c.label));

    const rawTemplates =
      templateParsed.alphabetTemplates && typeof templateParsed.alphabetTemplates === "object"
        ? templateParsed.alphabetTemplates
        : parsed.alphabetTemplates && typeof parsed.alphabetTemplates === "object"
        ? parsed.alphabetTemplates
        : {};

    const cleanTemplates: Record<string, SignTemplate> = {};
    if (captures.length > 0) {
      Object.entries(rawTemplates).forEach(([key, val]) => {
        if (validLabels.has(key) && Array.isArray(val) && val.length > 0) {
          cleanTemplates[key] = val as SignTemplate;
        }
      });
    }

    return {
      captures,
      alphabetCaptureMap:
        parsed.alphabetCaptureMap && typeof parsed.alphabetCaptureMap === "object"
          ? parsed.alphabetCaptureMap
          : {},
      alphabetTemplates: cleanTemplates,
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveTranslateWorkspaceData(data: TranslateWorkspaceData): void {
  const { captures, alphabetCaptureMap, alphabetTemplates } = data;

  // Persist asynchronously in IndexedDB to allow unlimited video storage (no 5MB quota cap)
  idbSaveWorkspace(data);

  // Save lightweight version in localStorage as fallback
  try {
    // Keep metadata and lightweight templates in localStorage
    const lightweightCaptures = captures.map((item) => {
      // If video payload is large, truncate video string for localStorage fallback
      if (item.dataUrl && item.dataUrl.length > 100000) {
        return { ...item, dataUrl: item.dataUrl.slice(0, 100) };
      }
      return item;
    });
    localStorage.setItem(TRANSLATE_STORAGE_KEY, JSON.stringify({ captures: lightweightCaptures, alphabetCaptureMap }));
  } catch {
    // Quota exceeded handled by IndexedDB
  }

  try {
    localStorage.setItem(TRANSLATE_TEMPLATES_STORAGE_KEY, JSON.stringify({ alphabetTemplates }));
  } catch {
    // Quota exceeded handled by IndexedDB
  }
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read blob"));
    reader.readAsDataURL(blob);
  });
}
