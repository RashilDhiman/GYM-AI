/**
 * BlazePose / ML Kit Pose landmark indices (33 landmarks).
 * Matches {@link https://developers.google.com/ml-kit/vision/pose-detection}
 */
export const PoseLandmarkIndex = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_MOUTH: 9,
  RIGHT_MOUTH: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/** Squat: knee angle (hip–knee–ankle) thresholds in degrees */
export const SQUAT_KNEE = {
  DOWN_MAX: 90,
  UP_MIN: 160,
} as const;

/** Squat: torso line at hip (shoulder–hip–knee) should stay near 180° when upright */
export const SQUAT_BACK = {
  IDEAL_STRAIGHT_DEG: 180,
  MAX_DEVIATION_DEG: 15,
} as const;

/** Bicep curl: elbow angle (shoulder–elbow–wrist) */
export const CURL_ELBOW = {
  UP_MAX: 30,
  DOWN_MIN: 160,
} as const;

/** Lunge: front-knee angle (hip-knee-ankle) */
export const LUNGE_KNEE = {
  DOWN_MAX: 100,
  UP_MIN: 155,
} as const;

/** Push-up: elbow angle (shoulder-elbow-wrist) */
export const PUSHUP_ELBOW = {
  DOWN_MAX: 80,
  UP_MIN: 155,
} as const;

export const POSE_LANDMARK_COUNT = 33;
