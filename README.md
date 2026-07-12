# Sign Language Glove & Web Dashboard

A comprehensive, full-stack Indian Sign Language (ISL) translation system. This project bridges physical hardware (an ESP32 smart glove) with a modern React/Vite web application to provide real-time gesture recognition, sign language training, and text-to-speech translation.

## 🚀 Features

### 1. Web Application (`/web`)
A modern React application built with Vite that serves as the central hub:
- **Real-time Translator**: Translates both Webcam gestures (via MediaPipe AI) and Glove gestures into spoken text.
- **ISL Gallery**: A browsable dictionary of ISL signs, showing both the correct hand wireframes and target glove sensor values. Includes a global feature to disable untrained signs.
- **Interactive Practice & Learn**: Gamified training modules that score your real-time webcam poses or glove bends against target templates.
- **Model Trainer**: Easily record and train your own custom gestures directly in the browser.

### 2. Embedded Smart Glove (`/src`)
An ESP32-based wearable device that acts as a physical controller/input method:
- **Microcontroller**: ESP32 DOIT DevKit V1.
- **Finger Tracking**: 5x Flex Sensors that map finger bend percentage (0-100%).
- **Orientation**: MPU6050 IMU tracking Roll and Pitch to distinguish similar signs.
- **Local Display**: 1.8" ST7735 SPI TFT Screen for offline feedback.
- **Connectivity**: Streams live telemetry via WebSockets/Serial to the React Web App.

---

## 🛠 Project Structure

```text
├── src/                # ESP32 C++ Code (PlatformIO)
│   ├── main.cpp        # Main microcontroller logic and sensor sampling
├── web/                # React Frontend Application
│   ├── src/
│   │   ├── components/ # Reusable UI components (WebcamStream, GloveVisualizer)
│   │   ├── pages/      # Main views (Translator, Learn, Gallery, Trainer)
│   │   ├── utils/      # ISLGestureLibrary and AI classification logic
│   ├── package.json
```

## ⚙️ Setup & Installation

### Hardware (ESP32)
1. Open the root folder in VS Code with the **PlatformIO** extension installed.
2. Connect the ESP32 via USB.
3. Build and Upload the project to the board.

### Software (Web App)
1. Navigate to the `web/` directory: `cd web`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The dashboard will be available at `http://localhost:5173`. Connect your glove via the in-browser Web Serial API on the Home page.

## 🧠 Core Technologies
- **Frontend**: React, Vite, Vanilla CSS (Glassmorphism UI), MediaPipe Hands.
- **Embedded**: C++, Arduino Framework, I2C, SPI.
