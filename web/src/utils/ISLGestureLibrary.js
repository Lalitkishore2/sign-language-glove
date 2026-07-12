/**
 * ISLGestureLibrary.js — Single source of truth for all ISL gesture definitions.
 * 
 * Contains both webcam-based (landmark templates) and glove-based (sensor targets)
 * gesture definitions used across Translator, Trainer, Learn, and Gallery pages.
 */

// ============================================================
// WEBCAM-BASED ISL GESTURES (MediaPipe hand landmark templates)
// ============================================================
export const WEBCAM_ISL_GESTURES = [
  {
    id: 'NAMASTE',
    name: 'Namaste',
    category: 'Greeting',
    description: 'Join both palms together in front of the chest with fingers pointing upward. This is the traditional Indian greeting.',
    handPosition: 'Palms pressed together, fingers straight and pointing up, hands at chest level.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'HELLO',
    name: 'Hello',
    category: 'Greeting',
    description: 'Open hand with all fingers spread wide, palm facing outward. Wave gently side-to-side.',
    handPosition: 'All five fingers extended and spread apart, palm facing forward at head height.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'YES',
    name: 'Yes',
    category: 'Response',
    description: 'Make a fist and nod it forward like a head nod. The fist represents agreement.',
    handPosition: 'Closed fist with thumb resting on curled fingers, slight forward nod motion.',
    template: [
      0,0, -0.18, -0.11, -0.31, -0.21, -0.37, -0.31, -0.34, -0.39,
      -0.08, -0.26, -0.09, -0.41, -0.09, -0.39, -0.13, -0.32, 0.05, -0.25,
      0.07, -0.41, 0.06, -0.37, 0.01, -0.31, 0.17, -0.23, 0.22, -0.38,
      0.21, -0.36, 0.15, -0.3, 0.27, -0.2, 0.33, -0.32, 0.31, -0.32,
      0.26, -0.28
    ]
  },
  {
    id: 'NO',
    name: 'No',
    category: 'Response',
    description: 'Extend index and middle fingers together, then snap them against the thumb repeatedly.',
    handPosition: 'Index and middle fingers extended together pointing forward, other fingers curled.',
    template: [
      0,0, -0.19, -0.14, -0.33, -0.27, -0.41, -0.39, -0.39, -0.49,
      -0.12, -0.34, -0.24, -0.62, -0.32, -0.82, -0.39, -0.99, 0.09, -0.35,
      0.18, -0.62, 0.24, -0.81, 0.28, -0.97, 0.21, -0.27, 0.28, -0.44,
      0.26, -0.41, 0.19, -0.34, 0.31, -0.21, 0.37, -0.35, 0.34, -0.34,
      0.28, -0.3
    ]
  },
  {
    id: 'PLEASE',
    name: 'Please',
    category: 'Polite',
    description: 'Flat open palm placed on the chest and moved in a circular motion. Shows politeness.',
    handPosition: 'Open flat hand, all fingers together and straight, palm on chest.',
    template: [
      0,0, -0.16, -0.21, -0.27, -0.39, -0.32, -0.53, -0.31, -0.65,
      -0.12, -0.56, -0.17, -0.79, -0.2, -0.93, -0.21, -1.0, 0.04, -0.56,
      0.05, -0.8, 0.05, -0.95, 0.04, -1.0, 0.19, -0.52, 0.22, -0.75,
      0.23, -0.89, 0.22, -1.0, 0.32, -0.45, 0.38, -0.62, 0.41, -0.73,
      0.41, -0.83
    ]
  },
  {
    id: 'SORRY',
    name: 'Sorry',
    category: 'Polite',
    description: 'Make a fist and rotate it in a circle over the chest area. Expresses apology.',
    handPosition: 'Closed fist held against the chest, circular motion.',
    template: [
      0,0, -0.15, -0.1, -0.27, -0.18, -0.35, -0.24, -0.41, -0.29,
      -0.08, -0.23, -0.1, -0.37, -0.1, -0.36, -0.14, -0.29, 0.05, -0.22,
      0.07, -0.37, 0.06, -0.33, 0.01, -0.28, 0.16, -0.2, 0.21, -0.34,
      0.2, -0.32, 0.14, -0.27, 0.26, -0.17, 0.31, -0.29, 0.29, -0.29,
      0.24, -0.25
    ]
  },
  {
    id: 'GOOD',
    name: 'Good',
    category: 'Response',
    description: 'Thumbs up gesture — extend the thumb upward with all other fingers curled into a fist.',
    handPosition: 'Thumb pointing straight up, all other four fingers curled tightly into fist.',
    template: [
      0,0, -0.22, -0.16, -0.42, -0.31, -0.54, -0.44, -0.64, -0.56,
      -0.11, -0.31, -0.16, -0.44, -0.15, -0.41, -0.18, -0.34, 0.06, -0.28,
      0.08, -0.45, 0.07, -0.41, 0.02, -0.34, 0.19, -0.23, 0.24, -0.41,
      0.23, -0.37, 0.17, -0.3, 0.3, -0.2, 0.44, -0.37, 0.52, -0.5,
      0.58, -0.62
    ]
  },
  {
    id: 'I',
    name: 'I',
    category: 'Pronoun',
    untrained: true,
    description: 'Point index finger to self with palm facing inward. Indicates first person.',
    handPosition: 'Index finger pointing upward, others bent, palm facing toward your body.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'AFTERNOON',
    name: 'Afternoon',
    category: 'Time',
    untrained: true,
    description: 'Sign for afternoon.',
    handPosition: 'Hand positioned forward.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'HOME',
    name: 'Home',
    category: 'Place',
    untrained: true,
    description: 'Sign for home.',
    handPosition: 'Fingers touching to form a roof.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'HOW ARE YOU',
    name: 'How are you',
    category: 'Greeting',
    untrained: true,
    description: 'Ask about someone\'s wellbeing.',
    handPosition: 'Hands moving forward.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'I AM FINE',
    name: 'I am fine',
    category: 'Greeting',
    untrained: true,
    description: 'Response indicating wellbeing.',
    handPosition: 'Hand on chest, moving forward.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'LIVE',
    name: 'Live',
    category: 'State',
    untrained: true,
    description: 'Sign for living or alive.',
    handPosition: 'Hands moving upward along the body.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'NAME',
    name: 'Name',
    category: 'Question',
    untrained: true,
    description: 'Used to ask someone\'s name.',
    handPosition: 'Index and middle fingers extended.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  },
  {
    id: 'TIME',
    name: 'Time',
    category: 'Time',
    untrained: true,
    description: 'Sign for time, like pointing to a watch.',
    handPosition: 'Index finger tapping the wrist.',
    template: [
      0,0, -0.19, -0.21, -0.32, -0.42, -0.39, -0.58, -0.4, -0.71,
      -0.12, -0.63, -0.18, -0.83, -0.21, -0.96, -0.22, -1.0, 0.05, -0.63,
      0.06, -0.83, 0.06, -0.97, 0.05, -1.0, 0.22, -0.58, 0.26, -0.77,
      0.28, -0.89, 0.28, -0.99, 0.36, -0.48, 0.44, -0.63, 0.48, -0.73,
      0.5, -0.82
    ]
  }
];

// ============================================================
// GLOVE-BASED ISL GESTURES (ESP32 sensor targets)
// Matches the GestureTemplate definitions in main.cpp
// ============================================================
export const GLOVE_ISL_GESTURES = [
  {
    id: 'HEARING',
    name: 'Hearing',
    category: 'Communication',
    description: 'Point index finger toward ear. Index extended, others bent. Used to indicate "hearing" or "listen".',
    handPosition: 'Index finger pointing toward ear, thumb bent, middle/ring/little curled.',
    flex: { thumb: 100, index: 0, middle: 100, ring: 100, little: 100 },
    flexTolerance: 25,
    roll: { min: 60, max: 110 },
    pitch: { min: -20, max: 20 }
  },
  {
    id: 'THANK YOU',
    name: 'Thank You',
    category: 'Polite',
    description: 'Flat hand with all fingers open, palm facing outward from chin. A gesture of gratitude.',
    handPosition: 'All fingers extended straight, palm facing away from face at chin level.',
    flex: { thumb: 0, index: 0, middle: 0, ring: 0, little: 0 },
    flexTolerance: 25,
    roll: { min: -30, max: 30 },
    pitch: { min: 60, max: 110 }
  },
  {
    id: 'MORNING',
    name: 'Morning',
    category: 'Time',
    description: 'All fingers extended upward with hand raised. Mimics the sun rising.',
    handPosition: 'All fingers extended straight upward, hand raised above shoulder.',
    flex: { thumb: 0, index: 0, middle: 0, ring: 0, little: 0 },
    flexTolerance: 25,
    roll: { min: -30, max: 30 },
    pitch: { min: -30, max: 30 }
  },
  {
    id: 'I',
    name: 'I (Self)',
    category: 'Pronoun',
    untrained: true,
    description: 'Point index finger to self with palm facing inward. Indicates first person.',
    handPosition: 'Index finger pointing upward, others bent, palm facing toward your body.',
    flex: { thumb: 100, index: 0, middle: 100, ring: 100, little: 100 },
    flexTolerance: 25,
    roll: { min: -110, max: -60 },
    pitch: { min: -30, max: 30 }
  },
  {
    id: 'BYE',
    name: 'Bye',
    category: 'Greeting',
    description: 'Open flat hand waving side-to-side. A common farewell gesture.',
    handPosition: 'All fingers slightly relaxed and extended, hand tilted and waving.',
    flex: { thumb: 20, index: 20, middle: 20, ring: 20, little: 20 },
    flexTolerance: 25,
    roll: { min: -45, max: 45 },
    pitch: { min: 60, max: 120 }
  },
  {
    id: 'NAME',
    name: 'Name',
    category: 'Question',
    untrained: true,
    description: 'Two fingers (index and middle) tapping. Used to ask someone\'s name.',
    handPosition: 'Index and middle fingers extended, thumb/ring/little curled. Tapping motion.',
    flex: { thumb: 100, index: 0, middle: 0, ring: 100, little: 100 },
    flexTolerance: 25,
    roll: { min: -30, max: 30 },
    pitch: { min: -30, max: 30 }
  },
  {
    id: 'INDIAN',
    name: 'Indian',
    category: 'Identity',
    description: 'Pinch near forehead with thumb and index, others closed. Represents a bindi or tilak mark.',
    handPosition: 'Thumb extended, index/middle/ring/little all bent. Hand near forehead.',
    flex: { thumb: 0, index: 100, middle: 100, ring: 100, little: 100 },
    flexTolerance: 25,
    roll: { min: 60, max: 120 },
    pitch: { min: 60, max: 120 }
  }
];

/**
 * Get webcam gesture templates as a map (for SignClassifier compatibility)
 */
export function getWebcamTemplatesMap() {
  const map = {};
  WEBCAM_ISL_GESTURES.forEach(g => {
    map[g.id] = g.template;
  });
  return map;
}

/**
 * Get glove gesture by ID
 */
export function getGloveGesture(id) {
  return GLOVE_ISL_GESTURES.find(g => g.id === id) || null;
}

/**
 * Get webcam gesture by ID
 */
export function getWebcamGesture(id) {
  return WEBCAM_ISL_GESTURES.find(g => g.id === id) || null;
}
