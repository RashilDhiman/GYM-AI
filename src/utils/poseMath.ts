import {
  CURL_ELBOW,
  LUNGE_KNEE,
  PoseLandmarkIndex,
  PUSHUP_ELBOW,
  SQUAT_BACK,
  SQUAT_KNEE,
} from './constants';

export type Point2D = { x: number; y: number };

function distance2D(a: Point2D, b: Point2D): number {
  'worklet';
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Interior angle at {@link p2} formed by segments p1–p2 and p3–p2 (Law of Cosines).
 * Returns degrees in [0, 180].
 */
export function calculateAngle(p1: Point2D, p2: Point2D, p3: Point2D): number {
  'worklet';
  const a = distance2D(p2, p3);
  const b = distance2D(p1, p3);
  const c = distance2D(p1, p2);
  if (a < 1e-6 || c < 1e-6) {
    return 0;
  }
  let cos = (a * a + c * c - b * b) / (2 * a * c);
  cos = Math.min(1, Math.max(-1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function pointFromLandmarks(
  landmarks: ReadonlyArray<number>,
  index: number,
): Point2D {
  'worklet';
  const o = index * 4;
  return { x: landmarks[o] ?? 0, y: landmarks[o + 1] ?? 0 };
}

/** Squat phase from leading leg knee angle (hip–knee–ankle). */
export function getSquatKneePhase(
  kneeAngleDeg: number,
): 'down' | 'up' | 'neutral' {
  'worklet';
  if (kneeAngleDeg < SQUAT_KNEE.DOWN_MAX) {
    return 'down';
  }
  if (kneeAngleDeg > SQUAT_KNEE.UP_MIN) {
    return 'up';
  }
  return 'neutral';
}

/** Bicep curl phase from elbow angle (shoulder–elbow–wrist). */
export function getBicepCurlElbowPhase(
  elbowAngleDeg: number,
): 'up' | 'down' | 'neutral' {
  'worklet';
  if (elbowAngleDeg < CURL_ELBOW.UP_MAX) {
    return 'up';
  }
  if (elbowAngleDeg > CURL_ELBOW.DOWN_MIN) {
    return 'down';
  }
  return 'neutral';
}

export function getLungeKneePhase(kneeAngleDeg: number): 'down' | 'up' | 'neutral' {
  'worklet';
  if (kneeAngleDeg < LUNGE_KNEE.DOWN_MAX) {
    return 'down';
  }
  if (kneeAngleDeg > LUNGE_KNEE.UP_MIN) {
    return 'up';
  }
  return 'neutral';
}

export function getPushupElbowPhase(elbowAngleDeg: number): 'up' | 'down' | 'neutral' {
  'worklet';
  if (elbowAngleDeg < PUSHUP_ELBOW.DOWN_MAX) {
    return 'down';
  }
  if (elbowAngleDeg > PUSHUP_ELBOW.UP_MIN) {
    return 'up';
  }
  return 'neutral';
}

/**
 * Deviation of shoulder–hip–knee angle at the hip from a straight line (180°).
 * 0 = perfectly stacked; larger = more forward lean / rounded back in the sagittal view.
 */
export function getSquatBackDeviationDeg(
  shoulder: Point2D,
  hip: Point2D,
  knee: Point2D,
): number {
  'worklet';
  const angleAtHip = calculateAngle(shoulder, hip, knee);
  return Math.abs(SQUAT_BACK.IDEAL_STRAIGHT_DEG - angleAtHip);
}

export function shouldWarnSquatBack(
  shoulder: Point2D,
  hip: Point2D,
  knee: Point2D,
): boolean {
  'worklet';
  return getSquatBackDeviationDeg(shoulder, hip, knee) > SQUAT_BACK.MAX_DEVIATION_DEG;
}

/** Leading side squat metrics from normalized landmark buffer (x,y,z,score × 33). */
export function analyzeSquatRightSide(landmarks: ReadonlyArray<number>): {
  kneeAngle: number;
  backDeviationDeg: number;
  warnBack: boolean;
} {
  'worklet';
  const shoulder = pointFromLandmarks(
    landmarks,
    PoseLandmarkIndex.RIGHT_SHOULDER,
  );
  const hip = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_HIP);
  const knee = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_KNEE);
  const ankle = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_ANKLE);

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const backDeviationDeg = getSquatBackDeviationDeg(shoulder, hip, knee);
  const warnBack = backDeviationDeg > SQUAT_BACK.MAX_DEVIATION_DEG;

  return { kneeAngle, backDeviationDeg, warnBack };
}

export function analyzeBicepCurlRightSide(landmarks: ReadonlyArray<number>): {
  elbowAngle: number;
} {
  'worklet';
  const shoulder = pointFromLandmarks(
    landmarks,
    PoseLandmarkIndex.RIGHT_SHOULDER,
  );
  const elbow = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_ELBOW);
  const wrist = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_WRIST);
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  return { elbowAngle };
}

export function analyzeLungeRightSide(landmarks: ReadonlyArray<number>): {
  kneeAngle: number;
} {
  'worklet';
  const hip = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_HIP);
  const knee = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_KNEE);
  const ankle = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_ANKLE);
  const kneeAngle = calculateAngle(hip, knee, ankle);
  return { kneeAngle };
}

export function analyzePushupRightSide(landmarks: ReadonlyArray<number>): {
  elbowAngle: number;
} {
  'worklet';
  const shoulder = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_SHOULDER);
  const elbow = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_ELBOW);
  const wrist = pointFromLandmarks(landmarks, PoseLandmarkIndex.RIGHT_WRIST);
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  return { elbowAngle };
}

/** Parses native ML Kit plugin payload inside the Vision Camera frame worklet. */
export function extractLandmarksFromPluginResult(result: unknown): number[] | null {
  'worklet';
  if (result == null || typeof result !== 'object') {
    return null;
  }
  const lm = (result as { landmarks?: unknown }).landmarks;
  if (!Array.isArray(lm)) {
    return null;
  }
  const out: number[] = [];
  for (let i = 0; i < lm.length; i += 1) {
    const v = lm[i];
    out.push(typeof v === 'number' ? v : Number(v));
  }
  return out;
}
