"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface HelpTooltipProps {
  /** Título breve y claro del elemento explicado */
  title: string;
  /** Explicación sencilla en español ("for dummies") */
  text: string;
  /** Etiqueta accesible para lectores de pantalla */
  ariaLabel?: string;
  /** Preferencia de colocación vertical (se invierte automáticamente si no cabe) */
  preferSide?: "top" | "bottom";
}

/**
 * Tooltip accesible sin dependencias externas.
 * Usa un portal sobre `document.body` con posicionamiento calculado respecto al viewport
 * para evitar cortes en contenedores con `overflow-hidden` o bordes de pantalla.
 */
export default function HelpTooltip({
  title,
  text,
  ariaLabel,
  preferSide = "bottom",
}: HelpTooltipProps) {
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; side: "top" | "bottom" } | null>(null);

  const updatePosition = () => {
    const el = btnRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 288;
    const margin = 12;
    const approxHeight = 120;

    let side: "top" | "bottom" = preferSide;
    if (side === "bottom" && window.innerHeight - rect.bottom < approxHeight + margin) {
      side = "top";
    } else if (side === "top" && rect.top < approxHeight + margin) {
      side = "bottom";
    }

    const centeredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(margin, Math.min(centeredLeft, window.innerWidth - tooltipWidth - margin));
    const top = side === "bottom" ? rect.bottom + 8 : rect.top - 8;

    setCoords({ top, left: clampedLeft, side });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preferSide]);

  const handleOpen = () => {
    updatePosition();
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={ariaLabel || `Ayuda sobre ${title}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={handleOpen}
        onMouseLeave={() => setOpen(false)}
        onFocus={handleOpen}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) setOpen(false);
          else handleOpen();
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-zinc-600 bg-zinc-900 text-[10px] font-bold text-zinc-200 hover:border-green-400 hover:text-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-zinc-950 transition cursor-help shrink-0"
      >
        ?
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: 288,
              transform: coords.side === "top" ? "translateY(-100%)" : "none",
            }}
            className="z-[9999] pointer-events-none rounded-lg border border-zinc-600 bg-zinc-950 px-3.5 py-2.5 text-left shadow-2xl shadow-black/80"
          >
            <div className="text-xs font-bold text-green-300 mb-1">{title}</div>
            <p className="text-xs leading-relaxed text-zinc-100 font-normal normal-case tracking-normal">
              {text}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
