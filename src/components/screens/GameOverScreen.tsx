import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { MatchStats } from '../../types';
import { StadiumBackground } from '../StadiumBackground';
import { sounds } from '../../utils/audio';

interface GameOverScreenProps {
  stats: MatchStats;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onPlayAgain,
  onGoHome,
}) => {
  const isNewRecord = stats.runs > 0 && stats.runs >= stats.highScore;
  const strikeRate =
    stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    if (isNewRecord) {
      sounds.playCrowdCheer('SIX');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } else {
      sounds.playCountdownBeep(true);
    }
  }, [isNewRecord]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 z-30 overflow-hidden">
      <StadiumBackground />

      {/* Header Banner */}
      <div className="relative z-20 flex justify-center pt-2">
        <div className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-display font-bold text-xs uppercase tracking-widest backdrop-blur-md">
          Innings Complete • All Out
        </div>
      </div>

      {/* Main Scorecard Spotlight */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-20 my-auto flex flex-col items-center text-center max-w-sm w-full mx-auto"
      >
        {/* New Record Badge */}
        {isNewRecord && (
          <div className="mb-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-display font-black text-xs uppercase tracking-wider glow-gold flex items-center gap-1.5 shadow-lg animate-bounce">
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>NEW ALL-TIME RECORD!</span>
          </div>
        )}

        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">
          Match Summary
        </h1>
        <p className="text-xs text-slate-400 mt-1">Outstanding motion batting performance</p>

        {/* Final Score Circle / Card */}
        <div className="w-full mt-5 p-6 rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">
            FINAL SCORE
          </span>
          <div className="font-display font-black text-6xl text-white mt-1">
            {stats.runs}
            <span className="text-2xl text-red-400 font-bold ml-1.5">/{stats.wickets}</span>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-800 text-center">
            <div>
              <span className="text-[10px] font-display font-semibold text-slate-400 block uppercase">
                BALLS
              </span>
              <span className="font-display font-bold text-lg text-white mt-0.5 block">
                {stats.ballsFaced}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-display font-semibold text-slate-400 block uppercase">
                S/R
              </span>
              <span className="font-display font-bold text-lg text-emerald-400 mt-0.5 block">
                {strikeRate}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-display font-semibold text-slate-400 block uppercase">
                BOUNDARIES
              </span>
              <span className="font-display font-bold text-lg text-amber-400 mt-0.5 block">
                {stats.fours + stats.sixes}
              </span>
            </div>
          </div>
        </div>

        {/* All-time High Score Box */}
        <div className="mt-3 w-full px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-display font-bold text-amber-300 uppercase tracking-wider">
              HIGH SCORE BENCHMARK
            </span>
          </div>
          <span className="font-display font-black text-lg text-amber-400">
            {Math.max(stats.runs, stats.highScore)} RUNS
          </span>
        </div>
      </motion.div>

      {/* Bottom Action Controls */}
      <div className="relative z-20 flex flex-col gap-3 max-w-sm w-full mx-auto pb-4">
        <button
          id="play-again-btn"
          onClick={() => {
            sounds.playButtonClick();
            onPlayAgain();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-display font-bold text-base uppercase tracking-wider glow-neon active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xl"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>

        <button
          id="return-home-btn"
          onClick={() => {
            sounds.playButtonClick();
            onGoHome();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 font-display font-semibold text-sm uppercase tracking-wider hover:border-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to Stadium
        </button>
      </div>
    </div>
  );
};
