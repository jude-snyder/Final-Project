/**
 * Safely retrieves a DOM element by ID and casts it to the specified type.
 * Throws an error if the element is not found.
 * 
 * @template T
 * @param {string} id - The ID of the element to retrieve.
 * @returns {T}
 */
export function getEl<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Element with ID "${id}" not found`);
    }
    return el as T;
}