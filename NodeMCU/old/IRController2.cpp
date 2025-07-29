#include "IRController2.h"

IRSenderESP8266 IR(kIrLed);

#define IR_ONE_SPACE    1400
#define IR_ZERO_SPACE   430
#define IR_BIT_MARK     460
#define IR_PAUSE_SPACE  30000
#define IR_HEADER_MARK  3540
#define IR_HEADER_SPACE 1720
#define NUM_IR_BYTES 13

void IRController2::sendIR(IRParams params) {
  uint8_t powerMode;
  uint8_t operatingMode;
  uint8_t fanSpeed;
  uint8_t temperatureCmd;

  if(params.highPower) // If it is highpower
  {
    powerMode = POWER_FULL_ON;
  } 
  else // Else set it to the corresponding power 
  { 
    if(params.power) powerMode = POWER_ON;
    else powerMode = POWER_OFF;
  }

  Serial.print("Operating mode input: "); Serial.println(params.mode);
  switch (params.mode) 
  {
    case 0: operatingMode =  MODE_AUTO; break;
    case 1: operatingMode =  MODE_HEAT; break;
    case 2: operatingMode =  MODE_COOL; break;
    case 3: operatingMode =  MODE_DRY; break;
  }
  if(params.tenDegreeMode) operatingMode = MODE_MAINT;

  switch (params.fan) 
  {
    case 0: fanSpeed =  FAN_AUTO; break;
    case 1: fanSpeed =  FAN_1; break;
    case 2: fanSpeed =  FAN_2; break;
    case 3: fanSpeed =  FAN_3; break;
  }

  temperatureCmd = params.temp;

  ivt.send(IR, powerMode, operatingMode, fanSpeed, temperatureCmd);
}