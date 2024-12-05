<script>
  import { updateSetting } from "$lib/controller.js";
  import { settings } from "$lib/store.js";

  let currentSettings = $settings
  let disabledSettings = $settings.disabledSettings


  // Reactive statement to track settings and their disabled states
  $: {
    currentSettings = $settings
    disabledSettings = $settings.disabledSettings
    // Logging to track the updated settings and disabled states
    console.log($settings);
  }
</script>

<div class="settings-container">
  <!-- Temperature Input -->
  <div class="setting">
    <label for="temp">Temperature (°C):</label>
    <input
      id="temp"
      type="number"
      bind:value={currentSettings.temp}
      disabled={disabledSettings.temp}
      on:input={(e) => updateSetting('temp', parseInt(e.target.value))}
    />
  </div>

  <!-- Power Button -->
  <div class="setting">
    <button on:click={(e) => updateSetting("power", !currentSettings.power)} disabled={disabledSettings.power}>
      Power: {currentSettings.power ? "On" : "Off"}
    </button>
  </div>

  <!-- Mode Selector -->
  <div class="setting">
    <label for="mode">Mode:</label>
    <select 
      id="mode" 
      bind:value={currentSettings.mode} 
      disabled={disabledSettings.mode} 
      on:change={(e) => updateSetting("mode", parseInt(e.target.value))}
    >
      <option value=0>Auto</option>
      <option value=1>Heat</option>
      <option value=2>Cool</option>
      <option value=3>Dehumidify</option>
    </select>
  </div>

  <!-- Fan Speed -->
  <div class="setting">
    <label for="fan">Fan Speed:</label>
    <input
      id="fan"
      type="number"
      min="0"
      max="5"
      value={currentSettings.fan}
      disabled={
        disabledSettings.fan
      }
      on:input={(e) => updateSetting("fan", parseInt(e.target.value))}
    />
  </div>

  <!-- High Power Toggle -->
  <div class="setting">
    <label for="highPower">High Power:</label>
    <input
      id="highPower"
      type="checkbox"
      bind:checked={currentSettings.highPower}
      disabled={disabledSettings.highPower}
      on:change={(e) => updateSetting("highPower", e.target.checked)}
    />
  </div>

  <!-- Ten Degree Mode Toggle -->
  <div class="setting">
    <label for="tenDegreeMode">Ten Degree Mode:</label>
    <input
      id="tenDegreeMode"
      type="checkbox"
      bind:checked={currentSettings.tenDegreeMode}
      disabled={disabledSettings.tenDegreeMode}
      on:change={(e) => updateSetting("tenDegreeMode", e.target.checked)}
    />
  </div>
</div>

<style>
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .setting {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  label {
    font-weight: bold;
  }
  input[type="number"],
  select {
    width: 60px;
  }
  button {
    padding: 10px;
    background-color: #5b8c5a;
    color: white;
    border: none;
    cursor: pointer;
  }
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
  }
</style>
