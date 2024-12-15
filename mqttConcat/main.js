
const mqtt = require('mqtt');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jwtDecode = require('jwt-decode');
require('dotenv').config();

// Configuration
const OIDC_CONFIG = {
  issuer: process.env.ISSUER,
  token_endpoint: process.env.TOKEN_ENDPOINT,
  client_id: process.env.CLIENT_ID, // Replace with your client ID
  password: process.env.OIDCPASSWORD, // Replace with your client secret
  username: process.env.OIDCUSERNAME,
  scope: "openid profile",
};

const MQTT_CONFIG = {
  brokerUrl: 'wss://mqtt.melo.se:2096/mqtt',
  clientId: "HeatpumpConcatenator",
};

const TOPICS = {
  input: 'heatpump/temperature',
  output: 'heatpump/temperature/concat',
};

const DATA_FILE_PATH = path.join(__dirname, 'data/sensor_data.json');
let sensorData = [];

// Helper function to fetch an access token using client credentials
async function fetchAccessToken() {
  try {
    const response = await axios.post(OIDC_CONFIG.token_endpoint, new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: OIDC_CONFIG.client_id,
      username: OIDC_CONFIG.username,
      password: OIDC_CONFIG.password,
      scope: OIDC_CONFIG.scope,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to fetch access token:', error.response?.data || error.message);
    throw new Error('Unable to retrieve access token');
  }
}

// Helper function to discard old data (older than 72 hours)
function cleanupOldData() {
  const cutoff = moment().subtract(72, 'hours').toISOString();
  sensorData = sensorData.filter(entry => moment(entry.timestamp).isAfter(cutoff));
}

// Function to load data from the file at startup
function loadData() {
  if (fs.existsSync(DATA_FILE_PATH)) {
    const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    try {
      sensorData = JSON.parse(fileData);
      cleanupOldData(); // Remove data older than 72 hours
    } catch (error) {
      console.error('Error loading data from file:', error);
      sensorData = [];
    }
  }
}

// Function to save data to a file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(sensorData, null, 2), 'utf8');
    console.log('Sensor data saved to file');
  } catch (error) {
    console.error('Error saving data to file:', error);
  }
}

function setupClient(client) {
  client.on('connect', () => {
    console.log('Connected to MQTT broker');

    // Subscribe to the input topic to receive sensor data
    client.subscribe(TOPICS.input, (err) => {
      if (err) {
        console.error('Failed to subscribe:', err);
      } else {
        console.log(`Subscribed to topic: ${TOPICS.input}`);
      }
    });
  });

  client.on('message', (topic, message) => {
    if (topic === TOPICS.input) {
      try {
        const data = JSON.parse(message.toString().replace("nan", "null"));
        const timestamp = moment().toISOString();
        const newData = { timestamp, ...data };

        sensorData.push(newData);
        cleanupOldData();
        saveData();

        // Publish the updated data list to the output topic
        client.publish(TOPICS.output, JSON.stringify(sensorData), { qos: 0, retain: true }, null);
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    }
  });

  client.on('close', async () => {
    console.log('Disconnected from MQTT broker. Fetching new credentials and reconnecting...');
    try {
      const token = await fetchAccessToken();
      const decodedToken = jwtDecode.jwtDecode(token);

      client.end(true, () => {
        console.log('Existing MQTT client closed');
      });

      const newClient = mqtt.connect(MQTT_CONFIG.brokerUrl, {
        clientId: MQTT_CONFIG.clientId,
        username: decodedToken.sub,
        password: token,
      });

      setupClient(newClient);
    } catch (error) {
      console.error('Failed to reconnect with new credentials:', error);
    }
  });
}

async function start() {
  console.log("Version 1.2");

  try {
    const token = await fetchAccessToken();
    const decodedToken = jwtDecode.jwtDecode(token);

    const client = mqtt.connect(MQTT_CONFIG.brokerUrl, {
      clientId: MQTT_CONFIG.clientId,
      username: decodedToken.sub,
      password: token,
    });

    setupClient(client);

    // Load existing data from the file when the application starts
    loadData();
  } catch (error) {
    console.error('Failed to start application:', error);
  }
}


start();