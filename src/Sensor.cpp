#include "Sensor.h"

void Sensor::readProcessSensorData(PubSubClient &mqttClient) {
    unsigned long currentMillis = millis();

    if ((currentMillis - lastUpdateTime) >= updateInterval) {
        lastUpdateTime = millis();
        auto status = am2302.read();
        if (status == AM2302::AM2302_READ_OK) {
            temperature = am2302.get_Temperature();
        } else {
            Serial.println("Error with sensor");
        }

        String message = "{";
            message += "\"sensor1\":" + String(temperature) + ",";
            message += "\"sensor2\":"  + String(sensor2lasttemperatureread);
            message += '}';
        temperature = NAN;
        sensor2lasttemperatureread = NAN;
        Serial.println(message);

        if (!mqttClient.connected()) {
            Serial.println("MQTT client not connected");
            return;
        }

        mqttClient.publish("heatpump/temperature", message.c_str());
    }
}