import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Upload } from "lucide-react";

// Fake upload progress bar that animates to 100% then calls onDone.
export function UploadProgress({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now(), dur = 900;
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setPct(Math.round(p * 100));
      if (p < 1) requestAnimationFrame(tick); else onDone();
    };
    requestAnimationFrame(tick);
  }, [onDone]);
  return (
    <div className="flex flex-col items-center justify-center py-14 px-8">
      <div className="w-14 h-14 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "rgba(37,99,235,0.12)" }}>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>
          <Upload className="w-7 h-7 text-blue-500" />
        </motion.div>
      </div>
      <p className="font-bold text-base mb-1 text-slate-800">Uploading...</p>
      <p className="text-sm mb-6 text-slate-500">{pct}%</p>
      <div className="w-full max-w-xs h-2.5 rounded-full overflow-hidden bg-slate-100">
        <motion.div className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg,#2563EB,#3B82F6)", width: `${pct}%` }} />
      </div>
    </div>
  );
}
