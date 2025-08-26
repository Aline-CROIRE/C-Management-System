"use client";
import { useState, useEffect } from 'react';

/**
 * A custom hook to debounce a value. It's useful for delaying the execution
 * of a function until after a certain amount of time has passed without the
 * value changing. For example, delaying a search API call until the user
 * has stopped typing.
 *
 * @param {any} value The value to debounce.
 * @param {number} delay The debounce delay in milliseconds.
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay) {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes before the delay has passed.
    // This is the core of the debounce logic.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if value or delay changes

  return debouncedValue;
}