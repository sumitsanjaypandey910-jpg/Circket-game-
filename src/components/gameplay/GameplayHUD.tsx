import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Activity, Zap, Shield, Sparkles } from 'lucide-react';
import { MatchStats, BallState, DetectedPose } from '../../types';

interface GameplayHUDProps {
  stats: MatchStats;
  ballState: BallState | null;
  bowlerStatus: string;
  pose: DetectedPose | null;
  onManualSwing?: () => void;
  onOpenScoreboard: () => void;
}

export const GameplayHUD: React.FC<GameplayHUDProps> = ({
  stats,
  ballState,
  bowlerStatus,
  pose,
  onManualSwing,
  onOpenScoreboard,
}) => {
  const overs = Math.floor(stats.ballsFaced / 6);
  const ballsInOver = stats.ballsFaced % 6;
  const swingSpeed = pose?.swingSpeed ?? 0;
  const swingPct = Math.min(100, Math.round((swingSpeed / 3.0) * 100));

  // Determine ball approaching alert
  const isBallActive = ballState?.active ?? false;
  const isBallNear = isBallActive && (ballState?.progress ?? 0) > 0.6 && (ballState?.progress ?? 0) < 1.08;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Match Header Bar */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 w-full">
        {/* Runs and Wickets Scoreboard Widget */}
        <button
          onClick={onOpenScoreboard}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md hover:border-amber-400/60 active:scale-98 transition-all"
        >
          <div className="text-left">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 block leading-none">
              SCORE
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-display font-black text-2xl sm:text-3xl text-white">
                {stats.runs}
              </span>
              <span className="font-display font-bold text-lg text-red-400">
                /{stats.wickets}
              </span>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-700 mx-0.5" />

          <div className="text-left">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 block leading-none">
              OVERS
            </span>
            <span className="font-display font-bold text-lg text-emerald-400 mt-0.5 block leading-tight">
              {overs}.{ballsInOver}
            </span>
          </div>
        </button>

        {/* High Score & Speed Badge */}
        <div className="flex items-center gap-2">
          {ballState?.active && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-display font-bold text-cyan-300">
                {ballState.speedKph} km/h
              </span>
            </motion.div>
          )}

          <button
            onClick={onOpenScoreboard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-md text-amber-300 hover:border-amber-400 transition-all"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-display font-bold">BEST: {stats.highScore}</span>
          </button>
        </div>
      </div>

      {/* Center Strike Timing & Delivery Alert */}
      <div className="my-auto flex flex-col items-center justify-center">
        {/* Ball approaching timing alert */}
        {isBallNear && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: 1 }}
            transition={{ duration: 0.35, repeat: Infinity }}
            className="px-6 py-2 rounded-full bg-red-600 text-white font-display font-black text-sm sm:text-base tracking-widest uppercase shadow-[0_0_25px_rgba(239,68,68,0.8)] border border-red-300"
          >
            ⚡ SWING NOW! ⚡
          </motion.div>
        )}

        {/* Bowler status banner */}
        {!isBallNear && bowlerStatus && (
          <div className="px-4 py-1.5 rounded-full bg-slate-950/75 border border-slate-700/60 text-slate-300 font-display text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
            {bowlerStatus}
          </div>
        )}
      </div>

      {/* Bottom HUD: Live Batting Swing Power Meter & On-screen Swing Button */}
      <div className="pointer-events-auto flex flex-col gap-2.5 max-w-md w-full mx-auto pb-2">
        {/* Swing Power Meter */}
        <div className="px-4 py-2 rounded-xl bg-slate-900/85 border border-slate-800 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${pose?.ready ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">
              Bat Velocity
            </span>
          </div>

          <div className="flex-1 max-w-[150px] h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                swingPct > 70
                  ? 'bg-gradient-to-r from-amber-400 to-red-500'
                  : 'bg-gradient-to-r from-emerald-400 to-green-500'
              }`}
              style={{ width: `${Math.max(5, swingPct)}%` }}
            />
          </div>

          <span className="text-xs font-display font-bold text-white min-w-[36px] text-right">
            {Math.round(swingSpeed * 60 + 60)}kph
          </span>
        </div>

        {/* Manual Swing Action Button (supports one-touch swing or accessibility) */}
        {onManualSwing && (
          <button
            id="manual-bat-swing-btn"
            onClick={onManualSwing}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 active:scale-98 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg glow-gold flex items-center justify-center gap-2 hover:brightness-105"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Tap to Swing Bat</span>
          </button>
        )}
      </div>
    </div>
  );
};
