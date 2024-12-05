import { settings } from "$lib/store.js"; // Assuming this is your writable store

let currentSettings = {};
const unsubscribe = settings.subscribe(($store) => {
  currentSettings = $store;
});

let previousSettings = currentSettings;
function validateSettings(newSetting, updatedKey) {
  let validatedSettings = { ...currentSettings };

  // Update the specific setting
  validatedSettings[updatedKey] = newSetting;

  const { mode, temp, fan, highPower, tenDegreeMode, power } =
    validatedSettings;

  // Define disabled states for individual settings
  const disabledSettings = {
    temp: false,
    fan: false,
    mode: false,
    highPower: false,
    tenDegreeMode: false,
    power: false,
  };

  // Fan Control Constraints
  if (
    validatedSettings.mode === 3 ||
    validatedSettings.highPower ||
    validatedSettings.tenDegreeMode
  ) {
    validatedSettings.fan = 0;
    disabledSettings.fan = true; // Disable fan if in Dehumidification or highPower/tenDegreeMode
  } else {
  }

  // High Power and Ten Degree Mode Constraints
  if (validatedSettings.highPower && validatedSettings.tenDegreeMode) {
    throw new Error(
      "High Power and Ten Degree Mode cannot be enabled at the same time."
    );
  }

  if (validatedSettings.highPower || validatedSettings.tenDegreeMode) {
    validatedSettings.temp = undefined;
    disabledSettings.temp = true; // Disable temp control when highPower/tenDegreeMode is enabled
    disabledSettings.fan = true; // Disable fan control when highPower/tenDegreeMode is enabled
    disabledSettings.mode = true;

    if (validatedSettings.highPower) disabledSettings.tenDegreeMode = true;
    else disabledSettings.highPower = true;
  }

  if (
    (updatedKey == "highPower" && validatedSettings.highPower == false) ||
    (updatedKey == "tenDegreeMode" && validatedSettings.tenDegreeMode == false)
  ) {
    validatedSettings.temp = [1, 2].includes(parseInt(validatedSettings.mode))
      ? 20
      : 0;
  }

  // Power Control Constraints
  if (!power) {
    disabledSettings.temp = true; // Disable all settings if power is off or modes are locked
    disabledSettings.fan = true;
    disabledSettings.mode = true;
    disabledSettings.highPower = true;
    disabledSettings.tenDegreeMode = true;
  }

  if (updatedKey === "mode") {
    // Update temperature on mode change
    if (
      [1, 2].includes(parseInt(newSetting)) &&
      ![1, 2].includes(parseInt(previousSettings.mode))
    ) {
      // If we are changing from 0,3 to 1,2
      validatedSettings.temp = 20;
    } else if (
      [0, 3].includes(parseInt(newSetting)) &&
      ![0, 3].includes(parseInt(previousSettings.mode))
    ) {
      validatedSettings.temp = 0;
    }
  }

  // Mode and Temp Range Constraints
  switch (validatedSettings.mode) {
    case 0: // Auto
      validatedSettings.temp = Math.min(
        Math.max(parseInt(validatedSettings.temp), -2),
        2
      ); // Temp range for Heat/Cool
      break;
    case 3: // Dehumidification
      validatedSettings.temp = Math.min(
        Math.max(parseInt(validatedSettings.temp), -2),
        2
      ); // Temp range for Auto/Dehumidification
      break;
    case 1: // Heat
      validatedSettings.temp = Math.min(
        Math.max(parseInt(validatedSettings.temp), 18),
        32
      ); // Temp range for Heat/Cool
      break;
    case 2: // Cool
      validatedSettings.temp = Math.min(
        Math.max(parseInt(validatedSettings.temp), 18),
        32
      ); // Temp range for Heat/Cool
      break;
    default:
      validatedSettings.temp = undefined; // Default temp for unknown modes
      break;
  }

  previousSettings = { ...validatedSettings, disabledSettings };
  return { ...validatedSettings, disabledSettings };
}

// Function to update a single setting
export const updateSetting = (settingKey, newValue) => {
  console.log("Update ", settingKey, newValue);
  try {
    const validatedSettings = validateSettings(newValue, settingKey);

    // Update the store with the validated settings
    settings.set(validatedSettings);
  } catch (error) {
    console.error("Invalid setting update:", error.message);
  }
};
