import { assertEquals } from "@std/assert";
import {
  normalizeFileMeta,
  NormalizingSpacePrimitives,
} from "./normalizing_space_primitives.ts";
import type { FileMeta } from "@silverbulletmd/silverbullet/type/index";
import type { SpacePrimitives } from "./space_primitives.ts";

// Mock space primitives for testing
class MockSpacePrimitives implements SpacePrimitives {
  private files: Map<string, { data: Uint8Array; meta: FileMeta }> = new Map();

  async fetchFileList(): Promise<FileMeta[]> {
    return Array.from(this.files.values()).map((f) => f.meta);
  }

  async getFileMeta(path: string): Promise<FileMeta> {
    const file = this.files.get(path);
    if (!file) {
      throw new Error("File not found");
    }
    return file.meta;
  }

  async readFile(path: string): Promise<{ data: Uint8Array; meta: FileMeta }> {
    const file = this.files.get(path);
    if (!file) {
      throw new Error("File not found");
    }
    return file;
  }

  async writeFile(
    path: string,
    data: Uint8Array,
    meta?: FileMeta,
  ): Promise<FileMeta> {
    const fileMeta: FileMeta = meta || {
      name: path,
      size: data.byteLength,
      contentType: "text/plain",
      created: Date.now(),
      lastModified: Date.now(),
      perm: "rw",
    };
    this.files.set(path, { data, meta: fileMeta });
    return fileMeta;
  }

  async deleteFile(path: string): Promise<void> {
    this.files.delete(path);
  }

  // Helper for tests
  setFile(path: string, data: Uint8Array, meta: FileMeta) {
    this.files.set(path, { data, meta });
  }
}

Deno.test("normalizeFileMeta - handles undefined lastModified", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: undefined as any,
    lastModified: undefined as any,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 0);
  assertEquals(normalized.created, 0);
});

Deno.test("normalizeFileMeta - handles null values", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: null as any,
    lastModified: null as any,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 0);
  assertEquals(normalized.created, 0);
});

Deno.test("normalizeFileMeta - handles NaN values", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: NaN,
    lastModified: NaN,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 0);
  assertEquals(normalized.created, 0);
});

Deno.test("normalizeFileMeta - handles negative values", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: -100,
    lastModified: -50,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 0);
  assertEquals(normalized.created, 0);
});

Deno.test("normalizeFileMeta - uses lastModified for created if only lastModified is valid", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: undefined as any,
    lastModified: 1234567890,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 1234567890);
  assertEquals(normalized.created, 1234567890);
});

Deno.test("normalizeFileMeta - preserves valid values", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: 1000000000,
    lastModified: 2000000000,
    perm: "rw",
  };

  const normalized = normalizeFileMeta(fileMeta);

  assertEquals(normalized.lastModified, 2000000000);
  assertEquals(normalized.created, 1000000000);
});

Deno.test("NormalizingSpacePrimitives - normalizes fetchFileList results", async () => {
  const mock = new MockSpacePrimitives();
  const normalizing = new NormalizingSpacePrimitives(mock);

  // Add a file with undefined timestamps
  mock.setFile(
    "test.md",
    new TextEncoder().encode("test"),
    {
      name: "test.md",
      size: 4,
      contentType: "text/markdown",
      created: undefined as any,
      lastModified: undefined as any,
      perm: "rw",
    },
  );

  const files = await normalizing.fetchFileList();

  assertEquals(files.length, 1);
  assertEquals(files[0].lastModified, 0);
  assertEquals(files[0].created, 0);
});

Deno.test("NormalizingSpacePrimitives - normalizes getFileMeta results", async () => {
  const mock = new MockSpacePrimitives();
  const normalizing = new NormalizingSpacePrimitives(mock);

  mock.setFile(
    "test.md",
    new TextEncoder().encode("test"),
    {
      name: "test.md",
      size: 4,
      contentType: "text/markdown",
      created: null as any,
      lastModified: null as any,
      perm: "rw",
    },
  );

  const meta = await normalizing.getFileMeta("test.md");

  assertEquals(meta.lastModified, 0);
  assertEquals(meta.created, 0);
});

Deno.test("NormalizingSpacePrimitives - normalizes readFile results", async () => {
  const mock = new MockSpacePrimitives();
  const normalizing = new NormalizingSpacePrimitives(mock);

  mock.setFile(
    "test.md",
    new TextEncoder().encode("test"),
    {
      name: "test.md",
      size: 4,
      contentType: "text/markdown",
      created: NaN,
      lastModified: NaN,
      perm: "rw",
    },
  );

  const result = await normalizing.readFile("test.md");

  assertEquals(result.meta.lastModified, 0);
  assertEquals(result.meta.created, 0);
});

Deno.test("NormalizingSpacePrimitives - normalizes writeFile results", async () => {
  // Create a mock that returns invalid meta from writeFile
  class InvalidMetaMock extends MockSpacePrimitives {
    override async writeFile(
      path: string,
      data: Uint8Array,
      meta?: FileMeta,
    ): Promise<FileMeta> {
      // Return invalid meta
      return {
        name: path,
        size: data.byteLength,
        contentType: "text/plain",
        created: -100,
        lastModified: -50,
        perm: "rw",
      };
    }
  }

  const mock = new InvalidMetaMock();
  const normalizing = new NormalizingSpacePrimitives(mock);

  const meta = await normalizing.writeFile(
    "test.md",
    new TextEncoder().encode("test"),
  );

  assertEquals(meta.lastModified, 0);
  assertEquals(meta.created, 0);
});
