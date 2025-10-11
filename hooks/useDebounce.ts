import { useState, useEffect } from 'react';

// A custom hook to debounce any fast-changing value
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if the value changes (e.g., user is still typing)
    // This prevents the debounced value from updating prematurely
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run the effect if the value or delay changes

  return debouncedValue;
}
