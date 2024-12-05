<script>
  import { getUpdatedToken, startOidcFlow } from "../AuthManager.js"

  let loading = true;
  let loginError = false;
  // Use this whenever you want to make a request that requires authentication.
  const makeAuthenticatedRequest = async () => {
    const response = await getUpdatedToken(); // Ensures the token is fresh
    loading = response.loading;
    loginError = response.loginError;

    let token = response.accessToken;
    console.log("Using token for request:", token);
  };

  makeAuthenticatedRequest();
</script>

<div class="w-screen bg-base-200 select-none flex justify-center">
  <div class="w-screen md:w-7/12 lg:w-5/12 sm flex flex-col items-center">

    {#if loginError} <!-- If an error occurs during login in-->
      <div class="error">
        <h1>Login failed</h1>
        <button on:click={startOidcFlow}>Try again</button>
      </div>
    {:else if loading}
      <div class="loading">Loading...</div>
    {:else}
      <p>Success</p>
    {/if}

  </div>
</div>
