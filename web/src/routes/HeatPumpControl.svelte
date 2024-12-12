<script>
  import { updateSetting } from "$lib/controller.js";
  import { settings, settingsDefault } from "$lib/store.js";
  import Temperature from "./Temperature.svelte";
  import { subscribe, publish, unsubscribe } from './MqttManager'

  let currentSettings;
  let disabledSettings;
  let loading = false; // Track loading state
  let error = ''; // Track error message
  let success = false; // Track success state
  
  // Reactive statement to track settings and their disabled states
  $: {
    currentSettings = $settings
    disabledSettings = $settings.disabledSettings
  }

  async function sendToHeatpump() {
    let data = {
      temp: currentSettings.temp,
      mode: currentSettings.mode,
      fan:  currentSettings.fan,
      power: currentSettings.power,
      highPower: currentSettings.highPower,
      tenDegreeMode: currentSettings.tenDegreeMode,
      id: Math.floor((Math.random() * 99999))
    }

    try {
      // Indicate loading is in progress
      loading = true;
      error = ''; // Clear any previous error
      success = false; // Clear success state

      console.log("Sending data to heatpump");
      publish("heatpump/data", JSON.stringify(data));

      let timeout;

      console.log("Waiting to hear back from heatpump");
      let callback = (d) => {
        if (d == data.id) {
          clearTimeout(timeout);
          console.log("Received back the right id!");
          loading = false; // Hide the loading spinner
          success = true; // Show success message
        }
      };
      subscribe("heatpump/received", callback);

      timeout = setTimeout(() => {
        unsubscribe("heatpump/received", callback);
        console.error("Error waiting for heatpump/received");
        loading = false;
        error = 'Timeout: No response from heatpump'; // Show error message
      }, 60 * 1000);
    } catch (err) {
      console.error("Error whilst sending to heatpump", err);
      loading = false;
      error = 'Error while sending data to heatpump';
    }
  }
</script>

{#if currentSettings}
<div class="mt-10">
  <Temperature bind:temp={currentSettings.temp} bind:disabled={disabledSettings.temp} bind:mode={currentSettings.mode} {updateSetting}></Temperature>
</div>

<button on:click={() => { updateSetting("power", !currentSettings.power) }} class="btn {currentSettings.power ? 'btn-success' : 'btn-error'} mt-10 w-8/12 rounded">
  {currentSettings.power ? 'På' : 'Av'}
</button>

<div class="mt-4 w-8/12 flex">
  <div class="w-full grid grid-flow-col grid-cols-2 justify-between drop-shadow-sm gap-4">
    <button on:click={() => { updateSetting("highPower", !currentSettings.highPower) }} class="btn btn-primary h-full rounded {disabledSettings.highPower ? 'opacity-20 pointer-events-none' : ''}">
      <span class="p-4">High <br>Power</span>
    </button>
    <button on:click={() => { updateSetting("tenDegreeMode", !currentSettings.tenDegreeMode) }} class="btn btn-primary h-full rounded {disabledSettings.tenDegreeMode ? 'opacity-20 pointer-events-none' : ''}">
      <span class="p-4">10° <br>Läge</span>
    </button>
  </div>
</div>

<div class="mt-6 w-full">
  <div class="flex flex-col w-full items-center">
    <div class="w-9/12 flex flex-col  {disabledSettings.fan ? 'opacity-20 pointer-events-none' : ''}">
      <span class="mb-2 w-full text-center">Fläkt</span>
      <div class="mx-3">
        <input class="range range-sm" type="range" min="0" max="3" on:change={(e) => updateSetting("fan", parseInt(e.target.value))} bind:value={currentSettings.fan} step="1" />
        <div class="w-full flex justify-between text-xs px-2">
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
        </div>
        <div class="w-full flex justify-between text-xs px-2">
          <span>Auto</span>
          <span>Låg</span>
          <span>Med</span>
          <span>Hög</span>
        </div>
      </div>
    </div>

    <div class="mt-6 w-9/12 flex flex-col {disabledSettings.mode ? 'opacity-20 pointer-events-none' : ''}">
      <span class="mb-2 w-full text-center">Läge</span>
      <div class="mx-3">
        <input class="range range-sm" type="range" min="0" max="3"  on:change={(e) => updateSetting("mode", parseInt(e.target.value))} bind:value={currentSettings.mode} step="1" />
        <div class="w-full flex justify-between text-xs px-2">
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
        </div>
        <div class="w-full flex justify-between text-xs px-2">
          <span>Auto</span>
          <span>Värme</span>
          <span>Kylning</span>
          <span>Avfukt</span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="w-8/12 mt-6">
  <button on:click={sendToHeatpump} class="btn btn-primary mt-3 mb-8 w-full rounded">
    Skicka till värmepumpen
  </button>
</div>

{#if loading || error}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
    <div class="bg-white p-6 rounded-lg shadow-lg w-8/12">
      <div class="flex justify-center mb-4">
        <div class="loading h-8 w-8"></div>
      </div>
      <div class="text-center">
        {#if error}
          <p class="text-red-500 mt-4">{error}</p>
          <button on:click={() => {loading = false, error = ''}} class="mt-8 btn btn-primary rounded w-full">Ok</button>
        {:else} 
          <p>Väntar på bekräftelse från värmepumpen...</p>
        {/if}

      </div>
    </div>
  </div>
{/if}

{#if success}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
    <div class="bg-white p-6 rounded-lg shadow-lg">
      <div class="text-center">
        <p class="text-green-500 font-bold">Datan är skickad till värmepumpen!</p>
        <!-- Close Button -->
        <button on:click={() => {success = false}} class="mt-8 btn btn-primary rounded w-full">Ok</button>
      </div>
    </div>
  </div>
{/if}
{/if}