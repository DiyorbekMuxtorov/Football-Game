import React, { useEffect, useRef } from 'react';
import { drawCharacter, drawCharacterPortrait } from '../game/renderer';
import { CharacterDef, CharacterExpression } from '../game/types';

interface CharacterAvatarProps {
  character: CharacterDef;
  size?: number;
  expression?: CharacterExpression;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  character,
  size = 96,
  expression = 'normal',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    drawCharacterPortrait(ctx, character, size, size, expression);
    ctx.restore();
  }, [character, size, expression]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`block ${className}`}
    />
  );
};

interface AnimatedCharacterCanvasProps {
  character: CharacterDef;
  facing?: 1 | -1;
  expression?: CharacterExpression;
  scale?: number;
  width?: number;
  height?: number;
  className?: string;
}

export const AnimatedCharacterCanvas: React.FC<AnimatedCharacterCanvasProps> = ({
  character,
  facing = 1,
  expression = 'normal',
  scale = 1.9,
  width = 240,
  height = 290,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.fillStyle = 'rgba(6, 40, 24, 0.42)';
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 20, 44, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      drawCharacter(ctx, character, {
        x: width / 2,
        y: height - 22,
        facing,
        scale,
        expression,
        celebratePhase: t,
        time: t,
      });
      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [character, facing, expression, scale, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`block pointer-events-none ${className}`}
    />
  );
};
