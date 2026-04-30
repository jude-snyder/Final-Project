import { describe, it, expect } from "bun:test";
import { getEl } from "./get-el";

describe("getEl", () => {
    it("throws an error if element does not exist", () => {
        expect(() => getEl("does-not-exist")).toThrow();
    });
});