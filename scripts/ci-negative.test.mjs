import test from "node:test";
import assert from "node:assert";
test("deliberate failure: CI must fail", () => { assert.equal(1, 2); });
