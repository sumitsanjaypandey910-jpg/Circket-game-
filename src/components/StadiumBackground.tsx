import React from 'react';

export const StadiumBackground: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-950"
      style={{ opacity }}
    >
      {/* Stadium Night Atmosphere Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070e24] via-[#09153a] to-[#04091a]" />

      {/* 4 Massive Stadium Floodlight Beams */}
      {/* Top Left Floodlight */}
      <div className="absolute -top-10 -left-10 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute top-4 left-6 flex flex-col items-center opacity-70">
        <div className="w-12 h-6 bg-slate-800 rounded border border-cyan-400/40 grid grid-cols-4 gap-1 p-1">
          <div className="bg-cyan-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#38bdf8]" />
          <div className="bg-cyan-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#38bdf8]" />
          <div className="bg-cyan-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#38bdf8]" />
          <div className="bg-cyan-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#38bdf8]" />
        </div>
        <div className="w-1 h-20 bg-slate-700/80" />
      </div>

      {/* Top Right Floodlight */}
      <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute top-4 right-6 flex flex-col items-center opacity-70">
        <div className="w-12 h-6 bg-slate-800 rounded border border-blue-400/40 grid grid-cols-4 gap-1 p-1">
          <div className="bg-blue-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#60a5fa]" />
          <div className="bg-blue-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#60a5fa]" />
          <div className="bg-blue-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#60a5fa]" />
          <div className="bg-blue-200 rounded-full w-1.5 h-1.5 shadow-[0_0_8px_#60a5fa]" />
        </div>
        <div className="w-1 h-20 bg-slate-700/80" />
      </div>

      {/* Light Cones shining down toward the pitch */}
      <div
        className="absolute top-0 left-8 w-[240px] h-[500px] origin-top-left -rotate-12 bg-gradient-to-b from-white/10 via-cyan-300/5 to-transparent blur-md pointer-events-none"
      />
      <div
        className="absolute top-0 right-8 w-[240px] h-[500px] origin-top-right rotate-12 bg-gradient-to-b from-white/10 via-blue-300/5 to-transparent blur-md pointer-events-none"
      />

      {/* Grandstands Silhouette */}
      <div className="absolute bottom-28 inset-x-0 h-28 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end justify-center">
        {/* Crowd flashlights / stadium dots */}
        <div className="w-full h-12 flex justify-around items-center opacity-30 px-4 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-white rounded-full animate-pulse"
              style={{ animationDelay: `${(i * 137) % 2000}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Outfield Turf Texture at Bottom */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#092218] via-[#0b291d]/80 to-transparent" />
    </div>
  );
};
