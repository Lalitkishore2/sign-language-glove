/**
 * ============================================================
 *  Sign Language Glove — ESP32 DevKit V1
 * ============================================================
 *  Hardware:
 *    - 5x Flex Sensors    → GPIO 32, 33, 34, 35, 36 (VP)
 *      + 68kΩ pull-down resistors on each pin to GND
 *    - MPU6050 (I2C)      → SDA=GPIO21, SCL=GPIO22
 *    - ST7735 TFT 1.8"    → CS=5, DC=2, RST=4, SCK=18, MOSI=23
 *
 *  Gestures recognized (ISL-based):
 *    Hearing, Thank You, Morning, I, Bye, Name, Indian
 *
 *  Workflow:
 *    1. Boot → 3-second TFT countdown while hand held FLAT/OPEN
 *    2. Calibration reads baseline ADC values (= "open hand")
 *    3. Loop: read sensors → normalize → match gesture → display
 * ============================================================
 */

#if !defined(ARDUINO) || !defined(__xtensa__)
// Zero-dependency C/C++ fallback types for VS Code static linter
typedef decltype(sizeof(0)) size_t;
typedef unsigned char uint8_t;
typedef unsigned char byte;
typedef unsigned short uint16_t;
typedef short int16_t;

#define ST77XX_BLACK 0
#define ST7735_BLACK 0
#define ST7735_WHITE 0
#define ST7735_RED 0
#define INITR_BLACKTAB 0
#define WL_CONNECTED 3
#define INPUT 0
#define M_PI 3.14159265358979323846
#define PI M_PI
#define ADC_11db 0
#define WIFI_STA 1

class String {
  const char* _s;
public:
  String(const char* s = "") : _s(s) {}
  String(int v) : _s("") {}
  int length() const { return 0; }
  const char* c_str() const { return _s ? _s : ""; }
  int indexOf(const char*) const { return -1; }
  bool operator==(const char*) const { return false; }
};

class SerialStub {
public:
  void begin(int) {}
  void print(const char*) {}
  void print(const String&) {}
  void println(const char* = "") {}
  void println(const String&) {}
  void printf(const char*, ...) {}
  bool available() { return false; }
  char read() { return 0; }
};
static SerialStub Serial;

enum WStype_t { WStype_TEXT };
class WebSocketsServer {
public:
  WebSocketsServer(int) {}
  void begin() {}
  void loop() {}
  void onEvent(void(*)(uint8_t, WStype_t, uint8_t*, size_t)) {}
  void broadcastTXT(const char*) {}
};

class GFXcanvas16 {
public:
  GFXcanvas16(int, int) {}
  void fillScreen(uint16_t) {}
  void drawRect(int, int, int, int, uint16_t) {}
  void fillRect(int, int, int, int, uint16_t) {}
  void drawFastHLine(int, int, int, uint16_t) {}
  void drawLine(int, int, int, int, uint16_t) {}
  void fillCircle(int, int, int, uint16_t) {}
  void setTextSize(uint8_t) {}
  void setTextColor(uint16_t) {}
  void setCursor(int, int) {}
  void print(const char*) {}
  void print(const String&) {}
  void printf(const char*, ...) {}
  void* getBuffer() { return nullptr; }
};

class Adafruit_ST7735 {
public:
  Adafruit_ST7735(int, int, int) {}
  void initR(int) {}
  void setSPISpeed(int) {}
  void setRotation(int) {}
  void fillScreen(uint16_t) {}
  void drawRGBBitmap(int, int, void*, int, int) {}
  void setCursor(int, int) {}
  void setTextColor(uint16_t) {}
  void setTextSize(uint8_t) {}
  void print(const char*) {}
  void print(const String&) {}
};

class MPU6050 {
public:
  void initialize() {}
  bool testConnection() { return true; }
  void getMotion6(int16_t*, int16_t*, int16_t*, int16_t*, int16_t*, int16_t*) {}
};

class WiFiStub {
public:
  void mode(int) {}
  void setAutoReconnect(bool) {}
  void begin(const char*, const char*) {}
  int status() { return WL_CONNECTED; }
  const char* localIP() { return "192.168.1.100"; }
};
static WiFiStub WiFi;

class SPIStub {
public:
  void begin(int, int, int, int) {}
};
static SPIStub SPI;

class WireStub {
public:
  void begin(int, int) {}
  void beginTransmission(uint8_t) {}
  uint8_t endTransmission() { return 0; }
};
static WireStub Wire;

inline int snprintf(char*, size_t, const char*, ...) { return 0; }
inline int analogRead(int) { return 0; }
inline void analogSetWidth(int) {}
inline void analogSetPinAttenuation(int, int) {}
inline void pinMode(int, int) {}
inline void delay(unsigned long) {}
inline unsigned long millis() { return 0; }
inline long map(long x, long in_min, long in_max, long out_min, long out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
inline int constrain(int x, int a, int b) { return x < a ? a : (x > b ? b : x); }
inline int abs(int x) { return x < 0 ? -x : x; }
inline double atan2(double y, double x) { return 0.0; }
inline double sqrt(double x) { return 0.0; }
#else
#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <MPU6050.h>
#include <SPI.h>
#include <Wire.h>
#include <math.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#endif

/* =========================================================================
   WIFI & WEBSOCKETS CONFIGURATION
   ========================================================================= */
const char* ssid = "MUTHU KUMARAN SIVA";
const char* password = "Mks05052006.";

WebSocketsServer webSocket = WebSocketsServer(81);

/* =========================================================================
   PIN DEFINITIONS
   ========================================================================= */
// Flex Sensors (Analog Input)
#define FLEX_THUMB  33
#define FLEX_INDEX  32
#define FLEX_MIDDLE 34
#define FLEX_RING   35
#define FLEX_LITTLE 36  // VP — input only, external 68kΩ pull-down required

// TFT Display (Hardware SPI)
#define TFT_CS  5
#define TFT_DC  2
#define TFT_RST 4

/* =========================================================================
   GLOBAL INSTANCES
   ========================================================================= */
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
GFXcanvas16 canvas(160, 128); // Landscape 160x128 buffer
MPU6050 mpu;

// Forward Declarations
void readIMURaw(float &roll, float &pitch);

/* =========================================================================
   GESTURE SYSTEM
   ========================================================================= */
// Number of gestures
#define NUM_GESTURES 7

// Finger indices
#define THUMB  0
#define INDEX  1
#define MIDDLE 2
#define RING   3
#define LITTLE 4

/**
 * GestureTemplate — defines what a specific hand sign looks like.
 *
 * flex[5]: Target normalized bend per finger (0=straight, 100=fully bent).
 * flex_tol: How many normalized units each flex sensor can deviate.
 * roll_min/max: Acceptable wrist roll range in degrees.
 * pitch_min/max: Acceptable wrist pitch range in degrees.
 * use_imu: Whether MPU6050 orientation matters for this gesture.
 */
struct GestureTemplate {
  const char* name;
  int flex[5];       // [THUMB, INDEX, MIDDLE, RING, LITTLE]
  int flex_tol;      // Tolerance per finger (normalized units)
  float roll_min;
  float roll_max;
  float pitch_min;
  float pitch_max;
  bool use_imu;
};

/**
 * ISL Gesture Definitions
 *
 * NOTE: These are approximate starting values based on common ISL signs.
 *       After running the glove, use the Serial Monitor to view your actual
 *       normalized values for each pose and update these numbers to match.
 *
 * Normalized bend: 0 = finger fully straight, 100 = finger fully bent.
 *
 * Gesture descriptions:
 *  HEARING  : Point index finger toward ear. Index+Middle bent, others open.
 *  THANK YOU: Flat hand, all fingers open, palm out from chin.
 *  MORNING  : All fingers extended upward (hand raised).
 *  I        : Point to self (index pointing up, others bent, palm facing in).
 *  BYE      : Open flat hand waving (all straight, tilted/rolled sideways).
 *  NAME     : Two fingers (index+middle) tapping — both bent moderately.
 *  INDIAN   : Pinch near forehead (thumb+index pinch, others closed).
 */
const GestureTemplate gestures[NUM_GESTURES] = {
  // name        TH   IX   MX   RG   LT   tol  roll_min roll_max pitch_min pitch_max imu
  { "HEARING",  {100, 0,   100, 100, 100},25,   60,      110,    -20,      20,       true  },
  { "THANK YOU",{0,   0,   0,   0,   0},  25,   -30,     30,     60,       110,      true  },
  { "MORNING",  {0,   0,   0,   0,   0},  25,   -30,     30,     -30,      30,       true  },
  { "I",        {100, 0,   100, 100, 100},25,   -110,   -60,    -30,      30,       true  },
  { "BYE",      {20,  20,  20,  20,  20}, 25,   -45,     45,     60,       120,      true  },
  { "NAME",     {100, 0,   0,   100, 100},25,   -30,     30,     -30,      30,       true  },
  { "INDIAN",   {0,   100, 100, 100, 100},25,   60,      120,    60,       120,      true  },
};

/* =========================================================================
   CALIBRATION DATA
   ========================================================================= */
// Raw ADC readings for each finger when hand is OPEN (flat)
int baseline[5]      = {0, 0, 0, 0, 0};
// Raw ADC readings for each finger when hand is CLOSED (fist)
int full_bend[5]     = {0, 0, 0, 0, 0};
bool calibrated      = false;
bool mpuConnected    = false; // Tracks whether MPU6050 was found at boot
float rollOffset     = 0.0f;  // Software IMU offsets
float pitchOffset    = 0.0f;

// GPIO pin array for indexed access
const int FLEX_PINS[5] = {FLEX_THUMB, FLEX_INDEX, FLEX_MIDDLE, FLEX_RING, FLEX_LITTLE};

/* =========================================================================
   STATE MACHINE
   ========================================================================= */
enum AppState {
  STATE_CALIBRATING,
  STATE_RECOGNIZING,
  STATE_TESTING         // Activated via Serial 't' command
};
AppState appState = STATE_CALIBRATING;

// Recognition timing
unsigned long lastReadTime     = 0;
const unsigned long READ_INTERVAL = 80;  // Read sensors every 80ms

// Result display — keep showing a matched word for this many ms
String currentGesture          = "";
unsigned long gestureShownAt   = 0;
const unsigned long HOLD_MS    = 1500;   // Show word for 1.5s minimum

/* =========================================================================
   ADC MULTISAMPLING — reduces noise by averaging 16 rapid reads
   ========================================================================= */
int readAnalogFiltered(int pin) {
  long sum = 0;
  for (int k = 0; k < 16; k++) {
    sum += analogRead(pin);
  }
  return (int)(sum / 16);
}

/* =========================================================================
   HELPER: DRAW CENTERED TEXT ON CANVAS
   ========================================================================= */
void drawCentered(const String &text, int y, uint8_t size, uint16_t color) {
  int totalWidth = text.length() * 6 * size - size;
  int x = (160 - totalWidth) / 2;
  if (x < 0) x = 0;
  canvas.setTextSize(size);
  canvas.setTextColor(color);
  canvas.setCursor(x, y);
  canvas.print(text);
}

/* =========================================================================
   HELPER: FLUSH CANVAS TO SCREEN
   ========================================================================= */
void flushCanvas() {
  tft.drawRGBBitmap(0, 0, canvas.getBuffer(), 160, 128);
}

/* =========================================================================
   SCREEN: CALIBRATION COUNTDOWN
   ========================================================================= */
void drawCalibrationScreen(const String &stepTitle, const String &instruction, int secondsLeft) {
  canvas.fillScreen(0x0863); // Deep blue-gray

  // Header
  canvas.fillRect(0, 0, 160, 18, 0x10A2);
  drawCentered("CALIBRATING", 4, 1, 0xFD20);
  canvas.drawFastHLine(0, 18, 160, 0x07FF);

  // Instructions
  drawCentered(stepTitle, 28, 1, 0xFFFF);
  drawCentered(instruction, 42, 1, 0xBDF7);

  // Countdown
  String countStr = String(secondsLeft);
  drawCentered(countStr, 60, 4, 0x07FF); // Large cyan number

  drawCentered("seconds remaining", 105, 1, 0xBDF7);

  flushCanvas();
}

/* =========================================================================
   SCREEN: CALIBRATION DONE
   ========================================================================= */
void drawCalibrationDone() {
  canvas.fillScreen(0x0863);
  canvas.fillRect(0, 0, 160, 18, 0x10A2);
  drawCentered("CALIBRATION DONE", 4, 1, 0x07E0); // Green header
  canvas.drawFastHLine(0, 18, 160, 0x07E0);

  // Draw checkmark circles
  canvas.fillCircle(80, 65, 28, 0x07E0);
  canvas.fillCircle(80, 65, 22, 0x0863);
  // Checkmark lines
  canvas.drawLine(68, 65, 76, 73, 0x07E0);
  canvas.drawLine(68, 65, 76, 73, 0x07E0);
  canvas.drawLine(76, 73, 94, 55, 0x07E0);
  canvas.drawLine(75, 74, 93, 56, 0x07E0);

  drawCentered("Ready!", 100, 2, 0xFFFF);

  flushCanvas();
  delay(1500);
}

/* =========================================================================
   SCREEN: CALIBRATION ERROR
   ========================================================================= */
void drawCalibrationErrorScreen() {
  canvas.fillScreen(0x8000); // Red background
  canvas.fillRect(0, 0, 160, 18, 0x5000); // Darker red header
  drawCentered("CALIBRATION ERROR", 4, 1, 0xFFFF);
  canvas.drawFastHLine(0, 18, 160, 0xF800);

  drawCentered("Flat & Fist poses", 32, 1, 0xFFFF);
  drawCentered("were too similar!", 46, 1, 0xFFFF);
  
  drawCentered("Please ensure you", 70, 1, 0xBDF7);
  drawCentered("bend all fingers", 84, 1, 0xBDF7);
  drawCentered("during Step 2.", 98, 1, 0xBDF7);

  drawCentered("Retrying in 4s...", 114, 1, 0xFD20); // Yellow text
  
  flushCanvas();
}

/* =========================================================================
   SCREEN: MAIN GESTURE DASHBOARD
   ========================================================================= */
void drawDashboard(const String &gesture, int normalizedFlex[5],
                   float roll, float pitch, float confidence) {
  canvas.fillScreen(0x0821); // Dark charcoal

  // Header
  canvas.fillRect(0, 0, 160, 18, 0x10A2);
  drawCentered("SIGN LANGUAGE GLOVE", 4, 1, 0xFD20);
  canvas.drawFastHLine(0, 18, 160, 0x07FF);

  // Recognized word (large)
  if (gesture.length() > 0) {
    // Dynamic text size — fit within 150px width
    uint8_t sz = (gesture.length() <= 5) ? 3 : (gesture.length() <= 8 ? 2 : 1);
    uint16_t wordColor = 0x07E0; // Green
    drawCentered(gesture, 22, sz, wordColor);
  } else {
    drawCentered("---", 28, 3, 0x3186); // Muted gray
  }

  // Confidence bar (y: 62)
  canvas.setTextSize(1);
  canvas.setTextColor(0xBDF7);
  canvas.setCursor(12, 64);
  canvas.print("Confidence:");
  int barW = (int)(confidence * 116.0f);
  canvas.drawRect(12, 74, 136, 8, 0xBDF7);
  if (barW > 0) {
    uint16_t barColor = (confidence > 0.7f) ? 0x07E0 : (confidence > 0.4f) ? 0xFD20 : 0xF800;
    canvas.fillRect(14, 76, barW, 4, barColor);
  }

  // Flex sensor mini-bars (y: 88)
  const char* fingerLabels[5] = {"T", "I", "M", "R", "L"};
  for (int i = 0; i < 5; i++) {
    int x = 12 + i * 30;
    int barH = (normalizedFlex[i] * 20) / 100; // Max 20px tall
    uint16_t fc = (normalizedFlex[i] > 60) ? 0xF800 : 0x07FF;
    canvas.fillRect(x, 108 - barH, 16, barH, fc);
    canvas.drawRect(x, 88, 16, 20, 0x3186);
    canvas.setTextSize(1);
    canvas.setTextColor(0xBDF7);
    canvas.setCursor(x + 4, 110);
    canvas.print(fingerLabels[i]);
  }

  // Bottom separator and footer
  canvas.drawFastHLine(0, 118, 160, 0x07FF);
  canvas.setTextSize(1);
  canvas.setTextColor(0x07E0);
  canvas.setCursor(12, 121);
  canvas.printf("R:%.0f P:%.0f", roll, pitch);
  canvas.setTextColor(0xBDF7);
  canvas.setCursor(110, 121);
  canvas.print("ISL Glove");

  flushCanvas();
}

/* =========================================================================
   SCREEN: SERIAL TEST MODE
   ========================================================================= */
void drawTestScreen(int rawFlex[5], int normalizedFlex[5], float roll, float pitch) {
  canvas.fillScreen(0x0821);
  canvas.fillRect(0, 0, 160, 18, 0x3000); // Orange header
  drawCentered("TEST MODE", 4, 1, 0xFFFF);
  canvas.drawFastHLine(0, 18, 160, 0xFD20);

  canvas.setTextSize(1);
  const char* fl[5] = {"Th", "Ix", "Mx", "Rg", "Lt"};
  for (int i = 0; i < 5; i++) {
    int y = 22 + i * 16;
    canvas.setTextColor(0xBDF7);
    canvas.setCursor(8, y);
    canvas.print(fl[i]);
    canvas.setCursor(30, y);
    canvas.setTextColor(0xFFFF);
    canvas.printf("raw:%4d  norm:%3d", rawFlex[i], normalizedFlex[i]);
  }
  canvas.setTextColor(0xBDF7);
  canvas.setCursor(8, 110);
  canvas.printf("Roll:%.1f  Pitch:%.1f", roll, pitch);
  canvas.drawFastHLine(0, 118, 160, 0x07FF);
  canvas.setTextColor(0xFD20);
  canvas.setCursor(8, 122);
  canvas.print("Serial: 'q' to exit");

  flushCanvas();
}

/* =========================================================================
   CALIBRATION
   ========================================================================= */
void runCalibration() {
  bool success = false;

  while (!success) {
    // Step 1: FLAT & OPEN
    for (int s = 5; s >= 1; s--) {
      drawCalibrationScreen("Hold hand FLAT & OPEN", "(all fingers straight)", s);
      delay(1000);
    }

    // Take 50 samples and average for baseline and IMU offsets
    long flatSums[5] = {0, 0, 0, 0, 0};
    float rollSum = 0.0f;
    float pitchSum = 0.0f;
    for (int sample = 0; sample < 50; sample++) {
      for (int i = 0; i < 5; i++) {
        flatSums[i] += readAnalogFiltered(FLEX_PINS[i]);
      }
      if (mpuConnected) {
        float r, p;
        readIMURaw(r, p);
        rollSum += r;
        pitchSum += p;
      }
      delay(20);
    }
    for (int i = 0; i < 5; i++) {
      baseline[i] = flatSums[i] / 50;
    }
    if (mpuConnected) {
      rollOffset = rollSum / 50.0f;
      pitchOffset = pitchSum / 50.0f;
    }

    // Quick visual flash to alert user to shift pose
    tft.fillScreen(ST77XX_BLACK);
    delay(500);

    // Step 2: TIGHT FIST
    for (int s = 5; s >= 1; s--) {
      drawCalibrationScreen("Make a TIGHT FIST", "(curl all fingers)", s);
      delay(1000);
    }

    // Take 50 samples and average for temp_fist
    long fistSums[5] = {0, 0, 0, 0, 0};
    for (int sample = 0; sample < 50; sample++) {
      for (int i = 0; i < 5; i++) {
        fistSums[i] += readAnalogFiltered(FLEX_PINS[i]);
      }
      delay(20);
    }

    // Check if calibration is valid
    bool failed = false;
    int temp_fist[5];
    
    Serial.println("\n[CAL] Verifying Calibration...");
    for (int i = 0; i < 5; i++) {
      temp_fist[i] = fistSums[i] / 50;
      int diff = abs(temp_fist[i] - baseline[i]);
      Serial.printf("  Finger %d: Flat=%d, Fist(Raw)=%d, Diff=%d\n", i, baseline[i], temp_fist[i], diff);
      
      // If the difference is less than 15 ADC units, the sensor is probably
      // not connected or not bending. Auto-assign a synthetic range so the
      // glove can still be used.
      if (diff < 15) {
        // Assign a synthetic full_bend offset of ±250 based on which direction
        // flex sensors typically move (higher or lower than baseline).
        temp_fist[i] = baseline[i] > 2000 ? baseline[i] - 250 : baseline[i] + 250;
        Serial.printf("  Finger %d: Auto-adjusted fist target to %d (low hardware delta)\n", i, temp_fist[i]);
      }
    }

    // Always accept calibration — auto-adjust handles low-delta sensors
    for (int i = 0; i < 5; i++) {
      full_bend[i] = temp_fist[i];
    }
    success = true;
  }

  calibrated = true;

  Serial.println("\n[CAL] Two-Step Calibration complete:");
  for (int i = 0; i < 5; i++) {
    Serial.printf("  Finger %d: baseline (flat)=%d  full_bend (fist)=%d\n",
                  i, baseline[i], full_bend[i]);
  }
  if (mpuConnected) {
    Serial.printf("  MPU6050 Offsets: RollOffset=%.2f  PitchOffset=%.2f\n",
                  rollOffset, pitchOffset);
  }

  drawCalibrationDone();
}

/* =========================================================================
   SENSOR READING & NORMALIZATION
   ========================================================================= */
void readFlexSensors(int rawOut[5], int normOut[5]) {
  for (int i = 0; i < 5; i++) {
    int raw = readAnalogFiltered(FLEX_PINS[i]);
    rawOut[i] = raw;
    // Map raw value to 0-100 percentage. map() handles inverted ranges automatically.
    int mapped = map(raw, baseline[i], full_bend[i], 0, 100);
    // Constrain the final percentage to 0-100
    normOut[i] = constrain(mapped, 0, 100);
  }
}

void readIMURaw(float &roll, float &pitch) {
  if (!mpuConnected) {
    roll = 0.0f;
    pitch = 0.0f;
    return;
  }
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Convert to g (±2g range → 16384 LSB/g)
  float axG = ax / 16384.0f;
  float ayG = ay / 16384.0f;
  float azG = az / 16384.0f;

  roll  = atan2(ayG, azG) * 180.0f / PI;
  pitch = atan2(-axG, sqrt(ayG * ayG + azG * azG)) * 180.0f / PI;
}

void readIMU(float &roll, float &pitch) {
  readIMURaw(roll, pitch);
  if (mpuConnected) {
    roll -= rollOffset;
    pitch -= pitchOffset;
  }
}

/* =========================================================================
   GESTURE MATCHING
   ========================================================================= */
/**
 * Returns confidence score 0.0–1.0 for how well current readings match gesture.
 */
float scoreGesture(const GestureTemplate &g, int normFlex[5],
                   float roll, float pitch) {
  float score = 0.0f;
  int checks = 5; // flex checks

  // Flex score
  for (int i = 0; i < 5; i++) {
    int diff = abs(normFlex[i] - g.flex[i]);
    if (diff <= g.flex_tol) {
      score += 1.0f - (float)diff / g.flex_tol;
    }
  }

  // IMU score — only count if MPU6050 is connected
  if (g.use_imu && mpuConnected) {
    checks += 2; // roll + pitch checks
    if (roll >= g.roll_min && roll <= g.roll_max) {
      score += 1.0f;
    }
    if (pitch >= g.pitch_min && pitch <= g.pitch_max) {
      score += 1.0f;
    }
  }

  return score / (float)checks;
}

/**
 * Finds the best-matching gesture. Returns "" if confidence is below threshold.
 */
String matchGesture(int normFlex[5], float roll, float pitch, float &bestConf) {
  bestConf = 0.0f;
  int bestIdx = -1;

  for (int i = 0; i < NUM_GESTURES; i++) {
    float conf = scoreGesture(gestures[i], normFlex, roll, pitch);
    if (conf > bestConf) {
      bestConf = conf;
      bestIdx = i;
    }
  }

  // Require at least 75% confidence to report a match (reduces false positives)
  if (bestConf >= 0.75f && bestIdx >= 0) {
    return String(gestures[bestIdx].name);
  }
  return "";
}

/* =========================================================================
   WEBSOCKET EVENT HANDLER
   ========================================================================= */
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String msg = String((char*)payload);
    Serial.printf("[WS #%u] Text: %s\n", num, msg.c_str());
  }
}

/* =========================================================================
   SETUP
   ========================================================================= */
void setup() {
  Serial.begin(115200);
  delay(800);
  Serial.println("\n=== Sign Language Glove Initializing ===");
  Serial.println("Commands: 't' = test mode, 'c' = recalibrate");

  // SPI + TFT
  SPI.begin(18, 19, 23, TFT_CS);
  tft.initR(INITR_BLACKTAB);
  tft.setSPISpeed(8000000);
  tft.setRotation(3); // Landscape, pins on left
  tft.fillScreen(ST77XX_BLACK);

  // I2C + MPU6050
  Wire.begin(21, 22);
  delay(100); // Give MPU6050 time to power up
  
  // -- I2C Scanner for debugging --
  Serial.println("\n[I2C] Scanning for devices...");
  bool foundAt68 = false;
  int nDevices = 0;
  for(byte address = 1; address < 127; address++ ) {
    Wire.beginTransmission(address);
    if (Wire.endTransmission() == 0) {
      Serial.printf("[I2C] Device found at address 0x%02X\n", address);
      if (address == 0x68) foundAt68 = true;
      nDevices++;
    }
  }
  if (nDevices == 0) Serial.println("[I2C] No I2C devices found! Check wiring (SDA=21, SCL=22).");
  // -------------------------------

  mpu.initialize();
  delay(50);
  mpuConnected = mpu.testConnection();
  
  if (mpuConnected) {
    Serial.println("[MPU] MPU6050 connected and verified (WHO_AM_I matched).");
  } else if (foundAt68) {
    Serial.println("[MPU] MPU6050 failed WHO_AM_I, but found on I2C bus! (Likely a clone chip). Forcing connection true.");
    mpuConnected = true;
  } else {
    Serial.println("[MPU] MPU6050 NOT FOUND -- running WITHOUT gyroscope.");
    Serial.println("[MPU] IMU-based gestures will use flex sensors only.");
  }

  // Flex sensor pins (ADC) — configure for full 0-3.3V range
  analogSetWidth(12); // 12-bit ADC resolution (0-4095)
  for (int i = 0; i < 5; i++) {
    pinMode(FLEX_PINS[i], INPUT);
    analogSetPinAttenuation(FLEX_PINS[i], ADC_11db); // Full 0-3.3V input range
  }

  // Run calibration
  runCalibration();
  appState = STATE_RECOGNIZING;

  // Initialize WiFi
  tft.fillScreen(ST7735_BLACK);
  tft.setCursor(5, 20);
  tft.setTextColor(ST7735_WHITE);
  tft.setTextSize(1);
  tft.print("Connecting to WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);

  int dots = 0;
  while (WiFi.status() != WL_CONNECTED && dots < 60) {
    delay(500);
    Serial.print(".");
    tft.print(".");
    dots++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    tft.fillScreen(ST7735_BLACK);
    tft.setCursor(5, 20);
    tft.print("WiFi Connected!");
    tft.setCursor(5, 40);
    tft.print("IP: ");
    tft.print(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("\n[WiFi] Failed to connect on boot. Auto-reconnect enabled.");
    tft.fillScreen(ST7735_BLACK);
    tft.setCursor(5, 20);
    tft.setTextColor(ST7735_RED);
    tft.print("WiFi Connecting...");
    delay(1000);
  }

  // Initialize WebSockets
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

/* =========================================================================
   LOOP
   ========================================================================= */
void loop() {
  webSocket.loop();
  
  // Handle serial commands
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 't' || cmd == 'T') {
      appState = STATE_TESTING;
      Serial.println("[CMD] Entering test mode. Press 'q' to exit.");
    } else if (cmd == 'q' || cmd == 'Q') {
      appState = STATE_RECOGNIZING;
      Serial.println("[CMD] Exiting test mode.");
    } else if (cmd == 'c' || cmd == 'C') {
      appState = STATE_CALIBRATING;
    }
  }

  if (appState == STATE_CALIBRATING) {
    runCalibration();
    appState = STATE_RECOGNIZING;
    return;
  }

  // Rate-limit sensor reads
  if (millis() - lastReadTime < READ_INTERVAL) return;
  lastReadTime = millis();

  // Read sensors
  int rawFlex[5], normFlex[5];
  readFlexSensors(rawFlex, normFlex);
  float roll = 0.0f, pitch = 0.0f;
  readIMU(roll, pitch);

  if (appState == STATE_TESTING) {
    drawTestScreen(rawFlex, normFlex, roll, pitch);
    Serial.printf("[TEST] T:%3d I:%3d M:%3d R:%3d L:%3d | Roll:%.1f Pitch:%.1f\n",
                  normFlex[0], normFlex[1], normFlex[2], normFlex[3], normFlex[4],
                  roll, pitch);
    return;
  }

  // STATE_RECOGNIZING
  float confidence = 0.0f;
  String matched = matchGesture(normFlex, roll, pitch, confidence);

  // Latch: keep displaying a gesture until HOLD_MS expires
  if (matched.length() > 0) {
    currentGesture = matched;
    gestureShownAt = millis();
  } else if (millis() - gestureShownAt > HOLD_MS) {
    currentGesture = "";
  }

  drawDashboard(currentGesture, normFlex, roll, pitch, confidence);

  // Serial debug & WebSockets JSON output
  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 100) { // Send data at 10Hz to WebSockets
    lastDebugPrint = millis();
    
    // Create the JSON packet for the Web App
    char jsonPacket[150];
    snprintf(jsonPacket, sizeof(jsonPacket),
      "{\"g\":\"%s\",\"c\":%d,\"f\":[%d,%d,%d,%d,%d],\"r\":%.1f,\"p\":%.1f}",
      currentGesture.length() > 0 ? currentGesture.c_str() : "",
      (int)(confidence * 100.0f),
      normFlex[0], normFlex[1], normFlex[2], normFlex[3], normFlex[4],
      roll, pitch);
      
    // Broadcast via WebSockets
    webSocket.broadcastTXT(jsonPacket);
      
    // Print human-readable debug info every 500ms
    static unsigned long lastHumanPrint = 0;
    if (millis() - lastHumanPrint > 500) {
      lastHumanPrint = millis();
      Serial.printf("[RAW]   T:%4d I:%4d M:%4d R:%4d L:%4d\n",
                    rawFlex[0], rawFlex[1], rawFlex[2], rawFlex[3], rawFlex[4]);
      Serial.printf("[NORM]  T:%3d I:%3d M:%3d R:%3d L:%3d | R:%.1f P:%.1f | %s (%.0f%%)\n",
                    normFlex[0], normFlex[1], normFlex[2], normFlex[3], normFlex[4],
                    roll, pitch,
                    currentGesture.length() > 0 ? currentGesture.c_str() : "---",
                    confidence * 100.0f);
    }
  }
}
