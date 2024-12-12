import { settings } from "$lib/store.js";

let currentSettings = {};
let previousSettings;

const unsubscribe = settings.subscribe((storeValue) => {
  currentSettings = storeValue;
  if(!previousSettings) previousSettings = currentSettings;
});

/**
 * Helper: Applies constraints to settings.
 * @param {object} settings - Current settings object.
 * @param {object} disabled - Object to track disabled settings.
 */
function applyConstraints(settings, disabled) {
  // Fan Constraints
  if ([3].includes(settings.mode) || settings.tenDegreeMode) {
    settings.fan = 0;
    disabled.fan = true;
  }

  // High Power vs Ten Degree Mode
  if (settings.highPower && settings.tenDegreeMode) {
    throw new Error("High Power and Ten Degree Mode cannot be enabled simultaneously.");
  }

  if (settings.highPower || settings.tenDegreeMode) {
    Object.assign(disabled, { temp: true, fan: true, mode: true });
    settings.temp = undefined;
    disabled[settings.highPower ? "tenDegreeMode" : "highPower"] = true;
  }

  if (!settings.power) {
    Object.keys(disabled).forEach((key) => (disabled[key] = true));
  }
}

/**
 * Helper: Adjusts temperature based on mode.
 * @param {object} settings - Current settings object.
 * @param {string} updatedKey - Key of the updated setting.
 * @param {any} newValue - New value of the setting.
 */
function adjustTemperature(settings, updatedKey, newValue) {
  if (updatedKey === "mode") {
    const isSwitchingToHeatOrCool = [1, 2].includes(newValue) && ![1, 2].includes(previousSettings.mode);
    const isSwitchingAway = [0, 3].includes(newValue) && ![0, 3].includes(previousSettings.mode);

    if (isSwitchingToHeatOrCool) settings.temp = 20;
    if (isSwitchingAway) settings.temp = 0;
  }

  const tempRanges = {
    0: [-2, 2],
    3: [-2, 2],
    1: [18, 32],
    2: [18, 32],
  };

  if (tempRanges[settings.mode]) {
    const [min, max] = tempRanges[settings.mode];
    settings.temp = Math.min(Math.max(settings.temp, min), max);
  } else {
    settings.temp = undefined;
  }
}

/**
 * Validates and adjusts settings.
 * @param {any} newValue - New value for the setting.
 * @param {string} updatedKey - Key of the setting being updated.
 * @returns {object} Updated settings object with disabled states.
 */
function validateSettings(newValue, updatedKey) {
  const updatedSettings = { ...currentSettings, [updatedKey]: newValue };
  const disabledSettings = { temp: false, fan: false, mode: false, highPower: false, tenDegreeMode: false, power: false };

  applyConstraints(updatedSettings, disabledSettings);

  if ((updatedKey === "highPower" && !updatedSettings.highPower) || (updatedKey === "tenDegreeMode" && !updatedSettings.tenDegreeMode)) {
    updatedSettings.temp = [1, 2].includes(updatedSettings.mode) ? 20 : 0;
  }

  adjustTemperature(updatedSettings, updatedKey, newValue);

  previousSettings = { ...updatedSettings, disabledSettings };
  return { ...updatedSettings, disabledSettings };
}

/**
 * Updates a specific setting by validating it and applying constraints.
 * @param {string} settingKey - The key of the setting to update.
 * @param {any} newValue - The new value of the setting.
 */
export const updateSetting = (settingKey, newValue) => {
  try {
    const validatedSettings = validateSettings(newValue, settingKey);
    settings.set(validatedSettings);
  } catch (error) {
    console.error("Invalid setting update:", error.message);
  }
};
