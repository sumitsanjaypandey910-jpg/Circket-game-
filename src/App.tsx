/**
 * Shadow Cricket Lite
 * Premium Android portrait single-player camera cricket game
 * Screen Flow:
 * Screen 1 - Splash
 * Screen 2 - Camera Setup
 * Screen 3 - Pose Detection
 * Screen 4 - Countdown
 * Screen 5 - Gameplay (Camera full-screen + 3D ball + swing physics)
 * Screen 6 - Shot Result (FOUR, SIX, OUT with crowd cheer)
 * Screen 7 - Scoreboard
 * Screen 8 - Game Over
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  ScreenType,
  DetectedPose,
  MatchStats,
  BallState,
  ShotResult,
  TimingQuality,
} from './types';
import { PoseTracker } from './utils/poseDetector';
import { sounds } from './utils/audio';

// Components
import { Cricket3DView } from './components/Cricket3DView';
import { StadiumBackground } from './components/StadiumBackground';
import { PoseSkeletonOverlay } from './components/PoseSkeletonOverlay';
import { SplashScreen } from './components/screens/SplashScreen';
import { CameraSetupScreen } from './components/screens/CameraSetupScreen';
import { PoseDetectionScreen } from './components/screens/PoseDetectionScreen';
import { CountdownScreen } from './components/screens/CountdownScreen';
import { GameplayHUD } from './components/gameplay/GameplayHUD';
import { ShotResultOverlay } from './components/gameplay/ShotResultOverlay';
import { ScoreboardModal } from './components/gameplay/ScoreboardModal';
import { GameOverScreen } from './components/screens/GameOverScreen';
import { ReCalibrationModal } from './components/screens/ReCalibrationModal';

const MAX_WICKETS = 3;

export default function App() {
  // Screen routing state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);

  // Camera & MediaPipe Pose
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const poseTrackerRef = useRef<PoseTracker>(new PoseTracker());
  const [currentPose, setCurrentPose] = useState<DetectedPose | null>(null);

  // Match Statistics
  const [stats, setStats] = useState<MatchStats>(() => {
    const savedHighScore = parseInt(localStorage.getItem('cricket_high_score') || '0', 10);
    return {
      runs: 0,
      ballsFaced: 0,
      wickets: 0,
      maxWickets: MAX_WICKETS,
      highScore: savedHighScore,
      fours: 0,
      sixes: 0,
      dots: 0,
      history: [],
    };
  });

  // Ball Delivery State
  const [ballState, setBallState] = useState<BallState | null>(null);
  const [bowlerStatus, setBowlerStatus] = useState<string>('FAST PACER WARMING UP');
  const [lastShotResult, setLastShotResult] = useState<ShotResult | null>(null);
  const [isBatterOutOfFrame, setIsBatterOutOfFrame] = useState<boolean>(false);
  const outOfFrameCounterRef = useRef<number>(0);

  const ballStateRef = useRef<BallState | null>(null);
  ballStateRef.current = ballState;

  const matchStatsRef = useRef<MatchStats>(stats);
  matchStatsRef.current = stats;

  // 1. Initialize Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser environment');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front selfie camera for batting
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera initialization notice:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Camera unavailable. Simulated motion mode is active.'
      );
      // Even without physical camera, app remains fully functional with fallback/simulated batsman
      setCameraActive(false);
    }
  }, []);

  // 2. MediaPipe Pose Loop
  useEffect(() => {
    let animationFrameId: number;
    let poseInstance: any = null;
    let isProcessing = false;

    const initMediaPipe = () => {
      if (typeof window !== 'undefined' && window.Pose) {
        poseInstance = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        poseInstance.setOptions({
          modelComplexity: 0, // Fast 60fps mobile complexity
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        poseInstance.onResults((results: any) => {
          if (results.poseLandmarks) {
            const detected = poseTrackerRef.current.processLandmarks(results.poseLandmarks);
            setCurrentPose({ ...detected });
          } else {
            setCurrentPose(poseTrackerRef.current.processLandmarks(undefined));
          }
          isProcessing = false;
        });
      }
    };

    initMediaPipe();

    const processFrame = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        poseInstance &&
        !isProcessing
      ) {
        try {
          isProcessing = true;
          await poseInstance.send({ image: videoRef.current });
        } catch {
          isProcessing = false;
        }
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (poseInstance) {
        try {
          poseInstance.close();
        } catch {}
      }
    };
  }, [cameraActive]);

  // Handle Swing & Bat-Ball Impact Logic
  const handleBatSwing = useCallback((speed: number = 2.4, side: 'off' | 'leg' | 'straight' = 'straight') => {
    const currentBall = ballStateRef.current;
    if (!currentBall || !currentBall.active || currentBall.isHit || currentBall.isMissed) {
      return;
    }

    const progress = currentBall.progress;

    // Bat-Ball Timing Window
    // Ball impact crease is at progress = 1.0 (approx 0.88 - 1.06 is hit zone)
    if (progress >= 0.84 && progress <= 1.08) {
      let timing: TimingQuality = 'PERFECT';
      let runs = 0;
      let shotType: ShotResult['type'] = 'FOUR';
      let distanceMeters = 0;
      let shotName = 'Cover Drive';

      if (progress >= 0.94 && progress <= 1.02) {
        // Perfect Timing!
        timing = 'PERFECT';
        if (speed >= 1.8) {
          // Massive SIX!
          runs = 6;
          shotType = 'SIX';
          distanceMeters = Math.floor(Math.random() * 20 + 98);
          shotName =
            side === 'leg'
              ? 'Massive Pull Shot Six'
              : side === 'off'
              ? 'Lofted Inside-Out Six'
              : 'Helicopter Straight Six';
        } else {
          // Cracking FOUR!
          runs = 4;
          shotType = 'FOUR';
          distanceMeters = 72;
          shotName =
            side === 'off' ? 'Blazing Cover Drive (4)' : 'Flick Through Mid-Wicket (4)';
        }
      } else if (progress < 0.94) {
        // Early timing
        timing = 'EARLY';
        if (Math.random() > 0.4) {
          runs = 2;
          shotType = '2';
          shotName = 'Mistimed Hook to Deep Square';
        } else {
          runs = 1;
          shotType = '1';
          shotName = 'Leading Edge pushed to Mid-Off';
        }
      } else {
        // Late timing
        timing = 'LATE';
        if (Math.random() > 0.5) {
          runs = 4;
          shotType = 'FOUR';
          distanceMeters = 68;
          shotName = 'Late Cut to Third Man Fence (4)';
        } else {
          runs = 1;
          shotType = '1';
          shotName = 'Thick Edge squirted into Gaps';
        }
      }

      sounds.playBatCrack(timing);

      const result: ShotResult = {
        id: `shot-${Date.now()}`,
        type: shotType,
        runs,
        timing,
        speedKph: Math.round(speed * 50 + 80),
        shotName,
        distanceMeters,
        description: `Ball struck cleanly with ${timing.toLowerCase()} timing.`,
        timestamp: Date.now(),
      };

      // Update ball state to flying away
      setBallState((prev) =>
        prev
          ? {
              ...prev,
              isHit: true,
              hitResult: result,
            }
          : null
      );

      // Record in match stats
      setStats((prev) => {
        const newRuns = prev.runs + runs;
        const newHighScore = Math.max(newRuns, prev.highScore);
        localStorage.setItem('cricket_high_score', newHighScore.toString());

        return {
          ...prev,
          runs: newRuns,
          ballsFaced: prev.ballsFaced + 1,
          fours: prev.fours + (shotType === 'FOUR' ? 1 : 0),
          sixes: prev.sixes + (shotType === 'SIX' ? 1 : 0),
          dots: prev.dots + (runs === 0 ? 1 : 0),
          highScore: newHighScore,
          history: [...prev.history, result],
        };
      });

      setLastShotResult(result);
      setCurrentScreen('shot_result');
    }
  }, []);

  // Listen to pose tracker wrist swing
  useEffect(() => {
    if (currentScreen === 'gameplay' && !isBatterOutOfFrame && currentPose?.swingDetected) {
      handleBatSwing(currentPose.swingSpeed, currentPose.swingSide);
    }
  }, [currentPose?.swingDetected, currentScreen, isBatterOutOfFrame, handleBatSwing]);

  // Monitor batter position during gameplay:
  // If batter goes out of frame or calibration is lost, pause game and show calibration screen
  useEffect(() => {
    if (currentScreen !== 'gameplay' || isBatterOutOfFrame) return;
    if (!cameraActive) return;

    const checkInterval = setInterval(() => {
      const isBatterPresent =
        currentPose &&
        currentPose.ready &&
        (currentPose.distanceScore ?? 0) >= 0.35 &&
        Boolean(currentPose.leftShoulder && currentPose.rightShoulder);

      if (!isBatterPresent) {
        outOfFrameCounterRef.current += 1;
        // If batter is missing/out of position for ~1.5 seconds (3 consecutive intervals)
        if (outOfFrameCounterRef.current >= 3) {
          setIsBatterOutOfFrame(true);
          // Pause and reset active ball so it doesn't bowl out the batsman while away
          setBallState(null);
          setBowlerStatus('⚠️ MATCH PAUSED • BATTER OUT OF CREASE');
          sounds.playWarning();
        }
      } else {
        outOfFrameCounterRef.current = 0;
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [currentScreen, isBatterOutOfFrame, cameraActive, currentPose]);

  // 3. Automatic Bowling Engine (Every 3 to 5 seconds during Screen 5 Gameplay)
  useEffect(() => {
    if (currentScreen !== 'gameplay' || isBatterOutOfFrame) return;

    let bowlingTimer: ReturnType<typeof setTimeout>;
    let ballAnimId: number;
    let isSubscribed = true;

    const bowlNextBall = () => {
      if (!isSubscribed) return;

      // Bowler run-up cue
      setBowlerStatus('⚡ BOWLER RUNNING IN...');
      sounds.playWhoosh();

      const speedKph = Math.floor(Math.random() * 18 + 130); // 130 - 148 km/h fast bowling
      const lineOffset = (Math.random() - 0.5) * 0.7; // slight off-stump / leg-stump line
      const durationMs = 1350; // delivery travel time from release to batsman

      const newBall: BallState = {
        id: Date.now(),
        active: true,
        progress: 0,
        speedKph,
        lineOffset,
        flightDurationMs: durationMs,
        isHit: false,
        isMissed: false,
      };

      setBallState(newBall);
      setBowlerStatus(`DELIVERY: ${speedKph} km/h Fast`);

      const startTime = performance.now();

      const animateBall = (now: number) => {
        if (!isSubscribed) return;
        const elapsed = now - startTime;
        const progress = elapsed / durationMs;

        setBallState((prev) => {
          if (!prev || !prev.active) return prev;

          // If already hit or already processed missed, continue trajectory
          if (prev.isHit || prev.isMissed) {
            if (progress < 2.2) {
              return { ...prev, progress };
            } else {
              return null; // ball finished flight
            }
          }

          // Check if ball passed batsman without hit (progress > 1.08)
          if (progress >= 1.08 && !prev.isHit && !prev.isMissed) {
            // Ball missed by batsman!
            const isBowled = Math.abs(lineOffset) < 0.22; // On target stumps
            const shotResult: ShotResult = {
              id: `miss-${Date.now()}`,
              type: isBowled ? 'OUT' : '0',
              runs: 0,
              timing: 'MISSED',
              speedKph,
              shotName: isBowled ? 'Clean Bowled! (Stumps Shattered)' : 'Beaten Outside Off (Dot Ball)',
              distanceMeters: 0,
              description: isBowled ? 'Off stump knocked back!' : 'Play and a miss.',
              timestamp: Date.now(),
            };

            setStats((st) => {
              const newWickets = isBowled ? st.wickets + 1 : st.wickets;
              return {
                ...st,
                ballsFaced: st.ballsFaced + 1,
                wickets: newWickets,
                dots: st.dots + (isBowled ? 0 : 1),
                history: [...st.history, shotResult],
              };
            });

            setLastShotResult(shotResult);
            setCurrentScreen('shot_result');

            return {
              ...prev,
              progress,
              isMissed: true,
              hitResult: shotResult,
            };
          }

          return { ...prev, progress };
        });

        if (progress < 2.5 && isSubscribed) {
          ballAnimId = requestAnimationFrame(animateBall);
        } else if (isSubscribed) {
          // Schedule next delivery in 3.5 seconds if still in gameplay
          bowlingTimer = setTimeout(bowlNextBall, 3500);
        }
      };

      ballAnimId = requestAnimationFrame(animateBall);
    };

    // First ball starts after 1.5 seconds of entering gameplay
    bowlingTimer = setTimeout(bowlNextBall, 1500);

    return () => {
      isSubscribed = false;
      clearTimeout(bowlingTimer);
      cancelAnimationFrame(ballAnimId);
    };
  }, [currentScreen, isBatterOutOfFrame]);

  // Check Game Over when wickets reach MAX_WICKETS
  useEffect(() => {
    if (stats.wickets >= MAX_WICKETS && currentScreen !== 'game_over') {
      const timer = setTimeout(() => {
        setCurrentScreen('game_over');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [stats.wickets, currentScreen]);

  // Restart / Reset Match
  const handleRestartMatch = () => {
    setStats((prev) => ({
      runs: 0,
      ballsFaced: 0,
      wickets: 0,
      maxWickets: MAX_WICKETS,
      highScore: prev.highScore,
      fours: 0,
      sixes: 0,
      dots: 0,
      history: [],
    }));
    setBallState(null);
    setLastShotResult(null);
    setCurrentScreen('countdown');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans flex items-center justify-center select-none">
      {/* Container constrained to portrait Android ratio on desktop or full screen on mobile */}
      <div className="relative w-full h-full max-w-md max-h-[920px] aspect-[9/16] bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Layer 1: Background Video Camera (Mirrored for natural selfie batting) */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-500 z-0 pointer-events-none ${
            currentScreen === 'gameplay' && !isBatterOutOfFrame ? 'opacity-0' : 'opacity-85'
          }`}
        />

        {/* Stadium Background for the Ball Screen */}
        {(currentScreen === 'gameplay' ||
          currentScreen === 'shot_result' ||
          currentScreen === 'countdown') && (
          <StadiumBackground opacity={isBatterOutOfFrame ? 0.25 : 1} />
        )}

        {/* Layer 2: 3D Cricket World Canvas (Pitch, 3D Ball, Floodlights, Wickets) */}
        {(currentScreen === 'gameplay' || currentScreen === 'shot_result') && (
          <Cricket3DView
            ballState={ballState}
            lastShot={lastShotResult}
            isBowling={currentScreen === 'gameplay' && !isBatterOutOfFrame}
          />
        )}

        {/* Layer 3: Pose Skeleton Overlay Canvas: Only shown during setup or recalibration */}
        {(currentScreen === 'setup' || isBatterOutOfFrame) && (
          <PoseSkeletonOverlay
            pose={currentPose}
            showHitZone={false}
          />
        )}

        {/* Layer 4: Screen Flow Router */}
        <AnimatePresence mode="wait">
          {/* Screen 1 – Splash */}
          {currentScreen === 'splash' && (
            <SplashScreen
              key="screen-splash"
              highScore={stats.highScore}
              onStart={async () => {
                await startCamera();
                setCurrentScreen('setup');
              }}
              onCalibrate={async () => {
                await startCamera();
                setCurrentScreen('setup');
              }}
            />
          )}

          {/* Screen 2 – Camera Setup */}
          {currentScreen === 'setup' && (
            <CameraSetupScreen
              key="screen-setup"
              pose={currentPose}
              cameraActive={cameraActive}
              cameraError={cameraError}
              onRetryCamera={startCamera}
              onProceed={() => setCurrentScreen('countdown')}
              onBack={() => setCurrentScreen('splash')}
            />
          )}

          {/* Screen 3 – Pose Detection (Accessible for manual check) */}
          {currentScreen === 'pose_check' && (
            <PoseDetectionScreen
              key="screen-pose"
              pose={currentPose}
              onProceed={() => setCurrentScreen('countdown')}
              onSimulateSwing={() => {
                const simulated = poseTrackerRef.current.triggerManualSwing('straight', 2.5);
                setCurrentPose({ ...simulated });
              }}
              onBack={() => setCurrentScreen('setup')}
            />
          )}

          {/* Screen 4 – Countdown */}
          {currentScreen === 'countdown' && (
            <CountdownScreen
              key="screen-countdown"
              onComplete={() => setCurrentScreen('gameplay')}
            />
          )}

          {/* Screen 5 – Gameplay */}
          {currentScreen === 'gameplay' && (
            <GameplayHUD
              key="screen-gameplay"
              stats={stats}
              ballState={ballState}
              bowlerStatus={bowlerStatus}
              pose={currentPose}
              onManualSwing={() => handleBatSwing(2.4, 'off')}
              onOpenScoreboard={() => setShowScoreboard(true)}
            />
          )}

          {/* Screen 6 – Shot Result */}
          {currentScreen === 'shot_result' && lastShotResult && (
            <ShotResultOverlay
              key="screen-shot-result"
              result={lastShotResult}
              onNextBall={() => {
                if (stats.wickets >= MAX_WICKETS) {
                  setCurrentScreen('game_over');
                } else {
                  setCurrentScreen('gameplay');
                }
              }}
            />
          )}

          {/* Screen 8 – Game Over */}
          {currentScreen === 'game_over' && (
            <GameOverScreen
              key="screen-game-over"
              stats={stats}
              onPlayAgain={handleRestartMatch}
              onGoHome={() => setCurrentScreen('splash')}
            />
          )}
        </AnimatePresence>

        {/* Re-Calibration Modal when batter goes out of frame during gameplay */}
        <AnimatePresence>
          {isBatterOutOfFrame && currentScreen === 'gameplay' && (
            <ReCalibrationModal
              key="modal-recalibrate"
              pose={currentPose}
              onResume={() => {
                setIsBatterOutOfFrame(false);
                outOfFrameCounterRef.current = 0;
                setBowlerStatus('⚡ BATTER IN CREASE • RESUMING MATCH');
                sounds.playCountdownBeep(true);
              }}
            />
          )}
        </AnimatePresence>

        {/* Screen 7 – Scoreboard Modal (Accessible anytime or in gameplay) */}
        {showScoreboard && (
          <ScoreboardModal
            stats={stats}
            onClose={() => setShowScoreboard(false)}
            onRestart={handleRestartMatch}
          />
        )}
      </div>
    </div>
  );
}
