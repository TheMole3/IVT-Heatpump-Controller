#include "esp_oauth.h"

OAuthClient::OAuthClient(const char* apiUrl, const char* clientId, const char* username, const char* userPassword) {
  _apiUrl = apiUrl;
  _clientId = clientId;
  _username = username;
  _userPassword = userPassword;
}

String OAuthClient::sendPostRequest(const String& host, const String& path, const String& data, const String& bearerToken) {
  _client.setInsecure();
  if (!_client.connect(host.c_str(), 443)) {
    Serial.println("Connection failed!");
    return "";
  }
  // Send POST request
  _client.print(String("POST ") + path + " HTTP/1.0\r\n");
  _client.print("Host: " + String(host) + "\r\n");
  if(bearerToken.length() != 0) 
  {
    _client.print("Authorization: Bearer " + bearerToken + "\r\n");
  } 
  _client.print("Content-Type: application/x-www-form-urlencoded\r\n");
  _client.print("Content-Length: " + String(data.length()) + "\r\n");
  _client.print("Connection: close\r\n\r\n");
  _client.print(data);

  // Wait for response
  String response = "";
  while (_client.connected()) {
    while (_client.available()) {
      response += (char)_client.read();
    }
  }
  // Split response into headers and body
  int headerEndIndex = response.indexOf("\r\n\r\n");
  if (headerEndIndex != -1) {
    return response.substring(headerEndIndex + 4); // Skip past the \r\n\r\n
  }
  
  _client.stop();
  return response;
}

String OAuthClient::getAccessToken() {
  // Prepare the form data
  String postData = "grant_type=client_credentials";
  postData += "&client_id=" + String(_clientId);
  postData += "&username=" + String(_username);
  postData += "&password=" + String(_userPassword);
  postData += "&scope=openid profile";

  // Send the request
  String path = "/application/o/token/";
  String response = sendPostRequest(_apiUrl, path, postData);
  
  if (response.length() == 0) {
    Serial.println("Error: No response from server");
    return "";
  }

  // Parse the JSON response
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.println("Failed to parse JSON");
    return "";
  }

  // Extract the access token
  if (doc.containsKey("access_token")) {
    _accessToken = doc["access_token"].as<String>();
    Serial.println("Access token retrieved successfully");
    return _accessToken;
  } else {
    Serial.println("Error: No access token in response");
    return "";
  }
}

String OAuthClient::getUserInfo(String accessToken) {
  String path = "/application/o/userinfo/";

  String response = sendPostRequest(_apiUrl, path, "", accessToken);
  
  if (response.length() == 0) {
    Serial.println("Error: No response from server");
    return "";
  }

  _client.stop();
  
  // Parse the JSON response
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.println("Failed to parse user info JSON");
    return "";
  }

  // Extract the 'sub' field from user info
  String sub = doc["sub"].as<String>();
  return sub;
}
