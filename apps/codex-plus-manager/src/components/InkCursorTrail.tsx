import { useEffect, useRef } from "react";

type Theme = "dark" | "light";

type InkStroke = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  bend: number;
  life: number;
  width: number;
};

type InkFleck = {
  x: number;
  y: number;
  life: number;
  size: number;
};

export function InkCursorTrail({ theme }: { theme: Theme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !container || !context) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const hoverQuery = window.matchMedia("(hover: none)");
    const forcedColorsQuery = window.matchMedia("(forced-colors: active)");
    const preferenceQueries = [motionQuery, coarsePointerQuery, hoverQuery, forcedColorsQuery];
    const strokes: InkStroke[] = [];
    const flecks: InkFleck[] = [];
    let animationFrame = 0;
    let bounds = container.getBoundingClientRect();
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastMoveAt = 0;
    let inkRgb = getComputedStyle(container).getPropertyValue("--cursor-ink-rgb").trim() || "43, 37, 29";

    const isDisabled = () => document.hidden || preferenceQueries.some((query) => query.matches);

    const clear = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      strokes.length = 0;
      flecks.length = 0;
      lastX = null;
      lastY = null;
      context.clearRect(0, 0, bounds.width, bounds.height);
    };

    const resize = () => {
      bounds = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      inkRgb = getComputedStyle(container).getPropertyValue("--cursor-ink-rgb").trim() || inkRgb;
      clear();
    };

    const draw = () => {
      animationFrame = 0;
      context.clearRect(0, 0, bounds.width, bounds.height);
      context.lineCap = "round";
      context.lineJoin = "round";

      for (let index = strokes.length - 1; index >= 0; index -= 1) {
        const stroke = strokes[index];
        stroke.life -= 0.045;
        if (stroke.life <= 0) {
          strokes.splice(index, 1);
          continue;
        }

        const alpha = Math.min(0.16, stroke.life * 0.15);
        context.strokeStyle = `rgba(${inkRgb}, ${alpha})`;
        context.lineWidth = Math.max(0.35, stroke.width * stroke.life);
        context.beginPath();
        context.moveTo(stroke.fromX, stroke.fromY);
        const middleX = (stroke.fromX + stroke.toX) / 2;
        const middleY = (stroke.fromY + stroke.toY) / 2;
        context.quadraticCurveTo(
          middleX + stroke.bend,
          middleY - stroke.bend * 0.45,
          stroke.toX,
          stroke.toY,
        );
        context.stroke();
      }

      for (let index = flecks.length - 1; index >= 0; index -= 1) {
        const fleck = flecks[index];
        fleck.life -= 0.06;
        if (fleck.life <= 0) {
          flecks.splice(index, 1);
          continue;
        }
        context.fillStyle = `rgba(${inkRgb}, ${fleck.life * 0.12})`;
        context.fillRect(fleck.x, fleck.y, fleck.size, fleck.size);
      }

      if (strokes.length > 0 || flecks.length > 0) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const ensureAnimation = () => {
      if (!animationFrame && !isDisabled()) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || isDisabled()) {
        return;
      }
      if (
        event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom
      ) {
        lastX = null;
        lastY = null;
        return;
      }

      const currentX = event.clientX - bounds.left;
      const currentY = event.clientY - bounds.top;
      const now = performance.now();
      if (lastX === null || lastY === null) {
        lastX = currentX;
        lastY = currentY;
        lastMoveAt = now;
        return;
      }

      const deltaX = currentX - lastX;
      const deltaY = currentY - lastY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < 3 || now - lastMoveAt < 10) {
        return;
      }

      const speed = Math.min(1, distance / 30);
      strokes.push({
        fromX: lastX,
        fromY: lastY,
        toX: currentX,
        toY: currentY,
        bend: (Math.random() - 0.5) * (3 + speed * 5),
        life: 1,
        width: 0.8 + speed * 2.8,
      });
      if (distance > 12 && flecks.length < 18) {
        const fleckCount = distance > 28 ? 2 : 1;
        for (let index = 0; index < fleckCount; index += 1) {
          flecks.push({
            x: currentX - deltaX * Math.random() + (Math.random() - 0.5) * 9,
            y: currentY - deltaY * Math.random() + (Math.random() - 0.5) * 9,
            life: 0.72 + Math.random() * 0.28,
            size: 0.7 + Math.random() * 1.5,
          });
        }
      }
      if (strokes.length > 36) {
        strokes.splice(0, strokes.length - 36);
      }
      lastX = currentX;
      lastY = currentY;
      lastMoveAt = now;
      ensureAnimation();
    };

    const handlePreferenceChange = () => {
      if (isDisabled()) {
        clear();
      }
    };
    const resetPointer = () => {
      lastX = null;
      lastY = null;
    };
    const resizeObserver = new ResizeObserver(resize);

    resize();
    resizeObserver.observe(container);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", handlePreferenceChange);
    preferenceQueries.forEach((query) => query.addEventListener("change", handlePreferenceChange));
    return () => {
      clear();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", handlePreferenceChange);
      preferenceQueries.forEach((query) => query.removeEventListener("change", handlePreferenceChange));
    };
  }, [theme]);

  return (
    <canvas
      aria-hidden="true"
      className="ink-cursor-canvas"
      ref={canvasRef}
      role="presentation"
      tabIndex={-1}
    />
  );
}
