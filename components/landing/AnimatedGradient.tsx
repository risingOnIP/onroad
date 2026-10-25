"use client";

import { useEffect, useRef } from "react";

export default function AnimatedGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    let time = 0;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener('resize', resize);
    
    const animate = () => {
      time += 0.002;
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Animated gradient colors
      const color1 = `hsla(${220 + Math.sin(time) * 20}, 70%, 10%, 1)`;
      const color2 = `hsla(${200 + Math.sin(time * 1.1) * 20}, 60%, 15%, 0.8)`;
      const color3 = `hsla(${180 + Math.sin(time * 0.9) * 20}, 50%, 20%, 0.6)`;
      
      gradient.addColorStop(0, color1);
      gradient.addColorStop(0.5, color2);
      gradient.addColorStop(1, color3);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw animated shapes
      ctx.save();
      
      for (let i = 0; i < 5; i++) {
        const x = (canvas.width / 6) * (i + 1);
        const y = canvas.height / 2 + Math.sin(time + i) * 50;
        const radius = 30 + Math.sin(time * 0.5 + i) * 10;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${200 + i * 20}, 70%, 50%, 0.1)`;
        ctx.fill();
        
        // Glowing effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        glowGradient.addColorStop(0, `hsla(${200 + i * 20}, 70%, 50%, 0.3)`);
        glowGradient.addColorStop(1, `hsla(${200 + i * 20}, 70%, 50%, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      
      ctx.restore();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}