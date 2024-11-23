#ifndef IRCONTROLLER_H
#define IRCONTROLLER_H

#include <IRremoteESP8266.h>
#include <IRSender.h>

const uint16_t kIrLed = 5;  // ESP8266 GPIO pin to use. Recommended: 4 (D2).

class IRController {
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

private:
    struct BitSegment {
        uint8_t index;     // byte position in the IR package
        uint8_t offset;    // bit offset in the byte
        uint8_t bits;      // bits in field
        uint8_t inverted;  // if the bits should be reversed before used as a number
    };

    const BitSegment bs_mode = { 6, 6, 2, 0 };
    #define MODE_FAN  0b00
    #define MODE_HEAT 0b10
    #define MODE_COOL 0b01
    #define MODE_DRY  0b11
    inline const int modeConst(int value) {
        switch(value) {
            case 0: return MODE_FAN;
            case 1: return MODE_HEAT;
            case 2: return MODE_COOL;
            case 3: return MODE_DRY;
            default: return 0b000;
        }
    }

    const BitSegment bs_state = { 5, 1, 3, 0};
    #define STATE_ON              0b100
    #define STATE_OFF             0b010
    #define STATE_FULL_EFFECT_ON  0b011
    #define STATE_FULL_EFFECT_OFF 0b111
    inline const int stateConst(int value) {
        switch(value) {
            case 0: return STATE_OFF;
            case 1: return STATE_ON;
            default: return 0b000;
        }
    }

    const BitSegment bs_fan_strength = { 6, 1, 3, 0};
    #define STRENGTH_SLOW   0b110
    #define STRENGTH_MEDIUM 0b101
    #define STRENGTH_FAST   0b111
    #define STRENGTH_AUTO   0b010
    inline const int fanStrengthConst(int value) {
        switch(value) {
            case 0: return STRENGTH_AUTO;
            case 1: return STRENGTH_SLOW;
            case 2: return STRENGTH_MEDIUM;
            case 3: return STRENGTH_FAST;
            default: return 0b000;
        }
    }

    const BitSegment bs_abs_temp          = { 4, 4, 4, 1};
    const BitSegment bs_rel_temp          = { 4, 2, 2, 1};

    uint8_t reverseBits(uint8_t value, uint8_t numBits);
    void setBitSegment(uint8_t* irPackage, const BitSegment& bs, uint8_t value);
};

#endif  // IRCONTROLLER_H
