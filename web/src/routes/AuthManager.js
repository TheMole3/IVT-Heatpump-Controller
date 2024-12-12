import { accessToken, refreshToken } from "$lib/store.js";
import { getOidcConfig, exchangeCodeForToken, refreshAccessToken } from "$lib/utils.js";

// Initialize only when running in the browser
let clientId = "pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8";
let redirectUri = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

// Helper function to get the current value of a store
function getStoreValue(store) {
  let value;
  const unsubscribe = store.subscribe(($store) => {
    value = $store;
  });

  // Immediately unsubscribe after getting the value
  unsubscribe();

  return value;
}

async function logout() {
  // Clear the access and refresh tokens
  accessToken.set(null);
  refreshToken.set(null);

  try {
    // If the OIDC configuration has a logout endpoint, redirect the user there
    const config = await getOidcConfig();
    if (config.end_session_endpoint) {
      const logoutUrl = `${config.end_session_endpoint}?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = logoutUrl;
    } else {
      // Fallback to redirecting the user to the application's home page
      window.location.href = redirectUri;
    }
  } catch (error) {
    console.error("Error during logout", error);
    // Even if the logout endpoint fails, redirect to the application's home page
    window.location.href = redirectUri;
  }
}

async function refreshTokenIfNeeded() {
  const currentAccessToken = getStoreValue(accessToken);
  if (!currentAccessToken || isTokenExpired(currentAccessToken)) {
    return await ensureValidToken();
  }
  return { loading: false, loginError: false };
}

function isTokenExpired(token) {
  const decoded = JSON.parse(atob(token.split(".")[1])); // Decode JWT token
  const expirationTime = decoded.exp * 1000; // Convert expiration time to milliseconds
  return Date.now() > expirationTime;
}

async function tryRefreshToken() {
  const currentRefreshToken = getStoreValue(refreshToken);
  if (currentRefreshToken) {
    try {
      const refreshedTokenData = await refreshAccessToken(currentRefreshToken, clientId);
      if (refreshedTokenData.access_token) {
        accessToken.set(refreshedTokenData.access_token);
        refreshToken.set(refreshedTokenData.refresh_token);
        console.log("Access token refreshed");
        return { loading: false, loginError: false };
      }
    } catch (err) {
      console.error("Error refreshing access token", err);
      console.log(err);
      return { loading: false, loginError: "Error refreshing access token" };
    }
  }
  return { loading: false, loginError: "No refresh token" };
}

async function handleOidcRedirect() {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      try {
        const tokenData = await exchangeCodeForToken(code, redirectUri, clientId);
        accessToken.set(tokenData.access_token);
        refreshToken.set(tokenData.refresh_token);
        console.log("Token exchange successful");
        return { loading: false, loginError: false };
      } catch (err) {
        console.error("Error during token exchange", err);
        return { loading: false, loginError: "Error during token exchange" };
      }
    } else {
      console.log("Couldn't login");
      return { loading: false, loginError: "Missing state or code" };
    }
  }
  return { loading: false, loginError: "No window context" };
}

async function startOidcFlow() {
  if (typeof window !== "undefined") {
    try {
      const config = await getOidcConfig();
      const scope = "openid profile offline_access";
      const responseType = "code";
      const state = Math.random().toString(36).substring(7);
      const authUrl = `${config.authorization_endpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
      window.location.replace(authUrl);
      return { loading: true, loginError: false };
    } catch (error) {
      console.log(error);
      return { loading: false, loginError: "Error getting OIDC" };
    }
  }
  return { loading: false, loginError: "No window context" };
}

async function ensureValidToken() {
  const isRefreshed = await tryRefreshToken();
  const currentAccessToken = getStoreValue(accessToken);

  if (!isRefreshed.loading && !currentAccessToken) {
    if (typeof window !== "undefined" && window.location.search.includes("code=")) {
      return await handleOidcRedirect();
    } else {
      return await startOidcFlow();
    }
  }
  return { loading: false, loginError: false };
}

// No eager call to fetch or token validation here, only when needed.
async function getUpdatedToken() {
  const refreshState = await refreshTokenIfNeeded();
  return refreshState.loading ? { loading: true, loginError: false } : { accessToken: getStoreValue(accessToken), loading: false, loginError: false };
}

// Export the functions for use in other parts of the application
export { getUpdatedToken, ensureValidToken, startOidcFlow, handleOidcRedirect, tryRefreshToken, refreshTokenIfNeeded, logout };
