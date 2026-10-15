"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Slide = {
  src: string;
  alt: string;
  /** Ken Burns motion: start/end scale and pan (in %) */
  from: { scale: number; x: string; y: string };
  to: { scale: number; x: string; y: string };
};

const SLIDES: Slide[] = [
  {
    src: "/about/event-1.jpg",
    alt: "AKITDA Ernakulam office bearers lighting the lamp at the Annual General Body",
    from: { scale: 1.0, x: "0%", y: "0%" },
    to: { scale: 1.14, x: "-2%", y: "-2%" },
  },
  {
    src: "/about/event-2.jpg",
    alt: "19th Annual General Body & Exhibition hall with members and stage",
    from: { scale: 1.14, x: "2%", y: "1%" },
    to: { scale: 1.0, x: "0%", y: "0%" },
  },
  {
    src: "/about/event-3.jpg",
    alt: "Members attending the AKITDA Annual General Body & Exhibition",
    from: { scale: 1.02, x: "2%", y: "0%" },
    to: { scale: 1.14, x: "-2%", y: "1%" },
  },
];

const SLIDE_MS = 5000;
const FADE_S = 1.2;

export function AboutSlideshow() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [active]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-blue-950">
      {SLIDES.map((s, i) => {
        const isActive = i === active;
        return (
          <motion.img
            key={s.src}
            src={s.src}
            alt={s.alt}
            loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            style={{ zIndex: isActive ? 2 : 1 }}
            initial={false}
            animate={
              isActive
                ? reduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: [s.from.scale, s.to.scale],
                      x: [s.from.x, s.to.x],
                      y: [s.from.y, s.to.y],
                    }
                : { opacity: 0 }
            }
            transition={{
              opacity: { duration: FADE_S, ease: "easeInOut" },
              default: { duration: (SLIDE_MS / 1000) + FADE_S, ease: "linear" },
            }}
          />
        );
      })}

      {/* Subtle cinematic overlay */}
      <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-t from-black/55 via-black/0 to-black/10" />

      {/* Caption + indicators */}
      <div className="absolute inset-x-0 bottom-0 z-[4] flex items-end justify-between gap-4 p-4 md:p-5">
        <p className="text-sm md:text-base font-semibold text-white drop-shadow">
          19th Annual General Body &amp; Exhibition
        </p>
        <div className="flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
