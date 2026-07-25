export interface HandPoint {
  x: number;
  y: number;
}

export interface HandednessCategory {
  categoryName?: string;
  displayName?: string;
}

export type MultiHandedness = HandednessCategory[][] | undefined;

function normalizeSingleHand(hand: HandPoint[] | null): { normalized: number[]; scale: number } {
  const result = Array.from({ length: 42 }, () => 0);
  if (!hand || hand.length < 21) {
    return { normalized: result, scale: 1 };
  }

  const wrist = hand[0];
  const middleMcp = hand[9] || hand[12] || hand[0];

  // Calculate primary hand axis angle from wrist to middle MCP joint
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  const currentAngle = Math.atan2(dy, dx);
  // Target orientation: straight up (-PI / 2)
  const rotAngle = -Math.PI / 2 - currentAngle;
  const cosA = Math.cos(rotAngle);
  const sinA = Math.sin(rotAngle);

  // Center and rotate all 21 points
  const rotated = hand.map((point) => {
    const cx = point.x - wrist.x;
    const cy = point.y - wrist.y;
    return {
      x: cx * cosA - cy * sinA,
      y: cx * sinA + cy * cosA,
    };
  });

  // Calculate max distance for scale invariance
  let maxDist = 0;
  rotated.forEach((point) => {
    const dist = Math.sqrt(point.x * point.x + point.y * point.y);
    if (dist > maxDist) maxDist = dist;
  });

  const scale = maxDist || 1;
  rotated.forEach((point, idx) => {
    result[idx * 2] = point.x / scale;
    result[idx * 2 + 1] = point.y / scale;
  });

  return { normalized: result, scale };
}

export function normalizeTwoHands(
  multiHandLandmarks: HandPoint[][],
  multiHandedness: MultiHandedness
): number[] {
  let leftHand: HandPoint[] | null = null;
  let rightHand: HandPoint[] | null = null;

  for (let i = 0; i < multiHandLandmarks.length; i += 1) {
    const handedness = multiHandedness?.[i]?.[0];
    const label = (handedness?.categoryName || handedness?.displayName || "").toLowerCase();

    if (label === "left") {
      leftHand = multiHandLandmarks[i];
    } else if (label === "right") {
      rightHand = multiHandLandmarks[i];
    } else if (!leftHand) {
      leftHand = multiHandLandmarks[i];
    } else if (!rightHand) {
      rightHand = multiHandLandmarks[i];
    }
  }

  const { normalized: leftNormalized, scale: leftScale } = normalizeSingleHand(leftHand);
  const { normalized: rightNormalized, scale: rightScale } = normalizeSingleHand(rightHand);

  let relativeOffset = [0, 0, 0];
  if (leftHand && rightHand) {
    const dx = rightHand[0].x - leftHand[0].x;
    const dy = rightHand[0].y - leftHand[0].y;
    const avgScale = (leftScale + rightScale) / 2;
    relativeOffset = [dx / avgScale, dy / avgScale, 0];
  }

  return [
    ...leftNormalized,
    leftHand ? 1 : 0,
    ...rightNormalized,
    rightHand ? 1 : 0,
    ...relativeOffset,
  ];
}

export type SignTemplate = number[] | number[][];

function frameDistance(f1: number[], f2: number[]): number {
  if (f1.length !== f2.length) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let i = 0; i < f1.length; i += 1) {
    const diff = f1[i] - f2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function makeSequencePositionInvariant(seq: number[][]): number[][] {
  if (seq.length === 0) return seq;

  const startFrame = seq[0];
  return seq.map((frame) => {
    const invFrame = [...frame];
    if (frame.length >= 88) {
      invFrame[86] = frame[86] - startFrame[86];
      invFrame[87] = frame[87] - startFrame[87];
    }
    return invFrame;
  });
}

export function trajectoryDistance(liveSeq: number[][], targetSeq: number[][]): number {
  if (liveSeq.length === 0 || targetSeq.length === 0) return Number.POSITIVE_INFINITY;

  const normLive = makeSequencePositionInvariant(liveSeq);
  const normTarget = makeSequencePositionInvariant(targetSeq);

  const targetLen = normTarget.length;
  const liveLen = normLive.length;

  let totalDist = 0;
  for (let i = 0; i < targetLen; i++) {
    const liveIdx = Math.min(Math.floor((i / targetLen) * liveLen), liveLen - 1);
    totalDist += frameDistance(normLive[liveIdx], normTarget[i]);
  }

  return totalDist / targetLen;
}

export function dtwDistance(seq1: number[][], seq2: number[][]): number {
  if (seq1.length === 0 || seq2.length === 0) return Number.POSITIVE_INFINITY;

  const norm1 = makeSequencePositionInvariant(seq1);
  const norm2 = makeSequencePositionInvariant(seq2);

  const n = norm1.length;
  const m = norm2.length;

  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: m + 1 }, () => Number.POSITIVE_INFINITY)
  );
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = frameDistance(norm1[i - 1], norm2[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],
        dtw[i][j - 1],
        dtw[i - 1][j - 1]
      );
    }
  }

  return dtw[n][m] / Math.max(n, m);
}

export function classifyAlphabet(
  normalizedFeatures: number[] | null,
  templates: Record<string, SignTemplate>,
  liveSequence: number[][] = [],
  disabledSigns: string[] = [],
  minConfidenceThreshold: number = 35
): { label: string; confidence: number } {
  if (!normalizedFeatures) {
    return { label: "No Hand Detected", confidence: 0 };
  }

  const entries = Object.entries(templates).filter(([, value]) => Array.isArray(value) && value.length > 0);
  if (entries.length === 0) {
    return { label: "No Alphabet Templates", confidence: 0 };
  }

  let bestLabel = "Unknown";
  let bestDistance = Number.POSITIVE_INFINITY;

  entries.forEach(([label, template]) => {
    if (disabledSigns.includes(label)) return;

    let dist = Number.POSITIVE_INFINITY;

    // Handle 2D dynamic sequence templates (recorded video motion sequence)
    if (Array.isArray(template[0])) {
      const targetSeq = template as number[][];
      if (liveSequence.length >= 3) {
        let minWCost = Number.POSITIVE_INFINITY;
        const windowSizes = [10, 20, 35, 50, 70, 90, liveSequence.length].filter((w) => w <= liveSequence.length);
        for (const wSize of windowSizes) {
          const subSeq = liveSequence.slice(-wSize);
          const tDist = trajectoryDistance(subSeq, targetSeq);
          const dtwDist = dtwDistance(subSeq, targetSeq);
          const combined = Math.min(tDist, dtwDist);
          if (combined < minWCost) {
            minWCost = combined;
          }
        }
        dist = minWCost;
      } else {
        // Fallback: minimum frame distance to any keyframe in sequence
        let minD = Number.POSITIVE_INFINITY;
        targetSeq.forEach((frame) => {
          const d = frameDistance(normalizedFeatures, frame);
          if (d < minD) minD = d;
        });
        dist = minD;
      }
    } else {
      // Handle 1D static templates (single frame image)
      const targetVector = template as number[];
      dist = frameDistance(normalizedFeatures, targetVector);
    }

    if (dist < bestDistance) {
      bestDistance = dist;
      bestLabel = label;
    }
  });

  // Calculate normalized confidence score
  const threshold = 1.8;
  const rawConfidence = Math.max(0, 1 - bestDistance / threshold);
  const confidencePercent = Math.round(rawConfidence * 100);

  if (confidencePercent >= minConfidenceThreshold) {
    return {
      label: bestLabel,
      confidence: confidencePercent,
    };
  }

  return { label: "Unknown", confidence: confidencePercent };
}
