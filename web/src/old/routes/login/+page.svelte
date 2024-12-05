// src/App.svelte

<script>
  import { onMount } from 'svelte';

  // Configuration for your OIDC provider
  const OIDC_CONFIG_URL = 'https://sso.melo.se/application/o/emqx/.well-known/openid-configuration';

  // State for storing tokens
  let accessToken = '';
  let idToken = '';
  let userInfo = {};

  // Function to fetch OIDC configuration
  async function getOidcConfig() {
    const response = await fetch(OIDC_CONFIG_URL);
    const config = await response.json();
    return config;
  }
  
  // Function to initiate the OIDC authorization flow
  function startOidcFlow() {
    getOidcConfig().then(config => {
      const clientId = 'pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8';  // Use your OIDC client ID
      const redirectUri = window.location.href.split("?")[0];;
      const scope = 'openid profile email'; // Requested scopes
      const responseType = 'code'; // Authorization code flow
      const state = Math.random().toString(36).substring(7); // Random state for security

      // Create the authorization URL
      const authUrl = `${config.authorization_endpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

      // Redirect the user to the OIDC provider for login
      window.location.href = authUrl;
    });
  }

  // Function to handle the redirect from the OIDC provider
  async function handleOidcRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      // Exchange the authorization code for tokens
      getOidcConfig().then(config => {
        const clientId = 'pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8';
        const redirectUri = window.location.href.split("?")[0];
        const tokenEndpoint = config.token_endpoint;

        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
        });

        fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        })
          .then(response => response.json())
          .then(data => {
            if (data.access_token) {
              // Store the tokens (you may store in sessionStorage or localStorage for persistence)
              accessToken = data.access_token;

              // Optionally fetch user info using the ID token
              fetchUserInfo(accessToken);
            }
          })
          .catch(err => console.error('Error exchanging code for tokens', err));
      });
    }
  }

  // Function to fetch user info from the provider
  function fetchUserInfo(accessToken) {
    getOidcConfig().then(config => {
      const userInfoEndpoint = config.userinfo_endpoint;

      fetch(userInfoEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then(response => response.json())
        .then(data => {
            console.log(data)
          userInfo = data;
        })
        .catch(err => console.error('Error fetching user info', err));
    });
  }

  // Run the redirect handler on mount to process the callback
  onMount(() => {
    if (window.location.search.includes('code=')) {
      handleOidcRedirect();
    } else {
      startOidcFlow();
    }
  });
</script>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  button {
    padding: 1rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

<div class="container">
  <h1>OIDC Flow with Svelte</h1>
  {#if accessToken}
    <div>
      <h2>Welcome, {userInfo.name || 'User'}</h2>
      <p>Email: {userInfo.email}</p>
      <p>Access Token: {accessToken}</p>
    </div>
  {:else}
    <button on:click={startOidcFlow}>Login with OpenID Connect</button>
  {/if}
</div>
