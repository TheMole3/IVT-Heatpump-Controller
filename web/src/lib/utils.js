// utils.js
// Utility function to fetch the OIDC configuration
export async function getOidcConfig() {
  const OIDC_CONFIG_URL =
    "https://sso.melo.se/application/o/emqx/.well-known/openid-configuration";
  const response = await fetch(OIDC_CONFIG_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch OIDC configuration");
  }

  return response.json();
}

// Utility function to exchange the authorization code for an access token
export async function exchangeCodeForToken(code, redirectUri, clientId) {
  const config = await getOidcConfig();
  const tokenEndpoint = config.token_endpoint;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange authorization code for token");
  }

  return response.json();
}

// Utility function to refresh the access token using a refresh token
export async function refreshAccessToken(refreshToken, clientId) {
  const config = await getOidcConfig();
  const tokenEndpoint = config.token_endpoint;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  return response.json();
}

// Utility function to fetch user information from the OIDC provider
export async function fetchUserInfo(accessToken) {
  const config = await getOidcConfig();
  const response = await fetch(config.userinfo_endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user information");
  }

  return await response.json();
}
