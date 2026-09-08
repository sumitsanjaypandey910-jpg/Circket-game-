import { DetectedPose, Landmark } from '../types';

export interface MediaPipeResults {
  poseLandmarks?: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
}

// MediaPipe global declarations
declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

export class PoseTracker {
  private lastWristPos: { x: number; y: number; time: number } | null = null;
  private currentPose: DetectedPose = {
    ready: false,
    distanceScore: 0,
    swingDetected: false,
    swingSpeed: 0,
    swingSide: 'straight',
  };

  private swingCooldown: number = 0;
  private recentSpeeds: number[] = [];

  public processLandmarks(landmarks?: Landmark[]): DetectedPose {
    const now = performance.now();

    if (!landmarks || landmarks.length < 25) {
      this.currentPose = {
        ready: false,
        distanceScore: 0,
        swingDetected: false,
        swingSpeed: 0,
        swingSide: 'straight',
        rawLandmarks: undefined,
      };
      return this.currentPose;
    }

    // MediaPipe Pose landmarks
    // 11: left_shoulder, 12: right_shoulder
    // 13: left_elbow, 14: right_elbow
    // 15: left_wrist, 16: right_wrist
    // 23: left_hip, 24: right_hip
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Check visibility and presence
    const shouldersPresent =
      (leftShoulder?.visibility ?? 1) > 0.4 && (rightShoulder?.visibility ?? 1) > 0.4;
    const wristsPresent =
      (leftWrist?.visibility ?? 1) > 0.35 || (rightWrist?.visibility ?? 1) > 0.35;

    // Distance calculation: Distance ~2 meters away corresponds to shoulder span taking ~18% to 40% of viewport width
    let distanceScore = 0;
    let isReady = false;

    if (shouldersPresent && leftShoulder && rightShoulder) {
      const shoulderSpan = Math.hypot(
        rightShoulder.x - leftShoulder.x,
        rightShoulder.y - leftShoulder.y
      );

      // Ideal span at ~2 meters is ~0.24
      // Too close: span > 0.48
      // Too far: span < 0.12
      if (shoulderSpan >= 0.14 && shoulderSpan <= 0.46) {
        distanceScore = 1.0 - Math.abs(shoulderSpan - 0.26) / 0.2;
        distanceScore = Math.max(0.1, Math.min(1.0, distanceScore));
        isReady = wristsPresent && distanceScore > 0.45;
      } else if (shoulderSpan > 0.46) {
        distanceScore = 0.3; // Too close
      } else {
        distanceScore = 0.2; // Too far
      }
    }

    // Bat grip midpoint (batsman holds bat with both hands or dominant hand)
    let wristMidX = 0.5;
    let wristMidY = 0.7;
    let validHandsCount = 0;

    if (leftWrist && (leftWrist.visibility ?? 1) > 0.3) {
      wristMidX += leftWrist.x;
      wristMidY += leftWrist.y;
      validHandsCount++;
    }
    if (rightWrist && (rightWrist.visibility ?? 1) > 0.3) {
      wristMidX += rightWrist.x;
      wristMidY += rightWrist.y;
      validHandsCount++;
    }

    if (validHandsCount > 0) {
      wristMidX = (wristMidX - (validHandsCount === 1 ? 0.5 : 0)) / validHandsCount;
      wristMidY = (wristMidY - (validHandsCount === 1 ? 0.7 : 0)) / validHandsCount;
    }

    // Swing velocity calculation
    let swingDetected = false;
    let swingSpeed = 0;
    let swingSide: 'off' | 'leg' | 'straight' = 'straight';

    if (this.lastWristPos && validHandsCount > 0) {
      const dt = (now - this.lastWristPos.time) / 1000;
      if (dt > 0.01 && dt < 0.25) {
        const dx = wristMidX - this.lastWristPos.x;
        const dy = wristMidY - this.lastWristPos.y;
        const distance = Math.hypot(dx, dy);
        const speed = distance / dt; // screen coordinates per second

        this.recentSpeeds.push(speed);
        if (this.recentSpeeds.length > 5) this.recentSpeeds.shift();

        // Threshold for batting swing: fast acceleration (> 1.25 screen units/sec)
        const peakSpeed = Math.max(...this.recentSpeeds);

        if (peakSpeed > 1.2 && now > this.swingCooldown) {
          swingDetected = true;
          swingSpeed = peakSpeed;
          this.swingCooldown = now + 450; // 450ms cooldown between swings

          // Determine shot direction
          if (dx > 0.08) {
            swingSide = 'off'; // driving through covers/point
          } else if (dx < -0.08) {
            swingSide = 'leg'; // pulling/glancing to on-side
          } else {
            swingSide = 'straight'; // straight lofted drive
          }
        }
      }
    }

    this.lastWristPos = { x: wristMidX, y: wristMidY, time: now };

    this.currentPose = {
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
      leftHip,
      rightHip,
      rawLandmarks: landmarks,
      ready: isReady,
      distanceScore,
      swingDetected,
      swingSpeed,
      swingSide,
    };

    return this.currentPose;
  }

  // Trigger manual simulated swing (useful for testing or fallback button)
  public triggerManualSwing(side: 'off' | 'leg' | 'straight' = 'straight', speed: number = 2.4): DetectedPose {
    this.currentPose.swingDetected = true;
    this.currentPose.swingSpeed = speed;
    this.currentPose.swingSide = side;
    this.swingCooldown = performance.now() + 450;
    return this.currentPose;
  }
}
