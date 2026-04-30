import { describe, it, expect } from "bun:test";
import { getRandomArtist } from "./get-random-artist";

describe("getRandomArtist", () => {
    it("returns an artist from the list", () => {
        const artists = ["A", "B", "C"];
        const result = getRandomArtist(artists);

        expect(artists.includes(result)).toBe(true);
    });

    it("returns the only artist if list has one", () => {
        const artists = ["Taylor Swift"];
        const result = getRandomArtist(artists);

        expect(result).toBe("Taylor Swift");
    });
});