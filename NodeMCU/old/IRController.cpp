#include "IRController.h"

IRSenderESP8266 IR(kIrLed);

#define IR_ONE_SPACE    1400
#define IR_ZERO_SPACE   430
#define IR_BIT_MARK     460
#define IR_PAUSE_SPACE  30000
#define IR_HEADER_MARK  3540
#define IR_HEADER_SPACE 1720
#define NUM_IR_BYTES 13


uint8_t IRController::reverseBits(uint8_t value, uint8_t numBits) {
    uint8_t result = 0;
    for (int i = 0; i < numBits; ++i) {
        result <<= 1;
        result |= (value & 1);
        value >>= 1;
    }
    return result;
}

void IRController::setBitSegment(uint8_t* irPackage, const BitSegment& bs, uint8_t value) {
    // Calculate the byte index and bit mask
    uint8_t byteIndex = bs.index;
    uint8_t bitMask = ((1 << bs.bits) - 1) << (8 - bs.bits - bs.offset);

    delay(1);

    // Clear the bits in the target byte
    irPackage[byteIndex] &= ~bitMask;

    delay(1);

    // Set the bits with the new value
    uint8_t newValue = !bs.inverted ? reverseBits(value, bs.bits) : value;
    irPackage[byteIndex] |= (newValue << (8 - bs.bits - bs.offset)) & bitMask;
}

void IRController::sendIR(IRParams params) {
    uint8_t SharpTemplate[] = { 0xAA, 0x5A, 0xCF, 0x10, 0x00, 0x00, 0x31, 0x06, 0x08, 0x80, 0x04, 0xF0, 0x01 };
    //                             0     1     2     3     4     5     6     7     8     9    10    11    12

    bool redo = false;

    // Temperatur
    if ( params.temp > 16 && params.temp < 32)
    {
        setBitSegment(SharpTemplate, bs_abs_temp, params.temp - 15);
    }
    if ( params.temp == 10)
    {
        SharpTemplate[4] = 0x00;
    }
       
    // Power
    setBitSegment(SharpTemplate, bs_state, stateConst(params.power));
    // Fan
    setBitSegment(SharpTemplate, bs_fan_strength, fanStrengthConst(params.fan));
    //Mode
    setBitSegment(SharpTemplate, bs_mode, modeConst(params.mode));
    if(modeConst(params.mode) == MODE_DRY) SharpTemplate[4] = 0x00;
    // Maintenance
    if(params.tenDegreeMode == 1) 
    {
        SharpTemplate[4] = 0x00;
        setBitSegment(SharpTemplate, bs_mode, MODE_HEAT);
    }
    // High Power
    if(params.highPower == 0) 
    {
        params.highPower = -1;
        setBitSegment(SharpTemplate, bs_state, STATE_FULL_EFFECT_OFF);
        redo = true;
    } 
    else if (params.highPower == 1)
    {
        setBitSegment(SharpTemplate, bs_state, STATE_FULL_EFFECT_ON);
    }

    uint8_t checksum = 0x00;

    // Calculate the checksum
    for (int i=0; i<12; i++) {
        checksum ^= SharpTemplate[i];
    }

    checksum ^= SharpTemplate[12] & 0x0F;
    checksum ^= (checksum >> 4);
    checksum &= 0x0F;

    SharpTemplate[12] |= (checksum << 4);

    // Send 5 times
    Serial.println("Sending byte sequence");
    for(int i=0; i<5; i++) {
        // 38 kHz PWM frequency
        IR.setFrequency(38);

        // Header
        IR.mark(IR_HEADER_MARK);
        IR.space(IR_HEADER_SPACE);

        for (int i = 0; i < sizeof(SharpTemplate); ++i) {
            Serial.print("0x");
            Serial.print(static_cast<int>(SharpTemplate[i]), HEX);
            Serial.print(" ");
        }
        Serial.print("\n");

        // Data
        for (unsigned int i=0; i<sizeof(SharpTemplate); i++) {
            IR.sendIRbyte(SharpTemplate[i], IR_BIT_MARK, IR_ZERO_SPACE, IR_ONE_SPACE);
        }

        // End mark
        IR.mark(IR_BIT_MARK);
        IR.space(0);

        delay(200);
    }

    if(redo) {
        delay(500);
        return sendIR(params);
    }
}
