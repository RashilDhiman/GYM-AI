import { useMemo } from 'react';
import { runAtTargetFps, VisionCameraProxy } from 'react-native-vision-camera';
import {
  analyzeBicepCurlRightSide,
  analyzeLungeRightSide,
  analyzePushupRightSide,
  analyzeSquatRightSide,
  extractLandmarksFromPluginResult,
  getBicepCurlElbowPhase,
  getLungeKneePhase,
  getPushupElbowPhase,
  getSquatKneePhase,
} from '../utils/poseMath';
import type { ExerciseMode, RepPhase } from '../types/gym';

type PoseResult = {
  landmarks: number[];
  repPhase: RepPhase;
  warnBack: boolean;
};

export function usePoseDetection() {
  const posePlugin = useMemo(
    () => VisionCameraProxy.initFrameProcessorPlugin('mlkitPose', {}),
    [],
  );

  const processFrame = (
    frame: unknown,
    exerciseMode: ExerciseMode,
    onPose: (result: PoseResult) => void,
  ) => {
    'worklet';
    if (posePlugin == null) {
      return;
    }
    runAtTargetFps(20, () => {
      'worklet';
      const raw = posePlugin.call(frame as never);
      const landmarks = extractLandmarksFromPluginResult(raw);
      if (landmarks == null) {
        return;
      }

      if (exerciseMode === 'squat') {
        const squat = analyzeSquatRightSide(landmarks);
        onPose({
          landmarks,
          repPhase: getSquatKneePhase(squat.kneeAngle),
          warnBack: squat.warnBack,
        });
        return;
      }

      if (exerciseMode === 'bicepCurl') {
        const curl = analyzeBicepCurlRightSide(landmarks);
        onPose({
          landmarks,
          repPhase: getBicepCurlElbowPhase(curl.elbowAngle),
          warnBack: false,
        });
        return;
      }

      if (exerciseMode === 'lunge') {
        const lunge = analyzeLungeRightSide(landmarks);
        onPose({
          landmarks,
          repPhase: getLungeKneePhase(lunge.kneeAngle),
          warnBack: false,
        });
        return;
      }

      const pushup = analyzePushupRightSide(landmarks);
      onPose({
        landmarks,
        repPhase: getPushupElbowPhase(pushup.elbowAngle),
        warnBack: false,
      });
    });
  };

  return { processFrame };
}

