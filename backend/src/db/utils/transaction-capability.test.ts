import { describe, expect, it } from "vitest";

import { supportsMongoTransactions } from "./transaction-capability.js";

describe("supportsMongoTransactions", () => {
  it("accepts a replica set deployment", () => {
    expect(supportsMongoTransactions({ setName: "atlas-shard-0" })).toBe(true);
  });

  it("accepts a mongos deployment", () => {
    expect(supportsMongoTransactions({ msg: "isdbgrid" })).toBe(true);
  });

  it("rejects a standalone MongoDB deployment", () => {
    expect(supportsMongoTransactions({})).toBe(false);
  });
});
