// src/utils.js

/**
 * Constrain a value between a minimum and maximum.
 * Pure JS implementation�no p5 globals required.
 *
 * @param {number} value � the value to clamp
 * @param {number} min   � lower bound
 * @param {number} max   � upper bound
 * @returns {number} the clamped value
 */
export function constrain(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * Safely execute a function with error handling
 * @param {Function} fn - Function to execute
 * @param {*} fallback - Fallback value or function if error occurs
 * @param {...*} args - Arguments to pass to the function
 * @returns {*} Result of the function or fallback
 */
export function safeExecute(fn, fallback = null, ...args) {
    try {
        return fn(...args);
    } catch (error) {
        console.error(`Error executing function:`, error);
        return typeof fallback === 'function' ? fallback(...args) : fallback;
    }
}
