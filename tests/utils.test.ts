import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { asRecord, escapeRegExp, isRecord, recordGet, recordSet } from "../src/utils";

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
