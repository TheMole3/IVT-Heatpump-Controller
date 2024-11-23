<script>
    import Temperature from "../lib/Temperature.svelte";
    import Graph from "../lib/Graph.svelte";


    // Values
    import {settings} from "$lib/store.js"
    $: {
        settings.set(JSON.stringify({temp, tenDegreeMode, highPower, mode, fan, power}))
    }
    let temp = $settings.temp;
    let tenDegreeMode = $settings.tenDegreeMode;
    let highPower = $settings.highPower;
    let mode = $settings.mode;
    let fan = $settings.fan;
    let power = $settings.power;

    // Special temp values
    $: if(highPower) temp = "-"; else if(temp == "-") temp = 20;
    $: if(tenDegreeMode) temp = 10; else if(tempMin > temp || temp > tempMax) temp = 20;


    // Temp
    let tempMin = 18;
    let tempMax = 32;

    // Relative temp
    let relMode;
    $: {
        if(mode == 0||mode==3) 
        {
            relMode = true; 
            tempMin = -2
            tempMax = 2
            if(tempMin > temp || temp > tempMax) temp = 0;
        } else {
            relMode = false;
            tempMin = 18;
            tempMax = 32;
            if(tempMin > temp || temp > tempMax) temp = 20;
        } 
    }

    // Fan
    let fanMax = 3;
    $: if(mode == 3) fanMax = 0; else fanMax = 3;


    // Disable if high power or 10degree mode is on
    let disabled;
    $: disabled = tenDegreeMode || highPower;

    // Phone number
    import {token, settingsDefault} from "$lib/store.js"
    import mqtt from 'mqtt'
    const client = mqtt.connect("ws://localhost:9001");

    client.on("connect", (err) => console.error(err));


    let sendtoheatpump = () => {

        client.publish("heatpump/data", JSON.stringify({
            temp:temp || settingsDefault.temp,
            tenDegreeMode:tenDegreeMode || settingsDefault.tenDegreeMode,
            highPower:highPower || settingsDefault.highPower,
            mode:mode || settingsDefault.mode,
            fan:fan || settingsDefault.fan,
            power:power || settingsDefault.power
        }),{retain: true, qos: 2})


    }


</script>



<div class="w-screen bg-base-200 select-none flex justify-center">
    <div class="w-screen md:w-7/12 lg:w-5/12 sm flex flex-col items-center">
    
        <div class="mt-10 {disabled||!power?"opacity-20 pointer-events-none":""}">
            <Temperature {relMode} {disabled} bind:temp={temp} {tempMax} {tempMin}></Temperature>
        </div>

        <button on:click={() => {power = !power}} class="btn {power?"btn-success":"btn-error"} mt-10 w-8/12 rounded">
            {power?"På":"Av"}
        </button>

        <div class="mt-4 w-8/12 flex {!power?"opacity-20 pointer-events-none":""}">
            <div class="w-full grid grid-flow-col grid-cols-2 justify-between drop-shadow-sm gap-4">
                <button on:click={() => {highPower = !highPower}} class="btn btn-primary h-full rounded {tenDegreeMode?"opacity-20 pointer-events-none":""}">
                    <span class="p-4">High <br>Power</span>
                </button>

                <button on:click={() => {tenDegreeMode = !tenDegreeMode}} class="btn btn-primary h-full rounded {highPower?"opacity-20 pointer-events-none":""}">
                    <span class="p-4">&nbsp;&nbsp;10° <br>Läge</span>
                </button>

                
            </div>
        </div>

        <div class="mt-6 w-full {disabled||!power?"opacity-20 pointer-events-none":""}">
            <div class="flex flex-col w-full items-center">

                <div class="w-9/12 flex flex-col  {fanMax==0?"opacity-20 pointer-events-none":""}">
                    <span class="mb-2 w-full text-center">Fläkt</span>
                    <div class="mx-3">
                        <input class="range range-sm" type="range" min="0" max={fanMax} bind:value={fan} step="1" />
                        <div class="w-full flex justify-between text-xs px-2">
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                        </div>
                    </div>
                    <div class="w-full flex justify-between text-xs px-2">
                        <span>Auto</span>
                        <span>Låg</span>
                        <span>Med</span>
                        <span>Hög</span>
                    </div>
                </div>

                <div class="mt-6 w-9/12 flex flex-col">
                    <span class="mb-2 w-full text-center">Läge</span>
                    <div class="mx-3">
                        <input class="range range-sm" type="range" min="0" max="3" bind:value={mode}  step="1" />
                        <div class="w-full flex justify-between text-xs px-2">
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                            <span>|</span>
                        </div>
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

        <div class="w-8/12 mt-6">
            <button on:click={sendtoheatpump} class="btn btn-primary mt-3 mb-8 w-full rounded">
                Skicka till värmepumpen
            </button>
        </div>

        <div class="h-96">
            <Graph></Graph>
        </div>
    </div>
</div>