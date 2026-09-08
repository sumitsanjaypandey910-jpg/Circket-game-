import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Target, Sparkles, Activity, Clock } from 'lucide-react';
import { MatchStats } from '../../types';
import { sounds } from '../../utils/audio';

interface ScoreboardModalProps {
  stats: MatchStats;
  onClose: () => void;
  onRestart?: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  stats,
  onClose,
  onRestart,
}) => {
  const strikeRate =
    stats.ballsFaced > 0 ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1) : '0.0';
  const overs = Math.floor(stats.ballsFaced / 6);
  const ballsInOver = stats.ballsFaced % 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-white">
              Match Scorecard
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Totals Banner */}
        <div className="py-4 flex items-center justify-around bg-slate-950/60 rounded-2xl border border-slate-800 my-4">
          <div className="text-center">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
              TOTAL RUNS
            </span>
            <div className="font-display font-black text-4xl text-white mt-1">
              {stats.runs}
              <span className="text-xl text-red-400 font-bold ml-1">/{stats.wickets}</span>
            </div>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          <div className="text-center">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
              OVERS
            </span>
            <div className="font-display font-black text-3xl text-emerald-400 mt-1">
              {overs}.{ballsInOver}
            </div>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          <div className="text-center">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
              STRIKE RATE
            </span>
            <div className="font-display font-black text-3xl text-cyan-400 mt-1">
              {strikeRate}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase block">
              FOURS (4s)
            </span>
            <span className="font-display font-black text-2xl text-emerald-400 mt-0.5 block">
              {stats.fours}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase block">
              SIXES (6s)
            </span>
            <span className="font-display font-black text-2xl text-amber-400 mt-0.5 block">
              {stats.sixes}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-[10px] font-display font-bold text-slate-400 uppercase block">
              HIGH SCORE
            </span>
            <span className="font-display font-black text-2xl text-yellow-300 mt-0.5 block">
              {stats.highScore}
            </span>
          </div>
        </div>

        {/* Ball-by-ball Shot History Log */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[140px]">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Shot History (Recent Balls)
          </span>

          {stats.history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No deliveries faced yet. Start batting!
            </div>
          ) : (
            stats.history.slice(-8).reverse().map((shot, idx) => (
              <div
                key={shot.id || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs ${
                      shot.type === 'SIX'
                        ? 'bg-amber-500 text-slate-950 glow-gold'
                        : shot.type === 'FOUR'
                        ? 'bg-emerald-500 text-slate-950'
                        : shot.type === 'OUT'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {shot.type === 'OUT' ? 'W' : shot.runs}
                  </span>
                  <div>
                    <div className="font-semibold text-white">{shot.shotName}</div>
                    <div className="text-[10px] text-slate-400">Timing: {shot.timing}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-bold text-slate-300">{shot.speedKph} kph</div>
                  {shot.distanceMeters > 0 && (
                    <div className="text-[10px] text-amber-400">{shot.distanceMeters}m</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-auto border-t border-slate-800 flex gap-2.5">
          <button
            onClick={() => {
              sounds.playButtonClick();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm uppercase tracking-wider transition-all"
          >
            Resume Match
          </button>
        </div>
      </motion.div>
    </div>
  );
};
