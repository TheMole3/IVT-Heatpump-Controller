#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <LittleFS.h>
#include <FirebaseClient.h>
#include <ArduinoJson.h>
#include "IRController2.h"
#include "string.h"

// Firebase Configuration
FirebaseApp app;
WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);
RealtimeDatabase Database;
UserAuth* user_auth = nullptr;

// Web Server Configuration
ESP8266WebServer server(80);

// Configuration Variables
String firebase_host;
String firebase_key;
String firebase_user;
String firebase_pass;
bool shouldSaveConfig = false;

// Hardware Configuration
#define CONFIG_BUTTON_PIN D7

IRController2 ircontroller;

// Function Prototypes
void saveConfigCallback();
void onData(AsyncResult &res);
void setupConfiguration(bool forcePortal = false);
bool loadConfig();
bool saveConfig();
void checkForConfigMode();
void logConnectionDetails();
void checkFirebaseConnection();

void setup() {
    Serial.begin(9600);
    LittleFS.begin();

    loadConfig();
    setupConfiguration();
    checkForConfigMode();

    // SSL setup
    ssl_client.setInsecure();
    ssl_client.setTimeout(1000);
    ssl_client.setBufferSizes(4096, 1024);

    logConnectionDetails();

    // Firebase initialization
    if (firebase_key.isEmpty() || firebase_user.isEmpty() || firebase_pass.isEmpty()) {
        Serial.println("[ERROR] Missing Firebase credentials");
        setupConfiguration(true);
        return;
    }

    user_auth = new UserAuth(firebase_key.c_str(), firebase_user.c_str(), firebase_pass.c_str());
    initializeApp(aClient, app, getAuth(*user_auth), onData, "auth");
    app.getApp<RealtimeDatabase>(Database);
    Database.url(firebase_host.c_str());
    Database.get(aClient, "/heatpump/data", onData, true, "ivt-heatpump-controller");

    checkFirebaseConnection();
}

void loop() {
    app.loop();
    server.handleClient();
}

void logConnectionDetails() {
    Serial.printf("\n[NETWORK] SSID: %s\n", WiFi.SSID().c_str());
    Serial.printf("[NETWORK] IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[NETWORK] RSSI: %d dBm\n", WiFi.RSSI());
}

void checkFirebaseConnection() {
    Serial.println("\n[FIREBASE] Testing connection...");
    
    Database.get(aClient, "/.info/connected", [](AsyncResult &res) {
        if (res.isError()) {
            Serial.printf("[FIREBASE] Connection failed: %s (%d)\n", 
                         res.error().message().c_str(), res.error().code());
        } else {
            Serial.println("[FIREBASE] Connection successful");
            if (res.available()) {
                Serial.printf("[FIREBASE] Status: %s\n", res.c_str());
            }
        }
    }, false, "connection_test");
}

void setupConfiguration(bool forcePortal) {
    WiFiManager wm;
    wm.setBreakAfterConfig(true);
    wm.setSaveConfigCallback(saveConfigCallback);

    WiFiManagerParameter custom_firebase_host("host", "Firebase Host", firebase_host.c_str(), 80);
    WiFiManagerParameter custom_firebase_key("key", "Firebase API Key", firebase_key.c_str(), 64);
    WiFiManagerParameter custom_firebase_user("user", "Firebase Email", firebase_user.c_str(), 64);
    WiFiManagerParameter custom_firebase_pass("pass", "Firebase Password", firebase_pass.c_str(), 64);

    wm.addParameter(&custom_firebase_host);
    wm.addParameter(&custom_firebase_key);
    wm.addParameter(&custom_firebase_user);
    wm.addParameter(&custom_firebase_pass);

    bool success;
    if (forcePortal || !loadConfig()) {
        Serial.println("[CONFIG] Starting configuration portal");
        success = wm.startConfigPortal("ESP-Setup");
    } else {
        success = wm.autoConnect("ESP-Config");
    }

    if (!success) {
        Serial.println("[ERROR] Configuration failed");
        ESP.restart();
    }

    firebase_host = custom_firebase_host.getValue();
    firebase_key = custom_firebase_key.getValue();
    firebase_user = custom_firebase_user.getValue();
    firebase_pass = custom_firebase_pass.getValue();

    if (shouldSaveConfig) {
        saveConfig();
        Serial.println("[CONFIG] Saved successfully");
    }
}

void checkForConfigMode() {
    pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);
    delay(50);
    
    if (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
        unsigned long startPress = millis();
        while (digitalRead(CONFIG_BUTTON_PIN) == LOW) {
            if (millis() - startPress > 2000) {
                Serial.println("[CONFIG] Button held, starting portal");
                setupConfiguration(true);
                ESP.restart();
            }
        }
    }
}

void saveConfigCallback() {
    shouldSaveConfig = true;
}

void onData(AsyncResult &res) {
    if (res.isError()) {
        Serial.printf("[FIREBASE] Error: %s (%d)\n", 
                     res.error().message().c_str(), res.error().code());
        return;
    }

    if (!res.available()) return;

    RealtimeDatabaseResult &RTDB = res.to<RealtimeDatabaseResult>();
    
    // Skip processing if this is our own response update
    if (RTDB.isStream()) {
        Serial.println("----------------------------");
        Firebase.printf("task: %s\n", res.uid().c_str());
        Firebase.printf("event: %s\n", RTDB.event().c_str());
        Firebase.printf("path: %s\n", RTDB.dataPath().c_str());
        Firebase.printf("data: %s\n", RTDB.to<const char *>());
        Firebase.printf("type: %d\n", RTDB.type());


        if(strcmp(res.path().c_str(), "/heatpump/data") == 0 && strcmp(RTDB.event().c_str(), "put") == 0) {
            // Process the data as needed
            Serial.println("[FIREBASE] Processing heatpump data...");

            DynamicJsonDocument doc(2048);
            DeserializationError error = deserializeJson(doc, RTDB.to<const char *>());
            
            if (error) {
                Serial.printf("[ERROR] Failed to parse JSON: %s\n", error.c_str());
                return;
            }

            if (doc.containsKey("id")) {
                Database.set(aClient, "/response", String(doc["id"]).c_str());  

                IRController2::IRParams params;
                params.temp = doc["temp"];
                params.mode = doc["mode"];
                params.fan = doc["fan"];
                params.power = doc["power"];
                params.highPower = doc["highPower"];
                params.tenDegreeMode = doc["tenDegreeMode"];

                ircontroller.sendIR(params);

                Serial.printf("[FIREBASE] IR Params - Temp: %d, Mode: %d, Fan: %d, Power: %s, High Power: %s, Ten Degree Mode: %s\n",
                            params.temp, params.mode, params.fan,
                            params.power ? "ON" : "OFF",
                            params.highPower ? "ON" : "OFF",
                            params.tenDegreeMode ? "ON" : "OFF");

                Database.remove(aClient, "/heatpump/data");
            }
        }
    } else {
        Serial.println("----------------------------");
        Firebase.printf("task: %s, payload: %s\n", res.uid().c_str(), res.c_str());
    }
}

bool loadConfig() {
    if (!LittleFS.exists("/config.json")) {
        return false;
    }
    
    File f = LittleFS.open("/config.json", "r");
    if (!f) return false;

    DynamicJsonDocument doc(512);
    if (deserializeJson(doc, f)) {
        f.close();
        return false;
    }

    firebase_host = doc["host"].as<String>();
    firebase_key  = doc["key"].as<String>();
    firebase_user = doc["user"].as<String>();
    firebase_pass = doc["pass"].as<String>();
    
    f.close();
    return true;
}

bool saveConfig() {
    DynamicJsonDocument doc(512);
    doc["host"] = firebase_host;
    doc["key"]  = firebase_key;
    doc["user"] = firebase_user;
    doc["pass"] = firebase_pass;

    File f = LittleFS.open("/config.json", "w");
    if (!f) return false;
    
    serializeJson(doc, f);
    f.close();
    return true;
}