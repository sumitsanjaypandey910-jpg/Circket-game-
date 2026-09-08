import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, RefreshCw, UserCheck, AlertTriangle, Sparkles, Check } from 'lucide-react';
import { DetectedPose } from '../../types';
import { sounds } from '../../utils/audio';

interface CameraSetupScreenProps {
  pose: DetectedPose | null;
  cameraActive: boolean;
  cameraError: string | null;
  onRetryCamera: () => void;
  onProceed: () => void;
  onBack: () => void;
  isPausedMode?: boolean;
}

export const CameraSetupScreen: React.FC<CameraSetupScreenProps> = ({
  pose,
  cameraActive,
  cameraError,
  onRetryCamera,
  onProceed,
  onBack,
  isPausedMode = false,
}) => {
  const isPositioned = pose?.ready || (pose?.distanceScore ?? 0) > 0.45;
  const distanceScore = pose?.distanceScore ?? 0;

  // Calibration progress: 0 to 100%
  const [calibrationProgress, setCalibrationProgress] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPositioned) {
      interval = setInterval(() => {
        setCalibrationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCalibrated(true);
            sounds.playCountdownBeep(true);
            // Delay 600ms so player sees "CALIBRATION DONE ✓" clearly
            setTimeout(() => {
              onProceed();
            }, 700);
            return 100;
          }
          return prev + 10; // fills in ~1.0s
        });
      }, 95);
    } else {
      setCalibrationProgress(0);
      setIsCalibrated(false);
    }

    return () => clearInterval(interval);
  }, [isPositioned, onProceed]);

  // Guidance status text
  let statusTitle = 'CALIBRATION: NOT DONE';
  let statusDesc = 'Stand 2 meters away in your batting stance';
  let badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  if (!pose || !pose.leftShoulder) {
    statusTitle = 'CALIBRATION: NOT DONE';
    statusDesc = 'Step in front of the phone camera';
    badgeStyle = 'text-slate-300 bg-slate-900/80 border-slate-700';
  } else if (isCalibrated) {
    statusTitle = 'CALIBRATION: DONE ✓';
    statusDesc = 'Stance locked! Starting match ball screen...';
    badgeStyle = 'text-emerald-300 bg-emerald-500/20 border-emerald-400 glow-neon';
  } else if (isPositioned) {
    statusTitle = `CALIBRATING: ${Math.round(calibrationProgress)}%`;
    statusDesc = 'Hold position! Locking batting crease...';
    badgeStyle = 'text-yellow-300 bg-yellow-500/15 border-yellow-400 glow-gold';
  } else if (distanceScore <= 0.3) {
    statusTitle = 'CALIBRATION: NOT DONE';
    statusDesc = 'Step back slightly (approx 2 meters away)';
    badgeStyle = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 z-30 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center z-20">
        <button
          onClick={onBack}
          className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur"
        >
          {isPausedMode ? '← Leave Match' : '← Back'}
        </button>

        {/* Clear Calibration Status Pill */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md transition-all duration-200 ${
            isCalibrated
              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 glow-neon'
              : isPositioned
              ? 'bg-yellow-950/80 border-yellow-400 text-yellow-300'
              : 'bg-slate-900/80 border-slate-700 text-slate-400'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isCalibrated
                ? 'bg-emerald-400 shadow-[0_0_10px_#4ade80]'
                : isPositioned
                ? 'bg-yellow-400 animate-ping'
                : 'bg-red-400'
            }`}
          />
          <span className="text-xs font-display font-black uppercase tracking-wider">
            {isCalibrated
              ? 'CALIBRATION DONE ✓'
              : isPositioned
              ? 'CALIBRATING...'
              : 'CALIBRATION NOT DONE'}
          </span>
        </div>
      </div>

      {/* Center Body Crease Silhouette Target Framing */}
      <div className="relative my-auto flex flex-col items-center justify-center pointer-events-none">
        {/* Silhouette Frame */}
        <div
          className="relative w-56 h-80 sm:w-64 sm:h-96 border-2 border-dashed rounded-3xl flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]"
          style={{
            borderColor: isCalibrated
              ? 'rgba(34, 197, 94, 0.95)'
              : isPositioned
              ? 'rgba(234, 179, 8, 0.85)'
              : 'rgba(148, 163, 184, 0.4)',
            boxShadow: isCalibrated
              ? '0 0 45px rgba(34, 197, 94, 0.45)'
              : isPositioned
              ? '0 0 30px rgba(234, 179, 8, 0.25)'
              : 'none',
          }}
        >
          {/* Silhouette SVG */}
          <svg
            viewBox="0 0 200 320"
            className="w-44 h-72 transition-all duration-300"
            style={{
              fill: isCalibrated
                ? 'rgba(34, 197, 94, 0.22)'
                : isPositioned
                ? 'rgba(234, 179, 8, 0.14)'
                : 'rgba(255, 255, 255, 0.05)',
              stroke: isCalibrated ? '#4ade80' : isPositioned ? '#facc15' : '#94a3b8',
              strokeWidth: isCalibrated ? 3 : 2,
              strokeDasharray: isCalibrated ? 'none' : '4 4',
            }}
          >
            {/* Head / Helmet */}
            <circle cx="100" cy="45" r="24" />
            {/* Neck & Torso */}
            <path d="M72 80 L128 80 L120 180 L80 180 Z" />
            {/* Left Arm */}
            <path d="M72 80 L52 130 L90 155" fill="none" strokeWidth="3" />
            {/* Right Arm */}
            <path d="M128 80 L148 130 L105 155" fill="none" strokeWidth="3" />
            {/* Bat */}
            <rect
              x="94"
              y="150"
              width="12"
              height="60"
              rx="3"
              fill={isCalibrated ? 'rgba(34, 197, 94, 0.45)' : 'rgba(234, 179, 8, 0.25)'}
            />
            {/* Legs */}
            <path d="M85 180 L80 280 M115 180 L120 280" strokeWidth="3" />
          </svg>

          {/* Crease Zone Top Label */}
          <div className="absolute -top-3.5 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-display font-bold uppercase tracking-wider text-white shadow">
            {isCalibrated ? '✓ BATTER IN CREASE' : 'BATTING CREASE GUIDE'}
          </div>

          {/* Calibrating Progress Banner in Box */}
          {isPositioned && !isCalibrated && (
            <div className="absolute bottom-4 inset-x-4 flex flex-col items-center gap-1.5 bg-slate-950/95 py-2.5 px-3 rounded-2xl border border-yellow-400/50 shadow-lg">
              <div className="flex items-center gap-1.5 text-[11px] font-display font-black uppercase text-yellow-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                Calibrating... {Math.round(calibrationProgress)}%
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-100"
                  style={{ width: `${calibrationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Calibrated Success Banner */}
          {isCalibrated && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute bottom-4 inset-x-3 flex flex-col items-center gap-1 bg-emerald-950/95 py-2.5 px-3 rounded-2xl border-2 border-emerald-400 glow-neon shadow-2xl"
            >
              <div className="flex items-center gap-1.5 text-xs font-display font-black uppercase text-emerald-300">
                <Check className="w-4 h-4 text-emerald-400" />
                CALIBRATION DONE ✓
              </div>
              <span className="text-[10px] text-emerald-200 font-medium">
                Starting ball screen now...
              </span>
            </motion.div>
          )}
        </div>

        {/* Big Prominent Calibration Status Card */}
        <motion.div
          key={statusTitle}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-6 px-5 py-3 rounded-2xl border flex flex-col items-center gap-1 backdrop-blur-md max-w-xs text-center shadow-xl ${badgeStyle}`}
        >
          <div className="flex items-center gap-2 font-display font-black text-sm uppercase tracking-wider">
            {isCalibrated ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>{statusTitle}</span>
          </div>
          <span className="text-xs opacity-90">{statusDesc}</span>
        </motion.div>

        {/* Camera Error Banner */}
        {cameraError && (
          <div className="mt-3 max-w-xs px-3 py-2 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{cameraError}</span>
            <button
              onClick={onRetryCamera}
              className="ml-auto pointer-events-auto p-1 text-white bg-red-800 rounded hover:bg-red-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Manual Action Button */}
      <div className="flex flex-col gap-2 z-20 max-w-sm w-full mx-auto pb-4">
        <button
          id="confirm-camera-btn"
          onClick={() => {
            sounds.playButtonClick();
            onProceed();
          }}
          className={`w-full py-4 px-6 rounded-2xl font-display font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
            isCalibrated
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 glow-neon hover:brightness-110'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 glow-gold'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {isCalibrated ? 'Starting Game...' : 'Start Match Screen'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
