import type { FileMeta } from "@silverbulletmd/silverbullet/type/index";
import type { SpacePrimitives } from "./space_primitives.ts";

/**
 * Normalizes FileMeta objects to ensure required fields are always present.
 * This handles filesystems that may not return valid created/lastModified values.
 */
export class NormalizingSpacePrimitives implements SpacePrimitives {
  constructor(
    private wrapped: SpacePrimitives,
  ) {
  }

  async fetchFileList(): Promise<FileMeta[]> {
    return (await this.wrapped.fetchFileList()).map((meta) =>
      normalizeFileMeta(meta)
    );
  }

  async readFile(
    path: string,
  ): Promise<{ data: Uint8Array; meta: FileMeta }> {
    const result = await this.wrapped.readFile(path);
    return {
      data: result.data,
      meta: normalizeFileMeta(result.meta),
    };
  }

  async getFileMeta(path: string, observing?: boolean): Promise<FileMeta> {
    return normalizeFileMeta(
      await this.wrapped.getFileMeta(path, observing),
    );
  }

  async writeFile(
    path: string,
    data: Uint8Array,
    meta?: FileMeta,
  ): Promise<FileMeta> {
    return normalizeFileMeta(
      await this.wrapped.writeFile(path, data, meta),
    );
  }

  deleteFile(path: string): Promise<void> {
    return this.wrapped.deleteFile(path);
  }
}

/**
 * Normalizes a FileMeta object to ensure all required fields are present.
 * This handles cases where filesystems don't return valid created/lastModified values.
 */
export function normalizeFileMeta(fileMeta: FileMeta): FileMeta {
  // Handle undefined, null, NaN, or negative values for lastModified
  if (
    !fileMeta.lastModified || fileMeta.lastModified < 0 ||
    isNaN(fileMeta.lastModified)
  ) {
    fileMeta.lastModified = 0;
  }

  // Handle undefined, null, NaN, or negative values for created
  if (!fileMeta.created || fileMeta.created < 0 || isNaN(fileMeta.created)) {
    // If created is missing but lastModified is valid, use lastModified
    fileMeta.created = fileMeta.lastModified || 0;
  }

  return fileMeta;
}
