import assert from "node:assert/strict";
import { test } from "node:test";
import { balanceActionLabel, formatInr } from "../src/lib/money";

test("bank amounts use Indian grouping and plain balance action labels", () => {
  assert.equal(formatInr("128400.00"), "₹1,28,400.00");
  assert.equal(balanceActionLabel("ADD"), "+ Add Money");
  assert.equal(balanceActionLabel("REMOVE"), "- Remove Money");
  assert.equal(balanceActionLabel("SET"), "Set Balance");
});
