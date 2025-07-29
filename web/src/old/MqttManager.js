// Import necessary dependencies
import { getUpdatedToken } from "./AuthManager";
import { fetchUserInfo } from "$lib/utils";
import mqtt from 'mqtt';
import { writable } from "svelte/store";

// Define MQTT configuration
const mqttURL = "wss://mqtt.melo.se:2096/mqtt";

// Writable stores for errors and temperature
export const mqttError = writable(false);
export const retainedTemperature = writable("");

// MQTT client reference
let client;

// Initialize the MQTT client
export async function initializeMQTT() {
  if (isClientConnected()) {
    console.info("MQTT client is already initialized and connected.");
    return;
  }

  try {
    const token = await fetchToken();
    const userinfo = await fetchUserDetails(token);

    client = createMQTTClient(userinfo.sub, token);
    setupClientHandlers(client);
  } catch (err) {
    handleInitializationError(err);
  }
}

// Helper function to fetch token
async function fetchToken() {
  const { accessToken } = await getUpdatedToken();
  return accessToken;
}

// Helper function to fetch user details
async function fetchUserDetails(token) {
  return await fetchUserInfo(token);
}

// Create and configure the MQTT client
function createMQTTClient(username, password) {
  return mqtt.connect(mqttURL, {
    username,
    password,
    reconnectPeriod: 10000
  });
}

// Setup event handlers for the MQTT client
function setupClientHandlers(clientInstance) {
  clientInstance.on('connect', onConnect);
  clientInstance.on('message', handleIncomingMessage);
  clientInstance.on('error', handleClientError);
  clientInstance.on('close', () => console.info("MQTT session closed"));
  clientInstance.on('disconnect', () => console.warn("MQTT session disconnected"));
  clientInstance.on('reconnect', () => console.info("Reconnecting MQTT client"));
  clientInstance.on('offline', () => handleClose());
}

// Handle successful connection
function onConnect() {
  console.info("Connected to MQTT broker.");
  mqttError.set("");

  subscribeToTopics(["heatpump/received", "heatpump/temperature/concat"]);
}

// Subscribe to multiple topics
function subscribeToTopics(topics) {
  topics.forEach((topic) => {
    client.subscribe(topic, handleSubscriptionError);
  });
}

// Handle subscription errors
function handleSubscriptionError(err) {
  if (err) {
    console.error("Subscription error:", err);
  }
}

// Handle incoming messages
function handleIncomingMessage(receivedTopic, message) {
  console.debug(`Message received on topic ${receivedTopic}:`, message.toString());

  if (receivedTopic === "heatpump/temperature/concat") {
    retainedTemperature.set(message.toString());
  }
}

// Handle client errors
function handleClientError(err) {
  console.error("MQTT error:", err);
  mqttError.set(err.toString());
}

// Handle reconnect and fetch new credentials
async function handleClose() {
  try {
    console.info("MQTT connection closed, reconnecting: fetching new credentials...");

    // Temporarily stop the client to prevent immediate reconnect attempts
    if (client.connected) {
      client.end(true, () => console.info("Temporarily stopped MQTT client for credential refresh."));
    }

    const token = await fetchToken();
    const userinfo = await fetchUserDetails(token);

    // Update client options with new credentials
    client.options.username = userinfo.sub;
    client.options.password = token;

    console.info("Updated MQTT client credentials for reconnection.");

    // Reconnect the client after updating credentials
    client.reconnect();
  } catch (error) {
    console.error("Failed to update credentials on reconnect:", error);
    mqttError.set(error.toString());
  }
}

// Handle initialization errors
function handleInitializationError(err) {
  console.error("Failed to initialize MQTT client:", err);
  mqttError.set(err.toString());
}

// Publish a message to a topic
export function publish(topic, message) {
  if (!isClientConnected()) {
    console.error("MQTT client is not connected");
    throw new Error("MQTT client is not connected");
  }

  client.publish(topic, message, (err) => {
    if (err) {
      console.error(`Error publishing to topic ${topic}:`, err);
    } else {
      console.info(`Message published to topic ${topic}`);
    }
  });
}

// Subscribe to a topic with a callback
export function subscribe(topic, callback) {
  if (!isClientConnected()) {
    console.error("MQTT client is not connected");
    throw new Error("MQTT client is not connected");
  }

  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to topic ${topic}:`, err);
    } else {
      console.info(`Subscribed to topic ${topic}`);
    }
  });

  client.on("message", (receivedTopic, message) => {
    if (receivedTopic === topic) {
      callback(message.toString());
    }
  });
}

// Unsubscribe from a topic
export function unsubscribe(topic) {
  if (!isClientConnected()) {
    console.error("MQTT client is not connected");
    throw new Error("MQTT client is not connected");
  }

  client.unsubscribe(topic, (err) => {
    if (err) {
      console.error(`Error unsubscribing from topic ${topic}:`, err);
    } else {
      console.info(`Unsubscribed from topic ${topic}`);
    }
  });
}

// Check if the MQTT client is connected
export function isClientConnected() {
  return client && client.connected;
}