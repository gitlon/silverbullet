import { assertEquals } from "@std/assert";
import { fileMetaToDocumentMeta, fileMetaToPageMeta } from "./space.ts";
import type { FileMeta } from "../plug-api/types/index.ts";

Deno.test("fileMetaToPageMeta - handles undefined lastModified", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: undefined as any, // Simulating filesystem issue
    lastModified: undefined as any, // Simulating filesystem issue
    perm: "rw",
  };

  const pageMeta = fileMetaToPageMeta(fileMeta);

  // Should produce epoch date string instead of crashing (timezone-aware check)
  assertEquals(pageMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(pageMeta.created.startsWith("1970-01-01"), true);
  assertEquals(pageMeta.name, "test");
  assertEquals(pageMeta.ref, "test");
  assertEquals(pageMeta.tag, "page");
});

Deno.test("fileMetaToPageMeta - handles null lastModified", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: null as any,
    lastModified: null as any,
    perm: "rw",
  };

  const pageMeta = fileMetaToPageMeta(fileMeta);

  // Check for epoch date (timezone-aware)
  assertEquals(pageMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(pageMeta.created.startsWith("1970-01-01"), true);
});

Deno.test("fileMetaToPageMeta - handles zero timestamps", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: 0,
    lastModified: 0,
    perm: "rw",
  };

  const pageMeta = fileMetaToPageMeta(fileMeta);

  // Zero should also produce epoch date (timezone-aware)
  assertEquals(pageMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(pageMeta.created.startsWith("1970-01-01"), true);
});

Deno.test("fileMetaToPageMeta - handles valid timestamps", () => {
  const fileMeta: FileMeta = {
    name: "test.md",
    size: 100,
    contentType: "text/markdown",
    created: 1700000000000, // Nov 14, 2023
    lastModified: 1731753000000, // Nov 16, 2024
    perm: "rw",
  };

  const pageMeta = fileMetaToPageMeta(fileMeta);

  // Should contain valid date strings
  assertEquals(pageMeta.lastModified.startsWith("2024-11"), true);
  assertEquals(pageMeta.created.startsWith("2023-11"), true);
  assertEquals(pageMeta.name, "test");
  assertEquals(pageMeta.ref, "test");
});

Deno.test("fileMetaToPageMeta - strips .md extension correctly", () => {
  const fileMeta: FileMeta = {
    name: "my-page.md",
    size: 100,
    contentType: "text/markdown",
    created: 1700000000000,
    lastModified: 1731753000000,
    perm: "rw",
  };

  const pageMeta = fileMetaToPageMeta(fileMeta);

  assertEquals(pageMeta.name, "my-page");
  assertEquals(pageMeta.ref, "my-page");
});

Deno.test("fileMetaToDocumentMeta - handles undefined lastModified", () => {
  const fileMeta: FileMeta = {
    name: "image.png",
    size: 5000,
    contentType: "image/png",
    created: undefined as any,
    lastModified: undefined as any,
    perm: "rw",
  };

  const docMeta = fileMetaToDocumentMeta(fileMeta);

  // Check for epoch date (timezone-aware)
  assertEquals(docMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(docMeta.created.startsWith("1970-01-01"), true);
  assertEquals(docMeta.name, "image.png");
  assertEquals(docMeta.ref, "image.png");
  assertEquals(docMeta.extension, "png");
  assertEquals(docMeta.tag, "document");
});

Deno.test("fileMetaToDocumentMeta - handles null lastModified", () => {
  const fileMeta: FileMeta = {
    name: "document.pdf",
    size: 1000,
    contentType: "application/pdf",
    created: null as any,
    lastModified: null as any,
    perm: "ro",
  };

  const docMeta = fileMetaToDocumentMeta(fileMeta);

  // Check for epoch date (timezone-aware)
  assertEquals(docMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(docMeta.created.startsWith("1970-01-01"), true);
});

Deno.test("fileMetaToDocumentMeta - handles zero timestamps", () => {
  const fileMeta: FileMeta = {
    name: "doc.pdf",
    size: 1000,
    contentType: "application/pdf",
    created: 0,
    lastModified: 0,
    perm: "ro",
  };

  const docMeta = fileMetaToDocumentMeta(fileMeta);

  // Zero should also produce epoch date (timezone-aware)
  assertEquals(docMeta.lastModified.startsWith("1970-01-01"), true);
  assertEquals(docMeta.created.startsWith("1970-01-01"), true);
});

Deno.test("fileMetaToDocumentMeta - handles valid timestamps", () => {
  const fileMeta: FileMeta = {
    name: "photo.jpg",
    size: 50000,
    contentType: "image/jpeg",
    created: 1700000000000,
    lastModified: 1731753000000,
    perm: "rw",
  };

  const docMeta = fileMetaToDocumentMeta(fileMeta);

  // Should contain valid date strings
  assertEquals(docMeta.lastModified.startsWith("2024-11"), true);
  assertEquals(docMeta.created.startsWith("2023-11"), true);
  assertEquals(docMeta.name, "photo.jpg");
  assertEquals(docMeta.extension, "jpg");
});

Deno.test("fileMetaToDocumentMeta - extracts extension correctly", () => {
  const testCases = [
    { name: "file.txt", expectedExt: "txt" },
    { name: "image.png", expectedExt: "png" },
    { name: "document.pdf", expectedExt: "pdf" },
    { name: "archive.tar.gz", expectedExt: "gz" },
    { name: "script.js", expectedExt: "js" },
  ];

  for (const { name, expectedExt } of testCases) {
    const fileMeta: FileMeta = {
      name,
      size: 100,
      contentType: "application/octet-stream",
      created: 1700000000000,
      lastModified: 1731753000000,
      perm: "rw",
    };

    const docMeta = fileMetaToDocumentMeta(fileMeta);
    assertEquals(
      docMeta.extension,
      expectedExt,
      `Expected extension for ${name} to be ${expectedExt}`,
    );
  }
});

Deno.test("fileMetaToDocumentMeta - preserves all FileMeta properties", () => {
  const fileMeta: FileMeta = {
    name: "data.json",
    size: 250,
    contentType: "application/json",
    created: 1700000000000,
    lastModified: 1731753000000,
    perm: "ro",
  };

  const docMeta = fileMetaToDocumentMeta(fileMeta);

  // Check that original properties are preserved
  assertEquals(docMeta.size, 250);
  assertEquals(docMeta.contentType, "application/json");
  assertEquals(docMeta.perm, "ro");
});
