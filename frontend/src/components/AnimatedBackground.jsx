import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      time += 0.002;
      const w = canvas.width;
      const h = canvas.height;

      const gradient = ctx.createRadialGradient(
        w * 0.3 + Math.sin(time * 0.7) * w * 0.15,
        h * 0.4 + Math.cos(time * 0.5) * h * 0.1,
        w * 0.05,
        w * 0.6 + Math.cos(time * 0.6) * w * 0.1,
        h * 0.5 + Math.sin(time * 0.8) * h * 0.1,
        w * 0.7,
      );
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
      gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.03)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
