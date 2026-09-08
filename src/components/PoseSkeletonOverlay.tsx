import React, { useEffect, useRef } from 'react';
import { DetectedPose } from '../types';

interface PoseSkeletonOverlayProps {
  pose: DetectedPose | null;
  width?: number;
  height?: number;
  showHitZone?: boolean;
  highlightSwing?: boolean;
}

export const PoseSkeletonOverlay: React.FC<PoseSkeletonOverlayProps> = ({
  pose,
  showHitZone = true,
  highlightSwing = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas resolution to parent size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw batting strike zone target box
    if (showHitZone) {
      const boxW = w * 0.52;
      const boxH = h * 0.44;
      const boxX = (w - boxW) / 2;
      const boxY = h * 0.38;

      ctx.save();
      ctx.strokeStyle = pose?.ready ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Strike zone corners
      const cornerLen = 18;
      ctx.setLineDash([]);
      ctx.strokeStyle = pose?.ready ? '#22c55e' : '#eab308';
      ctx.lineWidth = 3;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cornerLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cornerLen, boxY);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + cornerLen);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - cornerLen);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + cornerLen, boxY + boxH);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cornerLen, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - cornerLen);
      ctx.stroke();

      // Strike zone label
      ctx.font = '600 11px Chakra Petch, sans-serif';
      ctx.fillStyle = pose?.ready ? '#4ade80' : '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText(
        pose?.ready ? 'BATTING CREASE • READY' : 'CALIBRATING BATTING ZONE',
        w / 2,
        boxY - 8
      );
      ctx.restore();
    }

    if (!pose || !pose.leftShoulder || !pose.rightShoulder) {
      return;
    }

    // Colors
    const isReady = pose.ready;
    const isSwinging = pose.swingDetected;
    const strokeColor = isSwinging
      ? '#facc15' // Gold flash on swing!
      : isReady
      ? '#22c55e' // Glowing neon green when ready
      : '#38bdf8'; // Cyan when positioning

    const glowColor = isSwinging
      ? 'rgba(250, 204, 21, 0.9)'
      : isReady
      ? 'rgba(34, 197, 94, 0.8)'
      : 'rgba(56, 189, 248, 0.7)';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isSwinging ? 25 : isReady ? 16 : 10;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSwinging ? 6 : 4;

    // Helper to mirror X if needed (front camera is mirrored)
    const toPx = (lm?: { x: number; y: number }) => {
      if (!lm) return null;
      return {
        // Mirrored coordinate for natural front camera preview
        x: (1 - lm.x) * w,
        y: lm.y * h,
      };
    };

    const ls = toPx(pose.leftShoulder);
    const rs = toPx(pose.rightShoulder);
    const le = toPx(pose.leftElbow);
    const re = toPx(pose.rightElbow);
    const lw = toPx(pose.leftWrist);
    const rw = toPx(pose.rightWrist);
    const lh = toPx(pose.leftHip);
    const rh = toPx(pose.rightHip);

    const drawBone = (p1: { x: number; y: number } | null, p2: { x: number; y: number } | null) => {
      if (!p1 || !p2) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    };

    // Draw Skeleton Bones
    // Shoulders
    drawBone(ls, rs);
    // Left Arm
    drawBone(ls, le);
    drawBone(le, lw);
    // Right Arm
    drawBone(rs, re);
    drawBone(re, rw);
    // Torso / Spine
    drawBone(ls, lh);
    drawBone(rs, rh);
    drawBone(lh, rh);

    // Draw Joint Nodes
    const drawJoint = (
      p: { x: number; y: number } | null,
      radius: number,
      isWrist: boolean = false
    ) => {
      if (!p) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isWrist ? (isSwinging ? '#fbbf24' : '#4ade80') : '#ffffff';
      ctx.fill();

      // Outer ripple ring for wrists (bat handle grip)
      if (isWrist) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * (isSwinging ? 2.4 : 1.8), 0, Math.PI * 2);
        ctx.strokeStyle = isSwinging ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    };

    drawJoint(ls, 5);
    drawJoint(rs, 5);
    drawJoint(le, 5);
    drawJoint(re, 5);
    drawJoint(lh, 4);
    drawJoint(rh, 4);
    // Highlight wrists as cricket bat grip
    drawJoint(lw, 8, true);
    drawJoint(rw, 8, true);

    // Bat Grip Line connecting both wrists
    if (lw && rw) {
      ctx.beginPath();
      ctx.moveTo(lw.x, lw.y);
      ctx.lineTo(rw.x, rw.y);
      ctx.strokeStyle = isSwinging ? '#f59e0b' : '#22c55e';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Virtual Bat Blade projection vector pointing downwards/backlift
      const midX = (lw.x + rw.x) / 2;
      const midY = (lw.y + rw.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      // Project bat handle to blade
      ctx.lineTo(midX + 8, midY + 45);
      ctx.strokeStyle = '#d97706'; // English willow wood tone
      ctx.lineWidth = 7;
      ctx.stroke();
    }

    ctx.restore();
  }, [pose, showHitZone, highlightSwing]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
};
