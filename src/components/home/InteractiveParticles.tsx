'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Particle {
    originX: number;
    originY: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const GRID = 28;           // spacing between dots
const DOT_RADIUS = 1.2;    // base dot size
const MOUSE_RADIUS = 120;  // how far the mouse influence reaches
const PUSH_FORCE = 0.8;    // how strongly dots flee
const SPRING = 0.03;       // how fast dots return (spring stiffness)
const DAMPING = 0.85;      // velocity damping (lower = more sluggish)
const COLOR = 'rgba(52, 211, 153, ';  // emerald-400

export default function InteractiveParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const mouse = useRef({ x: -9999, y: -9999 });
    const rafId = useRef(0);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    const initParticles = useCallback((w: number, h: number) => {
        const pts: Particle[] = [];
        const cols = Math.ceil(w / GRID) + 1;
        const rows = Math.ceil(h / GRID) + 1;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * GRID;
                const y = r * GRID;
                pts.push({ originX: x, originY: y, x, y, vx: 0, vy: 0 });
            }
        }
        particles.current = pts;
    }, []);

    useEffect(() => {
        // Skip on touch-only devices
        if ('ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches) {
            setIsTouchDevice(true);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        function resize() {
            const rect = parent!.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas!.width = rect.width * dpr;
            canvas!.height = rect.height * dpr;
            canvas!.style.width = rect.width + 'px';
            canvas!.style.height = rect.height + 'px';
            ctx!.scale(dpr, dpr);
            initParticles(rect.width, rect.height);
        }

        function handleMouseMove(e: MouseEvent) {
            const rect = canvas!.getBoundingClientRect();
            mouse.current.x = e.clientX - rect.left;
            mouse.current.y = e.clientY - rect.top;
        }

        function handleMouseLeave() {
            mouse.current.x = -9999;
            mouse.current.y = -9999;
        }

        function animate() {
            const w = canvas!.width / (Math.min(window.devicePixelRatio || 1, 2));
            const h = canvas!.height / (Math.min(window.devicePixelRatio || 1, 2));
            ctx!.clearRect(0, 0, w, h);

            const mx = mouse.current.x;
            const my = mouse.current.y;
            const pts = particles.current;
            const r2 = MOUSE_RADIUS * MOUSE_RADIUS;

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];

                // Distance from mouse
                const dx = p.x - mx;
                const dy = p.y - my;
                const dist2 = dx * dx + dy * dy;

                if (dist2 < r2 && dist2 > 0) {
                    const dist = Math.sqrt(dist2);
                    const force = (1 - dist / MOUSE_RADIUS) * PUSH_FORCE;
                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;
                }

                // Spring back to origin
                p.vx += (p.originX - p.x) * SPRING;
                p.vy += (p.originY - p.y) * SPRING;

                // Damping
                p.vx *= DAMPING;
                p.vy *= DAMPING;

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Opacity: brighter near mouse, subtle otherwise
                const displacement = Math.sqrt(
                    (p.x - p.originX) ** 2 + (p.y - p.originY) ** 2
                );
                const alpha = Math.min(0.15 + displacement * 0.03, 0.6);

                // Draw
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
                ctx!.fillStyle = COLOR + alpha + ')';
                ctx!.fill();
            }

            rafId.current = requestAnimationFrame(animate);
        }

        resize();

        // Listeners
        const section = canvas.closest('section') || parent;
        section.addEventListener('mousemove', handleMouseMove as EventListener);
        section.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', resize);

        rafId.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rafId.current);
            section.removeEventListener('mousemove', handleMouseMove as EventListener);
            section.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', resize);
        };
    }, [initParticles]);

    // On touch devices, show static CSS grid fallback
    if (isTouchDevice) {
        return (
            <div
                className="absolute inset-0 z-[1] opacity-[0.15]"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgb(52 211 153) 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-[1] pointer-events-none"
            aria-hidden="true"
        />
    );
}
