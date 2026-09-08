import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Play, Gauge, ShieldCheck } from 'lucide-react';
import { DetectedPose } from '../../types';
import { sounds } from '../../utils/audio';

interface PoseDetectionScreenProps {
  pose: DetectedPose | null;
  onProceed: () => void;
  onSimulateSwing?: () => void;
  onBack: () => void;
}

export const PoseDetectionScreen: React.FC<PoseDetectionScreenProps> = ({
  pose,
  onProceed,
  onSimulateSwing,
  onBack,
}) => {
  const isReady = pose?.ready ?? false;
  const swingDetected = pose?.swingDetected ?? false;
  const swingSpeed = pose?.swingSpeed ?? 0;
  const speedKph = Math.round(swingSpeed * 65 + 60);

  // Auto-start timer when stance is ready
  const [lockCountdown, setLockCountdown] = useState<number>(100);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isReady) {
      interval = setInterval(() => {
        setLockCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            sounds.playCountdownBeep(true);
            onProceed();
            return 0;
          }
          return prev - 12; // fills down in approx 1.0s
        });
      }, 80);
    } else {
      setLockCountdown(100);
    }

    return () => clearInterval(interval);
  }, [isReady, onProceed]);

  // If a practice swing is taken during pose check, start immediately!
  useEffect(() => {
    if (swingDetected) {
      sounds.playCountdownBeep(true);
      const timer = setTimeout(() => {
        onProceed();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [swingDetected, onProceed]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 z-30 overflow-hidden pointer-events-none">
      {/* Top Header */}
      <div className="flex justify-between items-center pointer-events-auto">
        <button
          onClick={onBack}
          className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 backdrop-blur"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur shadow-lg">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isReady ? 'bg-emerald-400 shadow-[0_0_10px_#4ade80]' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span
            className={`text-xs font-display font-bold uppercase tracking-wider ${
              isReady ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isReady ? '✓ Batter Locked In' : 'Acquiring Batter Stance...'}
          </span>
        </div>
      </div>

      {/* Center Feedback */}
      <div className="my-auto flex flex-col items-center text-center">
        {/* Auto Start Indicator Callout */}
        {isReady && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-3xl bg-slate-950/90 border-2 border-emerald-500/80 shadow-[0_0_40px_rgba(34,197,94,0.4)] backdrop-blur-md"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-display font-black text-lg uppercase tracking-wider">
              <Sparkles className="w-5 h-5 animate-spin" />
              BATTER DETECTED!
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Match starting automatically in{' '}
              <span className="text-emerald-300 font-bold font-display text-sm">
                {(lockCountdown / 100).toFixed(1)}s
              </span>
            </div>
            {/* Countdown Fill Bar */}
            <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-emerald-500/30">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-300 transition-all duration-75"
                style={{ width: `${100 - lockCountdown}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Practice Swing Detected */}
        {swingDetected && !isReady && (
          <motion.div
            initial={{ scale: 0.8, y: -20, opacity: 0 }}
            animate={{ scale: 1.05, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-display font-extrabold text-sm uppercase tracking-wider glow-gold flex items-center gap-2 shadow-2xl"
          >
            <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
            <span>Practice Swing: {speedKph} km/h!</span>
          </motion.div>
        )}

        {/* Status Callout if still positioning */}
        {!isReady && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md max-w-xs">
            <span className="text-amber-300 flex items-center justify-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" /> Hold batting stance with wrists visible
            </span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-col gap-3 pointer-events-auto max-w-sm w-full mx-auto pb-4">
        {/* Test Swing Fallback Button */}
        {onSimulateSwing && (
          <button
            onClick={() => {
              sounds.playBatCrack('PERFECT');
              onSimulateSwing();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-display text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Test Batting Swing
          </button>
        )}

        <button
          id="ready-play-btn"
          onClick={() => {
            sounds.playCountdownBeep(true);
            onProceed();
          }}
          className={`w-full py-4 px-8 rounded-2xl font-display font-bold text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl ${
            isReady
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-slate-950 glow-neon hover:brightness-110'
              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 glow-gold hover:brightness-105'
          }`}
        >
          <Play className="w-5 h-5 fill-slate-950" />
          {isReady ? 'START MATCH NOW' : 'START ANYWAY'}
        </button>
      </div>
    </div>
  );
};

