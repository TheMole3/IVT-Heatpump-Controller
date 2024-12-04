#include "Sensor.h"

Sensor mySensor;

void Sensor::readProcessSensorData(PubSubClient &mqttClient) {
    unsigned long currentMillis = millis();

    if ((currentMillis - mySensor.lastUpdateTime) >= mySensor.updateInterval) {
        mySensor.lastUpdateTime = millis();
        auto status = am2302.read();
        if (status == AM2302::AM2302_READ_OK) {
            mySensor.temperature = am2302.get_Temperature();
        } else {
            Serial.println("Error with sensor");
        }

        String message = "{";
            message += "\"sensor1\":" + String(mySensor.temperature) + ",";
            message += "\"sensor2\":"  + String(mySensor.sensor2lasttemperatureread);
            message += '}';
        mySensor.temperature = NAN;
        mySensor.sensor2lasttemperatureread = NAN;
        Serial.println(message);

        if (!mqttClient.connected()) {
            Serial.println("MQTT client not connected");
            return;
        }

        mqttClient.publish("heatpump/temperature", message.c_str());
    }
}

void Sensor::onReceive(uint8_t *macAddr, uint8_t *incomingData, uint8_t len) {
    SensorData sensorData;
    memcpy(&sensorData, incomingData, sizeof(sensorData));

    Serial.print("Temperature received from child: ");
    Serial.println(sensorData.temperature);

    mySensor.sensor2lasttemperatureread = sensorData.temperature;

    UntilNextUpdate untilNextUpdate;

    unsigned long currentMillis = millis();
    untilNextUpdate.time = mySensor.updateInterval-(currentMillis - mySensor.lastUpdateTime);
    Serial.println(untilNextUpdate.time);
    esp_now_send(macAddr, (uint8_t *)&untilNextUpdate, sizeof((untilNextUpdate)));
}