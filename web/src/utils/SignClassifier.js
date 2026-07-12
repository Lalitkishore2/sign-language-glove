// Coordinate Normalization & Gesture Classification Engine
import { getWebcamTemplatesMap } from './ISLGestureLibrary';

// Default predefined templates for common gestures/alphabets (legacy 1-hand format)
// Normalized relative to wrist [0] and scaled to max-distance of 1.0.
// Now loaded from the central ISL Gesture Library
export const DEFAULT_TEMPLATES = getWebcamTemplatesMap();

let disabledSignsCache = [];
try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('isl_disabled_signs');
    if (saved) disabledSignsCache = JSON.parse(saved);
    
    window.addEventListener('isl_disabled_signs_updated', () => {
      const updated = localStorage.getItem('isl_disabled_signs');
      if (updated) disabledSignsCache = JSON.parse(updated);
    });
  }
} catch (e) {}


/**
 * Normalizes 21 3D/2D hand landmarks (legacy single hand).
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;
  const wrist = landmarks[0];
  const centered = [];
  for (let i = 0; i < 21; i++) {
    centered.push({
      x: landmarks[i].x - wrist.x,
      y: landmarks[i].y - wrist.y
    });
  }
  let maxDist = 0;
  for (let i = 0; i < 21; i++) {
    const dist = Math.sqrt(centered[i].x * centered[i].x + centered[i].y * centered[i].y);
    if (dist > maxDist) maxDist = dist;
  }
  if (maxDist === 0) maxDist = 1;
  const normalized = [];
  for (let i = 0; i < 21; i++) {
    normalized.push(centered[i].x / maxDist);
    normalized.push(centered[i].y / maxDist);
  }
  return normalized;
}

/**
 * Normalizes and packages landmarks for up to two hands.
 * Yields an 89-element array:
 *   [0..41]: Left hand normalized (42)
 *   [42]: Left hand present flag (1)
 *   [43..84]: Right hand normalized (42)
 *   [85]: Right hand present flag (1)
 *   [86..88]: Scale-normalized relative wrist offset [dx, dy, dz] (3)
 */
export function normalizeTwoHands(multiHandLandmarks, multiHandedness) {
  let leftHand = null;
  let rightHand = null;

  if (multiHandLandmarks) {
    for (let i = 0; i < multiHandLandmarks.length; i++) {
      const handedness = multiHandedness && multiHandedness[i];
      const label = (handedness?.label || handedness?.categoryName || '').toLowerCase();
      if (label === 'left') {
        leftHand = multiHandLandmarks[i];
      } else if (label === 'right') {
        rightHand = multiHandLandmarks[i];
      } else {
        if (!leftHand) leftHand = multiHandLandmarks[i];
        else if (!rightHand) rightHand = multiHandLandmarks[i];
      }
    }
  }

  // Left hand normalize
  const leftNormalized = new Array(42).fill(0);
  let leftScale = 1;
  if (leftHand && leftHand.length >= 21) {
    const wrist = leftHand[0];
    const centered = leftHand.map(pt => ({ x: pt.x - wrist.x, y: pt.y - wrist.y }));
    let maxDist = 0;
    for (let i = 0; i < 21; i++) {
      const dist = Math.sqrt(centered[i].x * centered[i].x + centered[i].y * centered[i].y);
      if (dist > maxDist) maxDist = dist;
    }
    leftScale = maxDist || 1;
    for (let i = 0; i < 21; i++) {
      leftNormalized[i * 2] = centered[i].x / leftScale;
      leftNormalized[i * 2 + 1] = centered[i].y / leftScale;
    }
  }

  // Right hand normalize
  const rightNormalized = new Array(42).fill(0);
  let rightScale = 1;
  if (rightHand && rightHand.length >= 21) {
    const wrist = rightHand[0];
    const centered = rightHand.map(pt => ({ x: pt.x - wrist.x, y: pt.y - wrist.y }));
    let maxDist = 0;
    for (let i = 0; i < 21; i++) {
      const dist = Math.sqrt(centered[i].x * centered[i].x + centered[i].y * centered[i].y);
      if (dist > maxDist) maxDist = dist;
    }
    rightScale = maxDist || 1;
    for (let i = 0; i < 21; i++) {
      rightNormalized[i * 2] = centered[i].x / rightScale;
      rightNormalized[i * 2 + 1] = centered[i].y / rightScale;
    }
  }

  // Relative offset
  let relativeOffset = [0, 0, 0];
  if (leftHand && rightHand && leftHand.length > 0 && rightHand.length > 0) {
    const dx = rightHand[0].x - leftHand[0].x;
    const dy = rightHand[0].y - leftHand[0].y;
    const dz = (rightHand[0].z || 0) - (leftHand[0].z || 0);
    const avgScale = (leftScale + rightScale) / 2;
    relativeOffset = [dx / avgScale, dy / avgScale, dz / avgScale];
  }

  return [
    ...leftNormalized,
    leftHand ? 1.0 : 0.0,
    ...rightNormalized,
    rightHand ? 1.0 : 0.0,
    ...relativeOffset
  ];
}

/**
 * Resamples a sequence of frames linearly to a fixed target size of K frames.
 */
export function resampleSequence(sequence, K = 10) {
  if (!sequence || sequence.length === 0) return [];
  if (sequence.length === 1) return new Array(K).fill(sequence[0]);
  
  const resampled = [];
  for (let i = 0; i < K; i++) {
    const progress = i / (K - 1);
    const index = progress * (sequence.length - 1);
    const low = Math.floor(index);
    const high = Math.min(sequence.length - 1, Math.ceil(index));
    const weight = index - low;
    
    const frame1 = sequence[low];
    const frame2 = sequence[high];
    
    const blended = [];
    for (let j = 0; j < frame1.length; j++) {
      blended.push(frame1[j] * (1 - weight) + frame2[j] * weight);
    }
    resampled.push(blended);
  }
  return resampled;
}

/**
 * Calculates distance between two normalized frame feature vectors.
 * Supports legacy 42-element single-hand vectors and new 89-element vectors.
 */
export function frameDistance(f1, f2) {
  if (!f1 || !f2) return 10.0;

  // Legacy case (both are single-hand 42-element vectors)
  if (f1.length === 42 && f2.length === 42) {
    let sum = 0;
    for (let i = 0; i < 42; i++) {
      const diff = f1[i] - f2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // Mixed case: f2 is legacy (42), f1 is dual (89)
  if (f2.length === 42) {
    const leftPresent = f1[42] > 0.5;
    const rightPresent = f1[85] > 0.5;
    let leftDist = Infinity;
    if (leftPresent) {
      let sum = 0;
      for (let i = 0; i < 42; i++) {
        const diff = f1[i] - f2[i];
        sum += diff * diff;
      }
      leftDist = Math.sqrt(sum);
    }
    let rightDist = Infinity;
    if (rightPresent) {
      let sum = 0;
      for (let i = 0; i < 42; i++) {
        const diff = f1[i + 43] - f2[i];
        sum += diff * diff;
      }
      rightDist = Math.sqrt(sum);
    }
    const minDist = Math.min(leftDist, rightDist);
    return minDist === Infinity ? 10.0 : minDist;
  }

  // Mixed case: f1 is legacy (42), f2 is dual (89)
  if (f1.length === 42) {
    const leftPresentTpl = f2[42] > 0.5;
    const rightPresentTpl = f2[85] > 0.5;
    let leftDist = Infinity;
    if (leftPresentTpl) {
      let sum = 0;
      for (let i = 0; i < 42; i++) {
        const diff = f1[i] - f2[i];
        sum += diff * diff;
      }
      leftDist = Math.sqrt(sum);
    }
    let rightDist = Infinity;
    if (rightPresentTpl) {
      let sum = 0;
      for (let i = 0; i < 42; i++) {
        const diff = f1[i] - f2[i + 43];
        sum += diff * diff;
      }
      rightDist = Math.sqrt(sum);
    }
    const minDist = Math.min(leftDist, rightDist);
    return minDist === Infinity ? 10.0 : minDist;
  }

  // Dual-hand case (both are 89-element vectors)
  const leftPresent1 = f1[42] > 0.5;
  const leftPresent2 = f2[42] > 0.5;
  const rightPresent1 = f1[85] > 0.5;
  const rightPresent2 = f2[85] > 0.5;

  // Hand presence mismatch -> large distance penalty
  if (leftPresent1 !== leftPresent2 || rightPresent1 !== rightPresent2) {
    return 8.0;
  }

  // If no hands in either, distance is 0 (or match is perfect)
  if (!leftPresent1 && !rightPresent1) {
    return 0;
  }

  let distSum = 0;
  let count = 0;

  if (leftPresent1) {
    let sum = 0;
    for (let i = 0; i < 42; i++) {
      const diff = f1[i] - f2[i];
      sum += diff * diff;
    }
    distSum += Math.sqrt(sum);
    count += 1;
  }

  if (rightPresent1) {
    let sum = 0;
    for (let i = 43; i < 85; i++) {
      const diff = f1[i] - f2[i];
      sum += diff * diff;
    }
    distSum += Math.sqrt(sum);
    count += 1;
  }

  // Include wrist distance if both are two-handed gestures
  if (leftPresent1 && rightPresent1) {
    let sum = 0;
    for (let i = 86; i < 89; i++) {
      const diff = f1[i] - f2[i];
      sum += diff * diff;
    }
    distSum += Math.sqrt(sum) * 1.5; // Offset multiplier
    count += 1.5;
  }

  return count > 0 ? (distSum / count) : 0;
}

/**
 * Classifies normalized static landmarks against templates.
 */
export function classifyGesture(normalizedFeatures, customTemplates = {}) {
  if (!normalizedFeatures) return { label: "No Hand Detected", confidence: 0 };

  // Detect rest-state: when no hands are present
  const leftPresent = normalizedFeatures.length >= 89 && normalizedFeatures[42] > 0.5;
  const rightPresent = normalizedFeatures.length >= 89 && normalizedFeatures[85] > 0.5;
  if (normalizedFeatures.length >= 89 && !leftPresent && !rightPresent) {
    return { label: "No Hand Detected", confidence: 0 };
  }

  const templates = { ...DEFAULT_TEMPLATES, ...customTemplates };
  let minDistance = Infinity;
  let bestLabel = "Unknown";
  
  Object.entries(templates).forEach(([label, templateData]) => {
    if (disabledSignsCache.includes(label)) return;
    let templateCoords = templateData;
    let isDynamic = false;
    
    if (templateData && typeof templateData === 'object' && !Array.isArray(templateCoords)) {
      if (templateData.type === 'dynamic') {
        isDynamic = true;
      }
      templateCoords = templateData.keyframes;
    }

    if (isDynamic) return; // Skip dynamic gestures in static matcher

    const dist = frameDistance(normalizedFeatures, templateCoords);
    if (dist < minDistance) {
      minDistance = dist;
      bestLabel = label;
    }
  });

  const threshold = 2.2; // Tolerance threshold
  let confidence = Math.max(0, 1 - (minDistance / threshold));
  
  if (minDistance > 1.2) {
    confidence = confidence * 0.45; // Drop confidence steeply for far matches
  }
  
  return {
    label: confidence > 0.35 ? bestLabel : "Unknown",
    confidence: parseFloat((confidence * 100).toFixed(1))
  };
}

/**
 * Classifies a sequence buffer of normalized frames against dynamic movement templates.
 */
export function classifySequence(webcamBuffer, customTemplates = {}) {
  if (!webcamBuffer || webcamBuffer.length < 5) {
    return { label: "Unknown", confidence: 0 };
  }

  let minDistance = Infinity;
  let bestLabel = "Unknown";

  Object.entries(customTemplates).forEach(([label, templateData]) => {
    if (!templateData || templateData.type !== 'dynamic') return;

    const originalLength = templateData.originalLength || 30;
    const keyframes = templateData.keyframes; // Array of 10 resampled frames

    if (webcamBuffer.length >= originalLength) {
      // Slices the correct duration window from history
      const sliced = webcamBuffer.slice(webcamBuffer.length - originalLength);
      const resampled = resampleSequence(sliced, 10);
      
      let sumDist = 0;
      for (let i = 0; i < 10; i++) {
        sumDist += frameDistance(resampled[i], keyframes[i]);
      }
      const avgDist = sumDist / 10;

      if (avgDist < minDistance) {
        minDistance = avgDist;
        bestLabel = label;
      }
    }
  });

  const threshold = 1.5;
  let confidence = Math.max(0, 1 - (minDistance / threshold));
  if (minDistance > 0.8) {
    confidence = confidence * 0.5;
  }

  return {
    label: confidence > 0.45 ? bestLabel : "Unknown",
    confidence: parseFloat((confidence * 100).toFixed(1))
  };
}

/**
 * Saves a custom gesture template to localStorage
 */
export function saveCustomTemplate(label, data, type = "static", originalLength = 1) {
  try {
    const saved = localStorage.getItem('isl_custom_templates');
    const custom = saved ? JSON.parse(saved) : {};
    custom[label] = {
      label,
      type,
      keyframes: data,
      originalLength
    };
    localStorage.setItem('isl_custom_templates', JSON.stringify(custom));
    return true;
  } catch (e) {
    console.error("Failed to save custom template", e);
    return false;
  }
}

/**
 * Loads custom templates from localStorage
 */
export function loadCustomTemplates() {
  try {
    const saved = localStorage.getItem('isl_custom_templates');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("Failed to load custom templates", e);
    return {};
  }
}

/**
 * Clears custom templates from localStorage
 */
export function clearCustomTemplates() {
  localStorage.removeItem('isl_custom_templates');
}

