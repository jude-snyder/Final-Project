
import { getRandomItem } from "./get-random-item";

/**
 * Returns a random artist from an array of artists.
 * 
 * @param {string[]} artists - The array of artists to choose from.
 * @returns {string} A random artist from the array.
 */
export function getRandomArtist(artists: string[]): string {
    return getRandomItem(artists);
}