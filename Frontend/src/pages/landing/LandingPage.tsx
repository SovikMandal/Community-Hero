import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Stats } from "./components/Stats";
import { LoadingDemo } from "./components/LoadingDemo";
import { RecentIssues } from "./components/RecentIssues";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { GridBackground } from "../../components/GridBackground";

export function LandingPage({ onAuthClick, isDark = false, onToggleDark }: { onAuthClick: () => void; isDark?: boolean; onToggleDark?: () => void }) {
  return (
    <div
      className={(isDark ? "dark " : "") + "bg-background min-h-screen relative"}
      style={{ fontFamily: "Inter, sans-serif", scrollbarWidth: "none" }}
    >
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { font-family: Inter, sans-serif; }
      `}</style>
      <GridBackground isDark={isDark} />
      <div className="relative z-10">
        <Nav onAuthClick={onAuthClick} isDark={isDark} onToggleDark={onToggleDark} />
        <Hero onAuthClick={onAuthClick} isDark={isDark} />
        <Features />
        <Stats />
        <LoadingDemo />
        <RecentIssues />
        <CTA isDark={isDark} />
        <Footer />
      </div>
    </div>
  );
}
