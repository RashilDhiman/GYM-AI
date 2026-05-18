export type ExerciseMode = 'squat' | 'bicepCurl' | 'lunge' | 'pushup';

export type RepPhase = 'up' | 'down' | 'neutral';

export type PosePayload = {
  landmarks: number[];
  width?: number;
  height?: number;
};

