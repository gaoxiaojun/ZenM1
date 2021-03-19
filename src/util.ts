/**
 * assert util
 */

export function assert(value: unknown, message?: string): asserts value {
    if (!value) {
        throw new Error(message);
    }
}

export function clearArray(a: []) { a.length = 0 }