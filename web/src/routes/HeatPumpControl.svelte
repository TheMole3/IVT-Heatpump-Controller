<script>
  import { updateSetting } from "$lib/controller.js";
  import { settings } from "$lib/store.js";
  import Temperature from "./Temperature.svelte";

  let currentSettings = $settings
  let disabledSettings = $settings.disabledSettings


  // Reactive statement to track settings and their disabled states
  $: {
    currentSettings = $settings
    disabledSettings = $settings.disabledSettings
  }
</script>

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
  <button on:click={()=>console.log("send to heatpump")} class="btn btn-primary mt-3 mb-8 w-full rounded">
    Skicka till värmepumpen
  </button>
</div>