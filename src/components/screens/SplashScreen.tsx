import React from 'react';
import { motion } from 'motion/react';
import { Play, Camera, ShieldCheck, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { StadiumBackground } from '../StadiumBackground';
import { sounds } from '../../utils/audio';

interface SplashScreenProps {
  onStart: () => void;
  onCalibrate: () => void;
  highScore: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onStart,
  onCalibrate,
  highScore,
}) => {
  const [isMuted, setIsMuted] = React.useState(sounds.getMuted());

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    sounds.playButtonClick();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 overflow-hidden z-20">
      <StadiumBackground />

      {/* Top Header Bar */}
      <div className="relative z-20 flex justify-between items-center w-full pt-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 backdrop-blur-md">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold tracking-wider text-amber-300 font-display">
            BEST: {highScore} RUNS
          </span>
        </div>

        <button
          id="toggle-sound-btn"
          onClick={handleMuteToggle}
          className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all active:scale-95"
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Hero Title & Cricket Stadium Emblem */}
      <div className="relative z-20 flex flex-col items-center text-center my-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mb-6"
        >
          {/* Glowing Ball Graphic */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-red-800 via-red-600 to-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] flex items-center justify-center border-2 border-red-300/40 relative">
            {/* Seam line */}
            <div className="absolute inset-0 rounded-full border-2 border-white/70 border-dashed animate-spin" style={{ animationDuration: '14s' }} />
            {/* Gold Crown / Willow Icon */}
            <Sparkles className="w-12 h-12 text-amber-300 animate-pulse" />
          </div>
          {/* Stadium floodlight glare accent */}
          <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl -z-10 rounded-full" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="inline-block px-3 py-1 mb-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] font-semibold tracking-widest text-amber-400 uppercase font-display">
            Night Stadium Edition
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display uppercase drop-shadow-md">
            Shadow <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400">Cricket</span> Lite
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-xs font-medium">
            Step in front of your camera. Play real batting shots with your body movement.
          </p>
        </motion.div>

        {/* Core Specs Pills */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mt-5 text-[11px] text-slate-300"
        >
          <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-emerald-400" /> AI Pose Tracking
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 100% Offline & Private
          </span>
        </motion.div>
      </div>

      {/* Bottom Action Controls */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative z-20 flex flex-col gap-3 w-full max-w-sm mx-auto pb-4"
      >
        <button
          id="play-match-btn"
          onClick={() => {
            sounds.playButtonClick();
            onStart();
          }}
          className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-slate-950 font-display font-bold text-lg uppercase tracking-wider glow-neon hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          Start Match
        </button>

        <button
          id="camera-setup-btn"
          onClick={() => {
            sounds.playButtonClick();
            onCalibrate();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-400 font-display font-semibold text-sm uppercase tracking-wider hover:border-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          Camera Setup & Pose Calibration
        </button>
      </motion.div>
    </div>
  );
};
