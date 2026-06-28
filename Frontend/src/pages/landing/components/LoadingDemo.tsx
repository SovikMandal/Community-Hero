import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Users, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Snap & Report",
    desc: "Take a photo of the issue. AI instantly identifies the problem type and severity.",
    color: "#2563EB",
    bg: "#EFF6FF",
    icon: Camera,
  },
  {
    step: "02",
    title: "Verify Together",
    desc: "Neighbours corroborate your report. Community consensus elevates genuine issues.",
    color: "#22C55E",
    bg: "#F0FDF4",
    icon: Users,
  },
  {
    step: "03",
    title: "Track & Resolve",
    desc: "Authorities are notified. Follow progress in real-time until the issue is fixed.",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: CheckCircle2,
  },
];

// "How it works" three-step section with a one-time shimmer skeleton.
export function LoadingDemo() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section id="process" className="py-20 bg-white dark:bg-transparent scroll-mt-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-slate-900 dark:text-slate-100 font-bold text-3xl mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
            How it works
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Three steps from problem to resolution</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(({ step, title, desc, color, bg, icon: Icon }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative bg-white/55 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-white/10"
            >
              <div
                className="absolute top-6 right-6 text-5xl font-black opacity-10"
                style={{ color, fontFamily: "Inter, sans-serif" }}
              >
                {step}
              </div>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: bg }}
              >
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="text-slate-900 dark:text-slate-100 font-bold text-lg mb-2">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>

              {/* Loading shimmer on first load */}
              <AnimatePresence>
                {!loaded && i === 1 && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-3xl overflow-hidden bg-slate-100"
                  >
                    <motion.div
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
                      animate={{ translateX: ["-100%", "200%"] }}
                      transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
