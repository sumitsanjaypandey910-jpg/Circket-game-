import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../utils/audio';

interface CountdownScreenProps {
  onComplete: () => void;
}

export const CountdownScreen: React.FC<CountdownScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number>(3);
  const [displayText, setDisplayText] = useState<string>('3');

  useEffect(() => {
    sounds.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      setDisplayText('2');
      sounds.playCountdownBeep(false);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      setDisplayText('1');
      sounds.playCountdownBeep(false);
    }, 2000);

    const timer3 = setTimeout(() => {
      setCount(0);
      setDisplayText('PLAY!');
      sounds.playCountdownBeep(true);
    }, 3000);

    const timerFinal = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFinal);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none overflow-hidden bg-slate-950/40 backdrop-blur-[2px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayText}
          initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
          animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <span
            className={`font-display font-black text-8xl sm:text-9xl tracking-tighter drop-shadow-2xl ${
              displayText === 'PLAY!'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-500 glow-text-neon'
                : 'text-amber-400 glow-text-gold'
            }`}
          >
            {displayText}
          </span>
          <span className="text-sm font-display uppercase tracking-widest text-slate-300 font-bold mt-2">
            {displayText === 'PLAY!' ? 'Bowler is charging in!' : 'Take your batting stance'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
