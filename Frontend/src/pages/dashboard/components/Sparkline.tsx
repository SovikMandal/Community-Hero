// Tiny inline area + line chart used inside the stat cards.
export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const w = 80, h = 28, gap = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * gap},${h - (v / max) * h}`).join(" ");
  const fill = `0,${h} ${pts} ${(data.length - 1) * gap},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polygon points={fill} fill={color} opacity="0.12" />
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
