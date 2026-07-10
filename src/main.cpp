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

#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <MPU6050.h>
#include <SPI.h>
#include <Wire.h>
#include <math.h>

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
// Raw ADC readings for each finger when hand is CLOSED (fist) — estimated
// These will be set to baseline + 800 as a reasonable approximation
int full_bend[5]     = {0, 0, 0, 0, 0};
bool calibrated      = false;
bool mpuConnected    = false; // Tracks whether MPU6050 was found at boot

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
  // Step 1: FLAT & OPEN
  for (int s = 3; s >= 1; s--) {
    drawCalibrationScreen("Hold hand FLAT & OPEN", "(all fingers straight)", s);
    delay(1000);
  }

  // Take 50 samples and average for baseline
  long flatSums[5] = {0, 0, 0, 0, 0};
  for (int sample = 0; sample < 50; sample++) {
    for (int i = 0; i < 5; i++) {
      flatSums[i] += analogRead(FLEX_PINS[i]);
    }
    delay(20);
  }
  for (int i = 0; i < 5; i++) {
    baseline[i] = flatSums[i] / 50;
  }

  // Quick visual flash to alert user to shift pose
  tft.fillScreen(ST77XX_BLACK);
  delay(500);

  // Step 2: TIGHT FIST
  for (int s = 3; s >= 1; s--) {
    drawCalibrationScreen("Make a TIGHT FIST", "(curl all fingers)", s);
    delay(1000);
  }

  // Take 50 samples and average for full_bend
  long fistSums[5] = {0, 0, 0, 0, 0};
  for (int sample = 0; sample < 50; sample++) {
    for (int i = 0; i < 5; i++) {
      fistSums[i] += analogRead(FLEX_PINS[i]);
    }
    delay(20);
  }
  for (int i = 0; i < 5; i++) {
    int rawFist = fistSums[i] / 50;
    int rawDiff = rawFist - baseline[i];
    
    // Guard: if baseline and rawFist are too close (difference < 100 units),
    // fall back to default baseline - 600 direction to prevent division-by-zero or low sensitivity issues.
    if (abs(rawDiff) < 100) {
      full_bend[i] = baseline[i] - 600;
    } else {
      full_bend[i] = rawFist;
    }
  }

  calibrated = true;

  Serial.println("\n[CAL] Two-Step Calibration complete:");
  for (int i = 0; i < 5; i++) {
    int rawFist = fistSums[i] / 50;
    Serial.printf("  Finger %d: Flat=%d  Fist(Raw)=%d  Diff=%d  -> Final full_bend=%d\n",
                  i, baseline[i], rawFist, rawFist - baseline[i], full_bend[i]);
  }

  drawCalibrationDone();
}

/* =========================================================================
   SENSOR READING & NORMALIZATION
   ========================================================================= */
void readFlexSensors(int rawOut[5], int normOut[5]) {
  for (int i = 0; i < 5; i++) {
    int raw = analogRead(FLEX_PINS[i]);
    rawOut[i] = raw;
    // Map raw value to 0-100 percentage. map() handles inverted ranges automatically.
    int mapped = map(raw, baseline[i], full_bend[i], 0, 100);
    // Constrain the final percentage to 0-100
    normOut[i] = constrain(mapped, 0, 100);
  }
}

void readIMU(float &roll, float &pitch) {
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

  // Flex sensor pins (ADC)
  for (int i = 0; i < 5; i++) {
    pinMode(FLEX_PINS[i], INPUT);
  }

  // Run calibration
  runCalibration();
  appState = STATE_RECOGNIZING;
}

/* =========================================================================
   LOOP
   ========================================================================= */
void loop() {
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

  // Serial debug
  // Print raw ADC + normalized values for debugging
  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 500) { // Print every 500ms to avoid spam
    lastDebugPrint = millis();
    Serial.printf("[RAW]   T:%4d I:%4d M:%4d R:%4d L:%4d\n",
                  rawFlex[0], rawFlex[1], rawFlex[2], rawFlex[3], rawFlex[4]);
    Serial.printf("[NORM]  T:%3d I:%3d M:%3d R:%3d L:%3d | R:%.1f P:%.1f | %s (%.0f%%)\n",
                  normFlex[0], normFlex[1], normFlex[2], normFlex[3], normFlex[4],
                  roll, pitch,
                  currentGesture.length() > 0 ? currentGesture.c_str() : "---",
                  confidence * 100.0f);
  }
}
