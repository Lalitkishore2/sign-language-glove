# ISL Sign Language Glove Project

An embedded systems project designed to translate Indian Sign Language (ISL) gestures into text using an ESP32 microcontroller, flex sensors, and an MPU6050 gyroscope/accelerometer. The translated words are displayed in real-time on an ST7735 TFT screen.

## 🛠 Hardware Architecture

*   **Microcontroller:** ESP32 DOIT DevKit V1
*   **Finger Tracking:** 5x Flex Sensors configured in a voltage divider circuit with pull-down resistors. As the fingers bend, the resistance increases, causing the analog voltage at the ESP32 ADC pins to drop.
*   **Hand Orientation:** MPU6050 (I2C). Tracks the Roll and Pitch of the wrist to distinguish between gestures that have the same finger bends but different hand orientations (e.g., "MORNING" vs "THANK YOU").
*   **Display:** 1.8" ST7735 SPI TFT Screen for real-time visual output.

## 🧠 How it Works

1.  **Calibration:** On boot, the glove takes 50 samples while the hand is held flat to establish a `baseline` ADC value for straight fingers. It assumes a full 90-degree bend results in an ADC drop of ~600 units.
2.  **Normalization:** During operation, raw ADC values are dynamically mapped to a `0-100%` bend percentage, adjusting for individual sensor variances.
3.  **Pattern Matching:** The glove runs a continuous state machine. It compares the live `0-100%` array against hardcoded `GestureTemplates`. 
4.  **Confidence Scoring:** It calculates a confidence score based on the flex tolerance (`flex_tol`) and whether the Roll/Pitch fall within the defined bounds. If the highest match exceeds 75% confidence, the word is displayed on the TFT.

---

## 🤖 AI Context / Chatbot Prompt

*(Copy and paste the section below to any AI chatbot to quickly give it context about your project if you need help debugging or extending the code)*

```text
You are an expert embedded systems engineer helping me with my ESP32 Sign Language Glove project. 

# Project State
- Platform: PlatformIO (Arduino framework)
- Board: esp32doit-devkit-v1
- Sensors: 5x analog flex sensors (pulldown voltage dividers) + MPU6050 via I2C.
- Output: ST7735 TFT via SPI.

# Pinout Mapping
- Flex Thumb: GPIO 32
- Flex Index: GPIO 33
- Flex Middle: GPIO 34
- Flex Ring: GPIO 35
- Flex Little: GPIO 36 (VP)
- MPU6050 I2C: SDA = 21, SCL = 22
- TFT SPI: CS=5, DC=2, RST=4, SCK=18, MOSI=23

# Core Logic
The project uses a `GestureTemplate` struct containing target flex percentages (0=straight, 100=bent), pitch limits, and roll limits. 
Due to standard clone MPU6050 chips failing the WHO_AM_I test, the code uses an I2C scanner at boot. If address 0x68 is found but `mpu.testConnection()` fails, it overrides the connection flag to `true` to ensure IMU reading continues.

# Current Goals
When I ask you questions, please provide C++ code tailored for the ESP32 Arduino core. Always account for non-blocking loop structures and avoid `delay()` when handling sensor polling.
```
