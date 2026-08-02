'use client';

import { useEffect, useRef } from 'react';

// A canvas loom. Warp threads fall, weft threads cross, and the crossings glow
// briefly as they bind. Cheap enough to run behind the hero without costing
// scroll performance, and it stops entirely when the tab is hidden or the
// visitor has asked for reduced motion.
export default function Loom() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const SPACING = 34;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // warp: vertical strands, each drifting at its own rate
      const cols = Math.ceil(w / SPACING) + 1;
      for (let i = 0; i < cols; i += 1) {
        const x = i * SPACING;
        const phase = (t * (0.18 + (i % 5) * 0.035) + i * 0.21) % 1;
        const grad = ctx.createLinearGradient(x, 0, x, h);
        grad.addColorStop(0, 'rgba(124,92,255,0)');
        grad.addColorStop(Math.max(0.02, phase), 'rgba(124,92,255,0.42)');
        grad.addColorStop(Math.min(0.98, phase + 0.14), 'rgba(34,211,238,0.10)');
        grad.addColorStop(1, 'rgba(124,92,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = i % 4 === 0 ? 1.4 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // weft: horizontal passes sweeping across, binding the warp
      const rows = Math.ceil(h / SPACING) + 1;
      for (let j = 0; j < rows; j += 1) {
        const y = j * SPACING;
        const sweep = ((t * 0.14 + j * 0.08) % 1.4) - 0.2;
        const cx = sweep * w;
        const grad = ctx.createLinearGradient(cx - 260, y, cx + 260, y);
        grad.addColorStop(0, 'rgba(34,211,238,0)');
        grad.addColorStop(0.5, 'rgba(34,211,238,0.20)');
        grad.addColorStop(1, 'rgba(34,211,238,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // the binding point: where this pass currently crosses a warp thread
        const nearest = Math.round(cx / SPACING) * SPACING;
        if (nearest >= 0 && nearest <= w) {
          ctx.fillStyle = 'rgba(232,234,242,0.55)';
          ctx.beginPath();
          ctx.arc(nearest, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70 [mask-image:radial-gradient(120%_80%_at_50%_0%,#000_25%,transparent_78%)]"
    />
  );
}
