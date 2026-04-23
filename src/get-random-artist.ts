import { getRandomItem } from "./get-random-item";

export function getRandomArtist(artists: string[]): string {
    return getRandomItem(artists);
}