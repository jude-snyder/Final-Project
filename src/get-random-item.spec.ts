import { describe, it, expect } from "bun:test";
import { getRandomItem } from "./get-random-item";

describe("getRandomItem", () => {
    it("returns an item from the array", () => {
        const items = [1, 2, 3];
        const result = getRandomItem(items);

        expect(items.includes(result)).toBe(true);
    });

    it("returns the only item if array has one element", () => {
        const items = ["only"];
        const result = getRandomItem(items);

        expect(result).toBe("only");
    });

    it("returns different values over multiple calls (likely)", () => {
        const items = [1, 2, 3];
        const results = new Set();

        for (let i = 0; i < 10; i++) {
            results.add(getRandomItem(items));
        }

        expect(results.size).toBeGreaterThan(1);
    });
});