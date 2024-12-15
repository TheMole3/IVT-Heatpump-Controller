import { accessToken, refreshToken } from "$lib/store.js";
import {
  getOidcConfig,
  exchangeCodeForToken,
  refreshAccessToken,
} from "$lib/utils.js";

let clientId = "pPdjbX7XGaFpwme0AlZCPbkJ5ZFF4lGYRWOeLIy8";
let redirectUri =
  typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

// Helper function to get the current value of a store
function getStoreValue(store) {
  let value;
  const unsubscribe = store.subscribe(($store) => {
    value = $store;
  });
  unsubscribe(); // Immediately unsubscribe after reading value
  return value;
}

// Log out the user
async function logout() {
  try {
    accessToken.set(null);
    refreshToken.set(null);

    const config = await getOidcConfig();
    if (config?.end_session_endpoint) {
      const logoutUrl = `${
        config.end_session_endpoint
      }?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(
        redirectUri
      )}`;
      window.location.href = logoutUrl;
    } else {
      window.location.href = redirectUri; // Fallback to home
    }
  } catch (error) {
    console.error("Error during logout:", error.message || error);
    window.location.href = redirectUri; // Always redirect even if logout fails
  }
}

// Check if the token is expired
function isTokenExpired(token) {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1])); // Decode JWT
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() > expirationTime;
  } catch (error) {
    console.error("Error decoding token:", error.message || error);
    return true; // Assume expired if decoding fails
  }
}

// Refresh token if needed
async function refreshTokenIfNeeded() {
  try {
    const currentAccessToken = getStoreValue(accessToken);
    if (!currentAccessToken || isTokenExpired(currentAccessToken)) {
      return await ensureValidToken();
    }
    return { loading: false, loginError: false };
  } catch (error) {
    console.error("Error refreshing token if needed:", error.message || error);
    return { loading: false, loginError: "Failed to refresh token" };
  }
}

// Attempt to refresh the access token
async function tryRefreshToken() {
  const currentRefreshToken = getStoreValue(refreshToken);

  if (!currentRefreshToken) {
    console.warn("No refresh token available");
    return { loading: false, loginError: "No refresh token available" };
  }

  try {
    const refreshedTokenData = await refreshAccessToken(
      currentRefreshToken,
      clientId
    );
    if (refreshedTokenData?.access_token) {
      accessToken.set(refreshedTokenData.access_token);
      refreshToken.set(refreshedTokenData.refresh_token);
      console.info("Access token refreshed");
      return { loading: false, loginError: false };
    } else {
      throw new Error("No access token returned from refresh");
    }
  } catch (error) {
    console.error("Error refreshing access token:", error.message || error);
    return { loading: false, loginError: "Failed to refresh access token" };
  }
}

// Handle the OIDC redirect after login
async function handleOidcRedirect() {
  if (typeof window === "undefined") {
    return { loading: false, loginError: "No window context" };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");

  if (!code || !state) {
    console.warn("Missing code or state in redirect URL");
    return { loading: false, loginError: "Missing state or code in URL" };
  }

  try {
    const tokenData = await exchangeCodeForToken(code, redirectUri, clientId);
    accessToken.set(tokenData.access_token);
    refreshToken.set(tokenData.refresh_token);

    console.info("Token exchange successful");
    window.history.replaceState({}, "", redirectUri); // Remove query params
    return { loading: false, loginError: false };
  } catch (error) {
    console.error("Error during token exchange:", error.message || error);
    return { loading: false, loginError: "Failed to exchange token" };
  }
}

// Start the OIDC authentication flow
async function startOidcFlow() {
  if (typeof window === "undefined") {
    return { loading: false, loginError: "No window context" };
  }

  try {
    const config = await getOidcConfig();
    const scope = "openid profile offline_access";
    const responseType = "code";
    const state = Math.random().toString(36).substring(7); // Generate random state
    const authUrl = `${config.authorization_endpoint}?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    window.location.replace(authUrl); // Redirect to login
    return { loading: true, loginError: false };
  } catch (error) {
    console.error("Error starting OIDC flow:", error.message || error);
    return { loading: false, loginError: "Failed to start OIDC flow" };
  }
}

// Ensure a valid token is available
async function ensureValidToken() {
  try {
    const refreshState = await tryRefreshToken();
    const currentAccessToken = getStoreValue(accessToken);

    if (!refreshState.loading && !currentAccessToken) {
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("code=")
      ) {
        return await handleOidcRedirect();
      } else {
        return await startOidcFlow();
      }
    }

    return { loading: false, loginError: false };
  } catch (error) {
    console.error("Error ensuring valid token:", error.message || error);
    return { loading: false, loginError: "Failed to ensure valid token" };
  }
}

// Get an updated token when needed
async function getUpdatedToken() {
  try {
    const refreshState = await refreshTokenIfNeeded();
    if (refreshState.loading) {
      return { loading: true, loginError: false };
    }
    return {
      accessToken: getStoreValue(accessToken),
      loading: false,
      loginError: false,
    };
  } catch (error) {
    console.error("Error getting updated token:", error.message || error);
    return { loading: false, loginError: "Failed to get updated token" };
  }
}

export {
  getUpdatedToken,
  ensureValidToken,
  startOidcFlow,
  handleOidcRedirect,
  tryRefreshToken,
  refreshTokenIfNeeded,
  logout,
};
