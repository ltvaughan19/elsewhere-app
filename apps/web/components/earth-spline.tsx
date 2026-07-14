"use client";

import { useEffect, useRef, useState } from "react";
import { Application } from "@splinetool/runtime";
import { GlobeHero } from "@/components/globe-hero";

/** Locked visual source of truth — do not replace scene URL. */
export const SPLINE_SCENE_URL =
  "https://prod.spline.design/Lnx4uENq006e5zkU/scene.splinecode";

type EarthSplineProps = {
  className?: string;
  /** Full-bleed fixed marketing background */
  fill?: boolean;
};

/**
 * Spline Earth — marketing hero + inline product use.
 * Respects prefers-reduced-motion. Does not rematerialize Earth textures.
 */
export function EarthSpline({ className, fill = false }: EarthSplineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || failed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let app: Application | null = null;
    let raf = 0;

    const boot = async () => {
      try {
        app = new Application(canvas);
        await app.load(SPLINE_SCENE_URL);
        if (disposed) {
          app.dispose();
          return;
        }
        setReady(true);

        const tick = () => {
          if (disposed || !app) return;
          try {
            const earth =
              app.findObjectByName("Earth") ??
              app.findObjectByName("earth") ??
              app.findObjectByName("Sphere");
            if (earth && "rotation" in earth) {
              const rot = earth.rotation as { y: number };
              rot.y += 0.0012;
            }
          } catch {
            /* scene object names vary */
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        console.warn("[Elsewhere] Spline Earth failed to load", err);
        if (!disposed) setFailed(true);
      }
    };

    void boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      try {
        app?.dispose();
      } catch {
        /* ignore */
      }
    };
  }, [reducedMotion, failed]);

  if (reducedMotion || failed) {
    return (
      <div className={className}>
        <GlobeHero />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ""}`}>
      {!ready ? (
        <p className="absolute inset-0 z-10 flex items-center justify-center text-xs text-[#f4f1ea]/55">
          Loading Earth…
        </p>
      ) : null}
      <canvas
        ref={canvasRef}
        className={
          fill
            ? "h-full w-full"
            : "h-full min-h-[280px] w-full md:min-h-[420px]"
        }
        aria-hidden
      />
    </div>
  );
}
