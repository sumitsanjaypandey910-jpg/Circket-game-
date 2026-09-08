import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, AlertOctagon, CheckCircle, ArrowRight } from 'lucide-react';
import { ShotResult } from '../../types';
import { sounds } from '../../utils/audio';

interface ShotResultOverlayProps {
  result: ShotResult;
  onNextBall: () => void;
}

export const ShotResultOverlay: React.FC<ShotResultOverlayProps> = ({
  result,
  onNextBall,
}) => {
  const isSix = result.type === 'SIX';
  const isFour = result.type === 'FOUR';
  const isOut = result.type === 'OUT';
  const isBoundary = isSix || isFour;

  useEffect(() => {
    // Play sounds & fireworks/confetti
    if (isSix) {
      sounds.playCrowdCheer('SIX');
      // Confetti blast
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ffffff', '#38bdf8'],
      });
    } else if (isFour) {
      sounds.playCrowdCheer('FOUR');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#ffffff'],
      });
    } else if (isOut) {
      sounds.playWicketClatter();
    }

    // Auto-advance after 2.4 seconds
    const timer = setTimeout(() => {
      onNextBall();
    }, 2400);

    return () => clearTimeout(timer);
  }, [result.id, isSix, isFour, isOut, onNextBall]);

  return (
    <div
      onClick={onNextBall}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.4, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
        className="flex flex-col items-center text-center max-w-sm w-full"
      >
        {/* Main Result Big Banner */}
        <div className="relative mb-3">
          {isSix && (
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-7xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 glow-text-gold tracking-tight">
                SIX!
              </span>
              <div className="mt-1 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-display font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Distance: {result.distanceMeters}m
              </div>
            </div>
          )}

          {isFour && (
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-7xl sm:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 glow-text-neon tracking-tight">
                FOUR!
              </span>
              <div className="mt-1 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-display font-bold uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Boundary Pierced
              </div>
            </div>
          )}

          {isOut && (
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-7xl sm:text-8xl text-red-500 glow-text-red tracking-tight">
                OUT!
              </span>
              <div className="mt-1 px-4 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-display font-bold uppercase tracking-widest flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                Wicket Fallen!
              </div>
            </div>
          )}

          {!isBoundary && !isOut && (
            <div className="flex flex-col items-center">
              <span className="font-display font-black text-6xl sm:text-7xl text-cyan-300 tracking-tight">
                {result.runs === 0 ? 'DOT BALL' : `${result.runs} RUN${result.runs > 1 ? 'S' : ''}`}
              </span>
            </div>
          )}
        </div>

        {/* Shot Name & Timing Feedback Card */}
        <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md mt-2 flex flex-col gap-2">
          <div className="text-sm font-display font-bold text-white uppercase tracking-wide">
            {result.shotName}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 border-t border-slate-800 pt-2">
            <span>Timing:</span>
            <span
              className={`font-display font-bold uppercase tracking-wider ${
                result.timing === 'PERFECT'
                  ? 'text-emerald-400'
                  : result.timing === 'EARLY' || result.timing === 'LATE'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {result.timing}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Bat Exit Speed:</span>
            <span className="font-display font-bold text-white">{result.speedKph} km/h</span>
          </div>
        </div>

        {/* Tap to continue prompt */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-display uppercase tracking-widest">
          <span>Tap anywhere to continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    </div>
  );
};
