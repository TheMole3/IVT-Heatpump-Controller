<script>
  import { goto } from "$app/navigation";

  let email = '';
  let password = '';
  let error = '';

  function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in both fields.';
      return;
    }

    const loginInfo = { email, password };
    localStorage.setItem('IVT-loginInfo', JSON.stringify(loginInfo));
    error = '';
    goto("/");
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-sm p-8 bg-white shadow-md rounded-2xl">
    <h2 class="mb-6 text-2xl font-semibold text-center">Login</h2>

    {#if error}
      <p class="mb-4 text-sm text-red-500">{error}</p>
    {/if}

    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700" for="email">Email</label>
        <input
          id="email"
          type="email"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          bind:value={email}
          required
        />
      </div>

      <div>
        <label class="block mb-1 text-sm font-medium text-gray-700" for="password">Password</label>
        <input
          id="password"
          type="password"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          bind:value={password}
          required
        />
      </div>

      <button
        type="submit"
        class="w-full px-4 py-2 text-white transition bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  </div>
</div>
