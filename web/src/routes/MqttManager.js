
import { getUpdatedToken } from "./AuthManager";
import { fetchUserInfo } from "$lib/utils";
import mqtt from 'mqtt';
import { writable } from "svelte/store";

let client;

export let mqttError = writable(false);
export let retainedTemperature = writable("");

export async function initializeMQTT() {
  let token = (await getUpdatedToken()).accessToken;
  let userinfo = await fetchUserInfo(token);

  try {
    client = mqtt.connect("wss://mqtt.melo.se:2096/mqtt", {
      username: userinfo.sub,
      password: token,
    }); // create a client
  } catch (err) {
    console.log("catch!")
    mqttError.set(err.toString())
    console.error(err);
  }

  client.on('connect', () => {
    client.subscribe("heatpump/received");
    client.subscribe("heatpump/temperature/concat");
  })

  let retrivedFirst = false;
  client.on('message', (receivedTopic, message) => {
    // Get retained temp
    if(receivedTopic == "heatpump/temperature/concat" && !retrivedFirst) {
      console.log(new TextDecoder().decode(message))
      retainedTemperature.set(new TextDecoder().decode(message));
      retrivedFirst = true;
    }
  })

  client.on('error', (err) => {
    mqttError.set(err.toString())
    console.error(err);
  })
  
}

// Store active listeners per topic
const topicListeners = new Map();

// Publish messages to a specific topic
export function publish(topic, message) {
  if (!client || !client.connected) {
    throw new Error("MQTT client is not connected");
  }
  client.publish(topic, message, (err) => {
    if (err) {
      console.error(`Error publishing to topic ${topic}:`, err);
    }
  });
}

// Subscribe to a specific topic with a specific callback
export function subscribe(topic, callback) {
  if (!client || !client.connected) {
    throw new Error("MQTT client is not connected");
  }

  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to topic ${topic}:`, err);
    }
  });

  // Store the listener callback for future reference
  if (!topicListeners.has(topic)) {
    topicListeners.set(topic, []);
  }
  topicListeners.get(topic).push(callback);

  client.on("message", (receivedTopic, message) => {
    if (receivedTopic === topic) {
      callback(message.toString());
    }
  });
}

// Unsubscribe from a specific topic for the current listener
export function unsubscribe(topic, callback) {
  if (!client || !client.connected) {
    throw new Error("MQTT client is not connected");
  }

  const listeners = topicListeners.get(topic);

  if (listeners) {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      // Remove the specific listener callback
      listeners.splice(index, 1);
      
      // Unsubscribe from the topic if no more listeners are present
      if (listeners.length === 0) {
        client.unsubscribe(topic, (err) => {
          if (err) {
            console.error(`Error unsubscribing from topic ${topic}:`, err);
          }
        });
      }
    }
  }
}

// Register persistent listeners for specific topics (global listener for the topic)
export function on(topic, listener) {
  if (!client) {
    throw new Error("MQTT client is not initialized");
  }

  client.on("message", (receivedTopic, message) => {
    if (receivedTopic === topic) {
      listener(message.toString());
    }
  });
}

// Subscribe to a topic for a single message with a timeout
export function onceWithTimeout(topic, timeout) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      return reject(new Error("MQTT client is not connected"));
    }

    const timeoutId = setTimeout(() => {
      client.removeListener("message", onMessage);
      reject(new Error(`Timeout waiting for message on topic ${topic}`));
    }, timeout);

    const onMessage = (receivedTopic, message) => {
      if (receivedTopic === topic) {
        clearTimeout(timeoutId);
        client.removeListener("message", onMessage);
        resolve(message.toString());
      }
    };

    client.on("message", onMessage);
    client.subscribe(topic, (err) => {
      if (err) {
        clearTimeout(timeoutId);
        client.removeListener("message", onMessage);
        reject(err);
      }
    });
  });
}

export function once(topic) {
  return new Promise((resolve, reject) => {
    if (!client || !client.connected) {
      return reject(new Error("MQTT client is not connected"));
    }

    const onMessage = (receivedTopic, message) => {
      if (receivedTopic === topic) {
        client.removeListener("message", onMessage);
        resolve(message.toString());
      }
    };

    client.on("message", onMessage);
    client.subscribe(topic, (err) => {
      if (err) {
        client.removeListener("message", onMessage);
        reject(err);
      }
    });
  });
}

// Check if the MQTT client is connected
export function isConnected() {
  return client && client.connected;
}
