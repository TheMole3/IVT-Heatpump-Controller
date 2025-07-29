#include "unistd.h"

// =============== Configuration Section ===============
namespace Config {
    // WiFi Configuration
    const char* WIFI_SSID = "";
    const char* WIFI_PASSWORD = "";

    // Firebase Configuration
    const char* WEB_API_KEY = "";
    const char* DATABASE_URL = "";
    const char* USER_EMAIL = "";
    const char* USER_PASSWORD = "";

    // NTP Configuration
    const char* NTP_SERVER = "pool.ntp.org";
    const long TIMEZONE_OFFSET = 0; // UTC
    const unsigned long NTP_UPDATE_INTERVAL = 30 * 60000; // 30 minutes

    // Sensor Configuration
    const unsigned long SENSOR_READ_INTERVAL = 30 * 60 * 1000UL; // 30 minutes
    const uint8_t SENSOR_PIN = 4;
    const unsigned long SENSOR_INIT_DELAY = 3000; // 3 seconds

    // Network Settings
    const unsigned long WIFI_CONNECT_TIMEOUT = 30000; // 30 seconds
    const unsigned long WIFI_RETRY_DELAY = 300;

    // Firebase Settings
    const unsigned long SSL_TIMEOUT = 20000;
    const size_t SSL_RX_BUFFER_SIZE = 4096;
    const size_t SSL_TX_BUFFER_SIZE = 1024;
}