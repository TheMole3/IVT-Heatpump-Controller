#ifndef IRCONTROLLER_H
#define IRCONTROLLER_H

#include <IRSender.h>
#include "BetterIVTHeatpumpIR.h"

const uint16_t kIrLed = 5;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).

class IRController2 {
private:
  BetterIVTHeatpumpIR ivt;

public:
    struct IRParams {
        int temp;
        int mode;
        int fan;
        bool power;
        bool highPower;
        bool tenDegreeMode;
    };

    void sendIR(IRParams params);
};

#endif  // IRCONTROLLER_H
