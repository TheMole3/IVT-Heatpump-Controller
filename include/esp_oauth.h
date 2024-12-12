#ifndef ESP8266_OAUTH_H
#define ESP8266_OAUTH_H

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

class OAuthClient {
  public:
    OAuthClient(const char* apiUrl, const char* clientId, const char* username, const char* userPassword);
    String getAccessToken();
    String getUserInfo(String accessToken);
  
  private:
    const char* _apiUrl;
    const char* _clientId;
    const char* _username;
    const char* _userPassword;
    String _accessToken;

    WiFiClientSecure _client;
    String sendPostRequest(const String& host, const String& path, const String& data, const String& bearerToken = "");
};

#endif
