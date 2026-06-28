interface GridBackgroundProps {
  /** Use the dark palette. Defaults to light. */
  isDark?: boolean;
}

/**
 * Decorative full-bleed background: a soft diagonal gradient, a fine grid
 * overlay and a blurred blue glow. Render it as the first child of any
 * `position: relative` container, then keep page content above it (e.g. `z-10`).
 */
export function GridBackground({ isDark = false }: GridBackgroundProps) {
  const gridLine = isDark ? "rgba(99,130,255,0.18)" : "rgba(37,99,235,0.06)";

  return (
    <>
      {/* Base gradient */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-300"
        style={{
          background: isDark
            ? "#000000"
            : "linear-gradient(145deg,#EFF6FF 0%,#F8FAFC 45%,#EFF6FF 100%)",
        }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.5]"
        style={{
          backgroundImage: `linear-gradient(${gridLine} 1px,transparent 1px),linear-gradient(90deg,${gridLine} 1px,transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Blue glow */}
      <div
        className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)", filter: "blur(40px)" }}
      />
    </>
  );
}
