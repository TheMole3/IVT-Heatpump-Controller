import { writable } from 'svelte/store';

// Utility function to load data from localStorage
function loadFromLocalStorage(key, defaultValue) {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved); // Parse JSON if data exists
    }
  }
  return defaultValue; // Return default value if no data exists
}

// Utility function to save data to localStorage
function saveToLocalStorage(key, value) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Reactive store to manage the access refreshToken (JWT)
export const accessToken = writable(false);
export const refreshToken = writable(loadFromLocalStorage('refreshToken', null));

// Default settings for the heat pump
export const settingsDefault = {
  temp: 20,
  power: false,
  mode: 0, // Auto
  fan: 3,
  highPower: false,
  tenDegreeMode: false,
  disabledSettings: {
    temp: false,
    power: false,
    mode: false,
    fan: false,
    highPower: false,
    tenDegreeMode: false,
  },
};

// Store for the heat pump settings, initialized from localStorage if available
export const settings = writable(loadFromLocalStorage('settings', settingsDefault));

// Subscribe to stores and save changes to localStorage
refreshToken.subscribe((value) => {
  saveToLocalStorage('refreshToken', value);
});

settings.subscribe((value) => {
  saveToLocalStorage('settings', value);
});