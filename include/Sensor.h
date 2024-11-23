#ifndef SENSOR_H
#define SENSOR_H

#include <AM2302-Sensor.h>
#include "PubSubClient.h"

const int SENSOR_PIN = 4;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).

class Sensor {
    private:
    AM2302::AM2302_Sensor am2302{SENSOR_PIN};

    const unsigned long updateInterval = 30 * 60000; // update very 30 minutes
    unsigned long lastUpdateTime = updateInterval; // update very 30 minutes
    float temperature;

    float sensor2lasttemperatureread = NAN;

    public:
    void readProcessSensorData(PubSubClient &mqttClient);
};

#endif