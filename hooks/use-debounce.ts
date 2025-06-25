import { useEffect, useState } from "react";
// This hook is used to debounce a value, delaying its update until after a specified delay period.
//wait for some time before making search request in the  database
export function useDebounce<T>(value: T, delay?:number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay || 500);

    return () => {
      clearTimeout(timer);
    }
  }, [value, delay]);

  return debouncedValue;
};