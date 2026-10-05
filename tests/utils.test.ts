import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  asRecord,
  escapeRegExp,
  frontmatterEnd,
  frontmatterText,
  isRecord,
  recordGet,
  recordSet,
  stripFrontmatter,
} from "../src/utils";

describe("escapeRegExp", () => {
  it("escapes every character that has a meaning in regular expressions", () => {
    const special = ".*+?^${}()|[]\\";
    assert.ok(new RegExp(`^${escapeRegExp(special)}$`).test(special));
  });

  it("keeps ordinary text unchanged", () => {
    assert.equal(escapeRegExp("created"), "created");
  });

  it("makes property names with dots match literally", () => {
    const pattern = new RegExp(`^${escapeRegExp("date.created")}$`);
    assert.ok(pattern.test("date.created"));
    assert.ok(!pattern.test("dateXcreated"));
  });
});

describe("records", () => {
  it("recognizes plain objects only", () => {
    assert.ok(isRecord({}));
    assert.ok(!isRecord(null));
    assert.ok(!isRecord([]));
    assert.ok(!isRecord("text"));
  });

  it("returns null for values that are not records", () => {
    assert.equal(asRecord([1, 2]), null);
    assert.deepEqual(asRecord({ a: 1 }), { a: 1 });
  });

  it("reads and writes values by key", () => {
    const record: Record<string, unknown> = {};
    recordSet(record, "key", 1);
    assert.equal(recordGet(record, "key"), 1);
  });
});

describe("frontmatter helpers", () => {
  it("find the properties block and the text after it", () => {
    const content = "---\ntags: a\n---\nBody\n";
    assert.equal(frontmatterText(content), "tags: a");
    assert.equal(stripFrontmatter(content), "Body\n");
    assert.equal(content.slice(frontmatterEnd(content), frontmatterEnd(content) + 4), "\n---");
  });

  it("handle Windows line endings and an empty block", () => {
    assert.equal(stripFrontmatter("---\r\ntags: a\r\n---\r\nBody"), "Body");
    assert.equal(frontmatterText("---\n---\nBody"), "");
    assert.equal(stripFrontmatter("---\n---\nBody"), "Body");
  });

  it("treat notes without a complete block as plain text", () => {
    for (const content of ["Body", "--- not properties", "---\ntags: a\nno end"]) {
      assert.equal(frontmatterEnd(content), -1);
      assert.equal(frontmatterText(content), null);
      assert.equal(stripFrontmatter(content), content);
    }
  });
});
