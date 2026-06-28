import { Shield } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

// Site footer with link columns and social links.
export function Footer() {
  return (
    <footer className="bg-white dark:bg-transparent border-t border-slate-100 dark:border-white/10 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">CivicAI</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
              AI-powered civic infrastructure for communities that deserve better.
            </p>
            <div className="flex items-center gap-3">
              {[GithubIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-600 dark:text-slate-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            { heading: "Platform", links: ["Report Issue", "Explore Map", "Analytics", "Leaderboard"] },
            { heading: "About", links: ["About Us", "Blog", "Careers", "Press"] },
            { heading: "Legal", links: ["Privacy Policy", "Terms", "Cookie Policy", "Contact"] },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-slate-900 dark:text-slate-100 text-sm font-bold mb-5">{heading}</p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-500 dark:text-slate-400 text-sm hover:text-blue-600 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100 dark:border-white/10">
          <p className="text-slate-400 dark:text-slate-500 text-sm">© 2025 CivicAI. Making cities better, one report at a time.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-slate-400 dark:text-slate-500 text-sm">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
