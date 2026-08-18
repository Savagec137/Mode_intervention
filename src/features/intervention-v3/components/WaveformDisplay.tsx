// WaveformDisplay.tsx — Animated plethysmographic waveform.
// Only renders when the spo2 probe is active and signal quality permits.

import { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  available: boolean;
  heartRate: number | null;
  signalQuality: 'good' | 'fair' | 'poor' | 'lost';
}

export function WaveformDisplay({ available, heartRate, signalQuality }: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !available) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const drawWave = () => {
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = 'rgba(36, 221, 210, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Waveform
      const hr = heartRate ?? 80;
      const beatInterval = (60 / hr) * 30; // pixels per beat
      const phase = phaseRef.current;

      let color = '#3ce6c4';
      let alpha = 0.9;
      if (signalQuality === 'fair') {
        color = '#a3e635';
        alpha = 0.7;
      } else if (signalQuality === 'poor') {
        color = '#fb923c';
        alpha = 0.5;
      }

      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < width; x++) {
        const localPhase = ((x + phase) % beatInterval) / beatInterval;
        let y = height / 2;

        if (localPhase < 0.1) {
          // systolic upstroke
          y = height / 2 - Math.sin(localPhase * Math.PI / 0.1) * height * 0.35;
        } else if (localPhase < 0.2) {
          // dicrotic notch
          y = height / 2 - Math.sin((localPhase - 0.1) * Math.PI / 0.1) * height * 0.12;
        } else {
          // baseline
          y = height / 2 + Math.sin((localPhase - 0.2) * Math.PI * 2) * 2;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      phaseRef.current += hr / 60 * 2;
      animationRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animationRef.current);
  }, [available, heartRate, signalQuality]);

  if (!available) {
    return (
      <div className="waveform-placeholder">
        <div className="waveform-flatline" />
        <span className="waveform-text">Saturomètre non posé</span>
      </div>
    );
  }

  return (
    <div className="waveform-container">
      <canvas ref={canvasRef} width={280} height={70} className="waveform-canvas" />
      <div className="waveform-signal-badge" data-quality={signalQuality}>
        {signalQuality === 'good' && 'Signal bon'}
        {signalQuality === 'fair' && 'Signal moyen'}
        {signalQuality === 'poor' && 'Repositionner le capteur'}
        {signalQuality === 'lost' && 'Signal perdu'}
      </div>
    </div>
  );
}
