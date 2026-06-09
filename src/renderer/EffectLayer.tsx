import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";
import type { FluxTermTypingEffect } from "../shared/config/config-types";

export interface EffectLayerHandle {
  triggerTypingEffect(origin: { x: number; y: number }): void;
}

interface EffectLayerProps {
  typingEffect: FluxTermTypingEffect;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const sparkColors = ["#fbbf24", "#f472b6", "#67e8f9", "#a7f3d0"];

export const EffectLayer = forwardRef<EffectLayerHandle, EffectLayerProps>(
  function EffectLayer({ typingEffect }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        triggerTypingEffect(origin) {
          if (typingEffect !== "spark") {
            return;
          }

          particlesRef.current.push(...createSparkParticles(origin));
          startAnimation();
        }
      }),
      [typingEffect]
    );

    useEffect(() => {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
        canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      };

      resizeCanvas();

      const resizeObserver = new ResizeObserver(resizeCanvas);
      resizeObserver.observe(canvas);

      return () => {
        resizeObserver.disconnect();

        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    function startAnimation(): void {
      if (animationFrameRef.current !== null) {
        return;
      }

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    }

    function drawFrame(): void {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (!canvas || !context) {
        animationFrameRef.current = null;
        return;
      }

      const pixelRatio = window.devicePixelRatio || 1;
      context.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.035,
          life: particle.life - 1
        }))
        .filter((particle) => particle.life > 0);

      for (const particle of particlesRef.current) {
        const alpha = particle.life / particle.maxLife;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(
          particle.x * pixelRatio,
          particle.y * pixelRatio,
          particle.size * pixelRatio,
          0,
          Math.PI * 2
        );
        context.fill();
      }

      context.globalAlpha = 1;

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      } else {
        animationFrameRef.current = null;
      }
    }

    return <canvas ref={canvasRef} className="effect-layer" />;
  }
);

function createSparkParticles(origin: { x: number; y: number }): Particle[] {
  return Array.from({ length: 7 }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
    const speed = 1.4 + Math.random() * 1.8;

    return {
      x: origin.x + Math.random() * 8,
      y: origin.y + Math.random() * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 18 + Math.floor(Math.random() * 10),
      maxLife: 28,
      size: 1.4 + Math.random() * 2,
      color: sparkColors[index % sparkColors.length]
    };
  });
}
