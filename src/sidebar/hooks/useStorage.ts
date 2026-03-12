import { useState, useEffect } from 'react';

export function useStorage<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key]);
      }
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[key]) {
        setValue(changes[key].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const update = (val: T) => {
    setValue(val);
    chrome.storage.local.set({ [key]: val });
  };

  return [value, update];
}
