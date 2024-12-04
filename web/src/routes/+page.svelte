<script>
    import { onMount } from 'svelte';
    import Temperature from "../lib/Temperature.svelte";
    import Graph from "../lib/Graph.svelte";
    import { settings, token, settingsDefault } from "$lib/store.js";
    import mqtt from 'mqtt';
  
    const OIDC_CONFIG_URL = 'https://sso.melo.se/application/o/emqx/.well-known/openid-configuration';
    let accessToken = '';
    let userInfo = {};
    let loading = true;
    let loginError = false;
  
    // Fetch OIDC configuration
    async function getOidcConfig() {
      const response = await fetch(OIDC_CONFIG_URL);
      return response.json();
    }
  
    // Start OIDC login flow
    function startOidcFlow() {
      getOidcConfig().then(config => {
        const clientId = 'pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8';
        const redirectUri = window.location.href.split("?")[0];
        const scope = 'openid profile email';
        const responseType = 'code';
        const state = Math.random().toString(36).substring(7);
  
        const authUrl = `${config.authorization_endpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
        window.location.href = authUrl;
      }).catch(() => {
        loginError = true;
        loading = false;
      });
    }
  
    // Handle redirect from OIDC provider
    async function handleOidcRedirect() {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
  
      if (code && state) {
        try {
          const config = await getOidcConfig();
          const tokenEndpoint = config.token_endpoint;
          const clientId = 'pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8';
          const redirectUri = window.location.href.split("?")[0];
  
          const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: clientId,
          });
  
          const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });
          const data = await response.json();
  
          if (data.access_token) {
            accessToken = data.access_token;
            await fetchUserInfo(accessToken);
            loading = false;
          } else {
            loginError = true;
            loading = false;
          }
        } catch (err) {
          console.error('Error during token exchange', err);
          loginError = true;
          loading = false;
        }
      } else {
        startOidcFlow();
      }
    }
  
    // Fetch user info
    async function fetchUserInfo(accessToken) {
      try {
        const config = await getOidcConfig();
        const response = await fetch(config.userinfo_endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        userInfo = await response.json();
      } catch (err) {
        console.error('Error fetching user info', err);
        loginError = true;
      }
    }
  
    // App state management
    onMount(() => {
      if (window.location.search.includes('code=')) {
        handleOidcRedirect();
      } else {
        startOidcFlow();
      }
    });
  
    // MQTT Setup
    const client = mqtt.connect("ws://localhost:9001");
    client.on("connect", err => console.error(err));
  
    // Temperature and other controls
    $: {
      settings.set(JSON.stringify({ temp, tenDegreeMode, highPower, mode, fan, power }));
    }
  
    let temp = $settings.temp;
    let tenDegreeMode = $settings.tenDegreeMode;
    let highPower = $settings.highPower;
    let mode = $settings.mode;
    let fan = $settings.fan;
    let power = $settings.power;
  
    let tempMin = 18;
    let tempMax = 32;
    let relMode;
    $: {
      if (mode == 0 || mode == 3) {
        relMode = true;
        tempMin = -2;
        tempMax = 2;
        if (tempMin > temp || temp > tempMax) temp = 0;
      } else {
        relMode = false;
        tempMin = 18;
        tempMax = 32;
        if (tempMin > temp || temp > tempMax) temp = 20;
      }
    }
  
    let fanMax = 3;
    $: if (mode == 3) fanMax = 0;
  
    let disabled;
    $: disabled = tenDegreeMode || highPower;
  
    // New state variables
    let waitingForResponse = false;
    let waitError = false;

    // Function to handle sending the message and waiting for a response
    let currentMessageId = null;

    function sendtoheatpump() {
    waitingForResponse = true;
    waitError = false;
    currentMessageId = Math.floor(Math.random() * 99999999);

    client.publish("heatpump/data", JSON.stringify({
        temp: temp || settingsDefault.temp,
        tenDegreeMode: tenDegreeMode || settingsDefault.tenDegreeMode,
        highPower: highPower || settingsDefault.highPower,
        mode: mode || settingsDefault.mode,
        fan: fan || settingsDefault.fan,
        power: power || settingsDefault.power,
        id: currentMessageId,
    }), { retain: true, qos: 2 });

    // Start a timeout to handle no response
    setTimeout(() => {
        if (waitingForResponse) {
            waitingForResponse = false;
            waitError = true;
        }
    }, 10000); // Wait 10 seconds for a response
    }

    // MQTT subscription to listen for responses
    client.on("message", (topic, message) => {
    if (topic === "heatpump/received") {
        try {
            const payload = JSON.parse(message.toString());
            if (payload.id === currentMessageId) {
                waitingForResponse = false;
            }
        } catch (err) {
            console.error("Error parsing MQTT message", err);
        }
    }
    });

    // Subscribe to the topic
    client.subscribe("heatpump/received");
  </script>
  
  <style>
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  
    .spinner {
      border: 4px solid transparent;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 3rem;
      height: 3rem;
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  
    .error {
      color: red;
      text-align: center;
    }
  </style>
  
  {#if waitingForResponse}
    <div class="loading-container flex-col">
        <div class="spinner"></div>
        <p>Waiting for heat pump response...</p>
    </div>
    {:else if waitError}
    <div class="error">
        <h1>No response from heat pump</h1>
        <p>Please try again.</p>
        <button class="btn mt-2 w-8/12 rounded" on:click={() => { waitError = false; }}>Okay</button>
      </div>
    {:else if loading}
    <div class="loading-container">
        <div class="spinner"></div>
    </div>
    {:else if loginError}
    <div class="w-screen select-none flex justify-center">
        <div class="error md:w-7/12 lg:w-5/12 sm">
            <h1>Kunde inte logga in!</h1>
            <p>Försök igen senare.</p>
            <br>
            <p>Tryck för att försöka igen</p>
            <button on:click={() => { startOidcFlow() }} class="btn mt-2 w-8/12 rounded">
                Logga in
            </button>
        </div>
    </div>
  {:else}
    <div class="w-screen bg-base-200 select-none flex justify-center">
      <div class="w-screen md:w-7/12 lg:w-5/12 sm flex flex-col items-center">
        <div class="mt-10 {disabled || !power ? 'opacity-20 pointer-events-none' : ''}">
          <Temperature {relMode} {disabled} bind:temp={temp} {tempMax} {tempMin}></Temperature>
        </div>
  
        <button on:click={() => { power = !power }} class="btn {power ? 'btn-success' : 'btn-error'} mt-10 w-8/12 rounded">
          {power ? 'På' : 'Av'}
        </button>
  
        <div class="mt-4 w-8/12 flex {!power ? 'opacity-20 pointer-events-none' : ''}">
          <div class="w-full grid grid-flow-col grid-cols-2 justify-between drop-shadow-sm gap-4">
            <button on:click={() => { highPower = !highPower }} class="btn btn-primary h-full rounded {tenDegreeMode ? 'opacity-20 pointer-events-none' : ''}">
              <span class="p-4">High <br>Power</span>
            </button>
            <button on:click={() => { tenDegreeMode = !tenDegreeMode }} class="btn btn-primary h-full rounded {highPower ? 'opacity-20 pointer-events-none' : ''}">
              <span class="p-4">10° <br>Läge</span>
            </button>
          </div>
        </div>
  
        <div class="mt-6 w-full {disabled || !power ? 'opacity-20 pointer-events-none' : ''}">
          <div class="flex flex-col w-full items-center">
            <div class="w-9/12 flex flex-col  {fanMax == 0 ? 'opacity-20 pointer-events-none' : ''}">
              <span class="mb-2 w-full text-center">Fläkt</span>
              <div class="mx-3">
                <input class="range range-sm" type="range" min="0" max={fanMax} bind:value={fan} step="1" />
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
  
            <div class="mt-6 w-9/12 flex flex-col">
              <span class="mb-2 w-full text-center">Läge</span>
              <div class="mx-3">
                <input class="range range-sm" type="range" min="0" max="3" bind:value={mode} step="1" />
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
          <button on:click={sendtoheatpump} class="btn btn-primary mt-3 mb-8 w-full rounded">
            Skicka till värmepumpen
          </button>
        </div>
  
        <div class="h-96">
          <Graph></Graph>
        </div>
      </div>
    </div>
  {/if}
  