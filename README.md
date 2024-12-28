# ESP8266 IVT Heat Pump Controller  

**A system for controlling an IVT heat pump over the internet using an ESP8266, an IR transmitter, and optional additional sensors.**  

This system functions like the stock remote for the IVT heat pump but allows control over the internet. It supports temperature adjustments, mode switching, fan speed settings, power mode toggling, and the 10°C mode. Additionally, it supports optional temperature sensors for enhanced monitoring.  

---

## Features  
- Full remote control functionality:  
  - Adjust temperature  
  - Switch modes (e.g., heating, cooling)  
  - Change fan speed  
  - Enable/disable power mode and 10°C mode  
- **Integrated temperature sensor**: View semi-real-time temperature readings on the web interface.  
- **Optional extra temperature sensor**: Use an additional ESP8266-based sensor with **ESP-NOW** communication to monitor temperature from another spot in the house.  
- Web-based user interface for convenient control over the internet.  

---

## Tech Stack  
The system is built with:  
- **ESP8266** *(NodeMCU)*: For the embedded system using PlatformIO.  
- **[Svelte](https://svelte.dev/)**: Webapp for controlling the heat pump.  
- **[Node.js](https://nodejs.org/)**: For temperature data aggregation.  
- **MQTT**: Communication between the ESP8266 controller and services.  
- **ESP-NOW**: Low-power, peer-to-peer communication between ESP8266 devices for additional sensors.  
- **[IRremoteESP8266](https://github.com/crankyoldgit/IRremoteESP8266)**: For sending IR signals, with additional reverse engineering of the IVT protocol using an IR receiver.  

---

## Internet Control
The system uses MQTT for communication, with a web app acting as the primary interface for user interaction. The web app provides an easy way to control the heat pump remotely.  

---

## Hardware Requirements and Assembly  
While this project assumes basic knowledge of electronics, hardware assembly instructions are **not covered** here. However, you’ll need:  
- An ESP8266 board for the main controller.  
- An IR transmitter and receiver.  
- A temperature sensor (optional, for the main controller).  
- An additional ESP8266 board with a temperature sensor (optional, for monitoring another location in the house).  

---

## Target Audience  
This project was developed for personal use and is tailored to a specific setup. However, it may inspire others with similar use cases.  

---

## Current Status  
The system is fully functional and actively used.  

---

## Setup Instructions  

### Embedded System (Main Controller)  
1. Clone the repository and configure the ESP8266 firmware using **PlatformIO**:  
   ```bash  
   git clone https://github.com/TheMole3/IVT-HeatPump-Controller.git  
   cd IVT-HeatPump-Controller/NodeMCU  
   pio run --target upload  
