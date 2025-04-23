// src/utils.js

/**
 * Constrain a value between a minimum and maximum.
 * Pure JS implementation—no p5 globals required.
 *
 * @param {number} value – the value to clamp
 * @param {number} min   – lower bound
 * @param {number} max   – upper bound
 * @returns {number} the clamped value
 */
export function constrain(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
