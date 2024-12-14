#define WEBSERVER_H
#include <WiFiManager.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <PubSubClient.h>
#include <IRController.h>
#include <ESP8266mDNS.h>
#include <Sensor.h>
#include <espnow.h>
#include <esp_oauth.h>

struct Config
{
    char mqttServer[40];
    int mqttPort;
    char mqttUsername[40];
    char mqttPassword[80];
    char OIDCHost[40];
    char clientID[50];
    int temperatureInterval;
} config;

OAuthClient OAuth(config.OIDCHost, config.clientID, config.mqttUsername, config.mqttPassword);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

WiFiManager wifiManager;
AsyncWebServer server(80);
IRController ircontroller;
Sensor sensor;

String lastmessage = "";

void saveConfig()
{
    EEPROM.begin(sizeof(config));
    EEPROM.put(0, config);
    EEPROM.commit();
}

void loadConfig()
{
    EEPROM.begin(sizeof(config));
    EEPROM.get(0, config);
    EEPROM.end();
}

// Set up WiFi and configuration page
void setupWiFiAndConfig()
{
    String newHostname = "heatpump";
    WiFi.hostname(newHostname.c_str());

    loadConfig();

    Serial.println("Connecting to WiFi...");

    // Attempt to connect to WiFi; block further execution if connection fails
    if (!wifiManager.autoConnect("HeatpumpController"))
    {
        Serial.println("Failed to connect to WiFi, restarting...");
        delay(60000);
        ESP.restart();
    }

    // If connected, log IP address
    Serial.print("Connected! IP Address: ");
    Serial.println(WiFi.localIP());

    // Start mDNS at esp8266.local address
    if (!MDNS.begin("heatpump"))
    {
        Serial.println("Error starting mDNS");
    }
    Serial.println("mDNS started");
    MDNS.addService("http", "tcp", 80);

    // Initialize ESP-NOW
    if (esp_now_init() != 0)
    {
        Serial.println("Error initializing ESP-NOW");
        return;
    }

    esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
    esp_now_register_recv_cb(&sensor.onReceive);


    // Setup configuration server page
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
              {
        String mqttconnected = "No";
        if(mqttClient.connected()) {
            mqttconnected = "Yes";
        }

        String html = "<html><form method='POST' action='/'><style>form {display:grid;row-gap:5px;grid: auto auto/ auto auto auto auto; max-width:42rem; width:100%;} input {grid-column: span 3}</style>";
        html += "MQTT Server: <input name='mqttServer' value='" + String(config.mqttServer) + "'><br>";
        html += "MQTT Port: <input name='mqttPort' value='" + String(config.mqttPort) + "'><br>";
        html += "MQTT Username: <input name='mqttUsername' value='" + String(config.mqttUsername) + "'><br>";
        html += "MQTT Password: <input type='password' name='mqttPassword' value='" + String(config.mqttPassword) + "'><br>";
        html += "OIDC Host: <input name='OIDCHost' value='" + String(config.OIDCHost) + "'><br>";
        html += "Client_id: <input name='clientID' value='" + String(config.clientID) + "'><br>";
        html += "Temperature collection interval (m): <input name='temperatureInterval' value='" + String(config.temperatureInterval) + "'><br>";
        html += "<input type='submit'></form>";
        html += "<p>Connected to MQTT Server? : " + mqttconnected + "</p>";
        html += "<p>MAC Adress: " + WiFi.macAddress() + "</p>";
        html += "<p>Last received message: </p><p>" + lastmessage + "</p>";
        html += "</html>";
        request->send(200, "text/html", html); });

    server.on("/", HTTP_POST, [](AsyncWebServerRequest *request)
              {
        if (request->hasParam("mqttServer", true)) {
            strcpy(config.mqttServer, request->getParam("mqttServer", true)->value().c_str());
            config.mqttPort = request->getParam("mqttPort", true)->value().toInt();
            strcpy(config.mqttUsername, request->getParam("mqttUsername", true)->value().c_str());
            strcpy(config.mqttPassword, request->getParam("mqttPassword", true)->value().c_str());
            strcpy(config.OIDCHost, request->getParam("OIDCHost", true)->value().c_str());
            strcpy(config.clientID, request->getParam("clientID", true)->value().c_str());
            config.temperatureInterval = request->getParam("temperatureInterval", true)->value().toInt();
            saveConfig();
        }
        request->send(200, "text/plain", "Configuration saved. Restart device."); });

    server.begin();
}

// MQTT callback function
void callback(char *topic, byte *payload, unsigned int length)
{
    String message;
    for (unsigned int i = 0; i < length; i++)
    {
        message += (char)payload[i];
    }
    if (strcmp(topic, "heatpump/data") == 0)
    {
        Serial.println(message);
        lastmessage = message;

        // Create an instance of the struct
        IRController::IRParams params;

        // Parse the JSON string
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, message);

        if (error)
        {
            Serial.print(F("deserializeJson() failed: "));
            Serial.println(error.f_str());
            return;
        }

        // Map JSON values to the struct
        params.temp = doc["temp"];
        params.mode = doc["mode"];
        params.fan = doc["fan"];
        params.power = doc["power"];
        params.highPower = doc["highPower"];
        params.tenDegreeMode = doc["tenDegreeMode"];

        mqttClient.publish("heatpump/received", String(doc["id"]).c_str());
        Serial.println("Got heatpump/data");

        // Call function from IrController.h
        ircontroller.sendIR(params);
    }
}

// Setup MQTT connection
void setupMqtt()
{
    String accessToken = OAuth.getAccessToken();
    String sub = OAuth.getUserInfo(accessToken);

    mqttClient.setServer(config.mqttServer, config.mqttPort);
    mqttClient.setCallback(callback);
    mqttClient.setBufferSize(1536);
    mqttClient.setKeepAlive(60);

    // Serial.println("Trying to connect to mqtt with credentials");
    // Serial.println(sub.c_str());Serial.println( accessToken.c_str());

    if (mqttClient.connect("ESP8266Client", sub.c_str(), accessToken.c_str(), 0, 2, 0, 0, 1))
    {
        mqttClient.subscribe("heatpump/data");
        Serial.println("Connected to MQTT broker.");
    }
    else
    {
        Serial.println("Failed to connect to MQTT broker.");
    }
}

void setup()
{
    Serial.begin(9600);
    setupWiFiAndConfig();
    // Additional setup code here if connected to WiFi
}

void loop()
{
    if (!mqttClient.connected())
    {
        setupMqtt();
        delay(10000);
    }
    mqttClient.loop();
    sensor.readProcessSensorData(mqttClient, config.temperatureInterval * 60 * 1000);
}