package com.gymai_rn.pose

import android.view.Surface
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import com.mrousavy.camera.core.FrameInvalidError
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin

/**
 * Google ML Kit Pose (BlazePose) in a Vision Camera Frame Processor Plugin.
 * Returns a map: `landmarks` (132 doubles: x,y,z,score × 33, image-normalized x/y),
 * `width`, `height`.
 */
class MlKitPosePlugin : FrameProcessorPlugin() {
  private val detector =
    PoseDetection.getClient(
      PoseDetectorOptions.Builder()
        .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
        .build(),
    )

  @Throws(Throwable::class)
  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val image =
      try {
        frame.getImage()
      } catch (_: FrameInvalidError) {
        return null
      }

    val rotationDegrees =
      try {
        inputImageRotationDegrees(frame.getOrientation())
      } catch (_: FrameInvalidError) {
        0
      }

    val w = try {
      frame.width.toFloat()
    } catch (_: FrameInvalidError) {
      return null
    }

    val h = try {
      frame.height.toFloat()
    } catch (_: FrameInvalidError) {
      return null
    }

    val inputImage = InputImage.fromMediaImage(image, rotationDegrees)
    val pose = Tasks.await(detector.process(inputImage))

    val landmarks = ArrayList<Double>(33 * 4)
    for (i in 0 until 33) {
      val lm = pose.getPoseLandmark(i)
      if (lm != null) {
        val p = lm.position
        landmarks.add((p.x / w).toDouble())
        landmarks.add((p.y / h).toDouble())
        landmarks.add(0.0)
        landmarks.add(lm.inFrameLikelihood.toDouble())
      } else {
        repeat(4) { landmarks.add(0.0) }
      }
    }

    return mapOf(
      "landmarks" to landmarks,
      "width" to w.toDouble(),
      "height" to h.toDouble(),
    )
  }

  private fun inputImageRotationDegrees(orientation: Orientation): Int =
    when (orientation.toSurfaceRotation()) {
      Surface.ROTATION_0 -> 0
      Surface.ROTATION_90 -> 90
      Surface.ROTATION_180 -> 180
      Surface.ROTATION_270 -> 270
      else -> 0
    }
}
