/**
 * Returns a random item from an array.
 * 
 * @template T
 * @param {T[]} items - The array of items to choose from.
 * @returns {T} A random item from the array.
 */
export function getRandomItem<T>(items: T[]): T {
    const index = Math.floor(Math.random() * items.length);
    return items[index]!;
}