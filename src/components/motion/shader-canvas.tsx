"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const VERTEX = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

export type SetUniform = (name: string, ...values: number[]) => void;

export interface FrameInfo {
  /** Seconds since the canvas started (frozen under reduced motion). */
  time: number;
  /** Seconds since the previous frame, clamped. */
  dt: number;
  width: number;
  height: number;
  reducedMotion: boolean;
}

/**
 * A full-bleed WebGL fragment shader. It renders only while on screen and the
 * tab is visible, caps device-pixel ratio and frame rate, freezes time under
 * reduced motion, and shows `fallback` (plain CSS) until the first frame —
 * or for good, when WebGL is unavailable.
 */
export function ShaderCanvas({
  fragment,
  className,
  fallback,
  maxDpr = 1.5,
  renderScale = 1,
  fps = 60,
  onFrame,
}: {
  fragment: string;
  className?: string;
  fallback?: ReactNode;
  maxDpr?: number;
  /** Render below CSS resolution for soft, expensive shaders (0.5 = quarter pixels). */
  renderScale?: number;
  fps?: number;
  /** Called before every draw; set uniforms here. Must not trigger React renders. */
  onFrame?: (set: SetUniform, info: FrameInfo) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    }) ??
      canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        powerPreference: "low-power",
      })) as WebGLRenderingContext | null;
    if (!gl) return;

    const program = link(gl, VERTEX, fragment);
    if (!program) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const locations = new Map<string, WebGLUniformLocation | null>();
    const set: SetUniform = (name, ...v) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      const u = locations.get(name);
      if (!u) return;
      if (v.length === 1) gl.uniform1f(u, v[0]!);
      else if (v.length === 2) gl.uniform2f(u, v[0]!, v[1]!);
      else if (v.length === 3) gl.uniform3f(u, v[0]!, v[1]!, v[2]!);
      else if (v.length === 4) gl.uniform4f(u, v[0]!, v[1]!, v[2]!, v[3]!);
    };

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * renderScale;
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width * dpr));
      height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = false;
    let raf = 0;
    let last = 0;
    let time = 0;
    let first = true;
    const interval = 1000 / fps;

    const draw = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      raf = requestAnimationFrame(draw);
      if (!first && now - last < interval - 1) return;
      const dt = first ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      const reducedMotion = motion.matches;
      if (!reducedMotion) time += dt;
      set("uRes", width, height);
      set("uTime", reducedMotion ? 12 : time);
      onFrameRef.current?.(set, { time, dt, width, height, reducedMotion });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (first) {
        first = false;
        setReady(true);
      }
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        kick();
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);
    document.addEventListener("visibilitychange", kick);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
      visible = false;
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", kick);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [fragment, maxDpr, renderScale, fps]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {fallback && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms]",
            ready && "opacity-0",
          )}
        >
          {fallback}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-[1400ms] ease-considered",
          ready ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  return program;
}
