import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Sparkles, UserCheck, Play } from 'lucide-react';
import { DetectedPose } from '../../types';
import { sounds } from '../../utils/audio';

interface ReCalibrationModalProps {
  pose: DetectedPose | null;
  onResume: () => void;
}

export const ReCalibrationModal: React.FC<ReCalibrationModalProps> = ({
  pose,
  onResume,
}) => {
  const isPositioned = pose?.ready || (pose?.distanceScore ?? 0) > 0.45;
  const [progress, setProgress] = useState<number>(0);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPositioned) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCalibrated(true);
            sounds.playCountdownBeep(true);
            setTimeout(() => {
              onResume();
            }, 600);
            return 100;
          }
          return prev + 12; // ~800ms
        });
      }, 90);
    } else {
      setProgress(0);
      setIsCalibrated(false);
    }

    return () => clearInterval(interval);
  }, [isPositioned, onResume]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col justify-between p-6 bg-slate-950/85 backdrop-blur-md"
    >
      {/* Top Banner */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300">
          <AlertCircle className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-display font-black uppercase tracking-wider">
            Game Paused • Batter Out of Frame
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium">
          Step back 2 meters into batting stance to resume
        </p>
      </div>

      {/* Silhouette Crease Frame in Center */}
      <div className="relative my-auto flex flex-col items-center justify-center">
        <div
          className="relative w-52 h-72 border-2 border-dashed rounded-3xl flex items-center justify-center transition-all duration-300"
          style={{
            borderColor: isCalibrated
              ? 'rgba(34, 197, 94, 0.9)'
              : isPositioned
              ? 'rgba(234, 179, 8, 0.8)'
              : 'rgba(239, 68, 68, 0.5)',
            boxShadow: isCalibrated
              ? '0 0 35px rgba(34, 197, 94, 0.4)'
              : isPositioned
              ? '0 0 25px rgba(234, 179, 8, 0.2)'
              : '0 0 20px rgba(239, 68, 68, 0.15)',
          }}
        >
          {/* Batter Outline */}
          <svg
            viewBox="0 0 200 320"
            className="w-40 h-64"
            style={{
              fill: isCalibrated
                ? 'rgba(34, 197, 94, 0.18)'
                : isPositioned
                ? 'rgba(234, 179, 8, 0.12)'
                : 'rgba(239, 68, 68, 0.08)',
              stroke: isCalibrated ? '#4ade80' : isPositioned ? '#facc15' : '#ef4444',
              strokeWidth: 2,
            }}
          >
            <circle cx="100" cy="45" r="24" />
            <path d="M72 80 L128 80 L120 180 L80 180 Z" />
            <path d="M72 80 L52 130 L90 155" fill="none" strokeWidth="3" />
            <path d="M128 80 L148 130 L105 155" fill="none" strokeWidth="3" />
            <rect x="94" y="150" width="12" height="60" rx="3" />
            <path d="M85 180 L80 280 M115 180 L120 280" strokeWidth="3" />
          </svg>

          {/* Top Pill on Frame */}
          <div className="absolute -top-3.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-display font-bold uppercase tracking-wider text-white">
            {isCalibrated ? '✓ Batter Locked' : 'Crease Alignment'}
          </div>

          {/* Re-Calibrating meter */}
          {isPositioned && !isCalibrated && (
            <div className="absolute bottom-3 inset-x-3 flex flex-col items-center gap-1 bg-slate-950/90 py-2 px-3 rounded-xl border border-yellow-400/40">
              <span className="text-[10px] font-display font-bold uppercase text-yellow-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" />
                Calibrating... {Math.round(progress)}%
              </span>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Done Banner */}
          {isCalibrated && (
            <div className="absolute bottom-3 inset-x-3 flex flex-col items-center py-2 px-3 rounded-xl bg-emerald-950 border border-emerald-400 glow-neon">
              <span className="text-[11px] font-display font-black uppercase text-emerald-300">
                CALIBRATION DONE ✓
              </span>
              <span className="text-[9px] text-emerald-200">Resuming match...</span>
            </div>
          )}
        </div>

        {/* Status Callout Card */}
        <div
          className={`mt-4 px-4 py-2.5 rounded-xl border flex items-center gap-2 max-w-xs ${
            isCalibrated
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 glow-neon'
              : isPositioned
              ? 'bg-yellow-950/80 border-yellow-500 text-yellow-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300'
          }`}
        >
          {isCalibrated ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <UserCheck className="w-4 h-4 shrink-0" />
          )}
          <span className="text-xs font-display font-bold tracking-wide">
            {isCalibrated
              ? 'CALIBRATION DONE ✓'
              : isPositioned
              ? 'HOLD STANCE TO RESUME...'
              : 'CALIBRATION NOT DONE: STEP INTO FRAME'}
          </span>
        </div>
      </div>

      {/* Bottom Manual Resume */}
      <div className="flex flex-col gap-2 pb-2">
        <button
          onClick={() => {
            sounds.playButtonClick();
            onResume();
          }}
          className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          Resume Match Now
        </button>
      </div>
    </motion.div>
  );
};
