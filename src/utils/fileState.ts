import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { CACHE_STATE_FILE_PATH } from "../config";
import type { CacheState } from "../types";

const DEFAULT_CACHE_STATE: CacheState = {
  issues: [],
  isInitialized: false,
  lastResetDate: null
};

function getCacheStateFilePath(): string {
  return path.resolve(process.cwd(), CACHE_STATE_FILE_PATH);
}

export async function loadCacheState(): Promise<CacheState> {
  const filePath = getCacheStateFilePath();

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CacheState>;

    return {
      issues: parsed.issues ?? [],
      isInitialized: parsed.isInitialized ?? false,
      lastResetDate: parsed.lastResetDate ?? null
    };
  } catch (error) {
    const isMissingFile = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";

    if (isMissingFile) {
      return DEFAULT_CACHE_STATE;
    }

    throw error;
  }
}

export async function saveCacheState(state: CacheState): Promise<void> {
  const filePath = getCacheStateFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}
