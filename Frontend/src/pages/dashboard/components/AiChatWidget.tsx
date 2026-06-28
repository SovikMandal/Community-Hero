import type { RefObject } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Send } from "lucide-react";
import type { DashboardTheme } from "../theme";

export interface ChatMessage {
  from: "user" | "ai";
  text: string;
}

interface AiChatWidgetProps {
  t: DashboardTheme;
  isDark: boolean;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  chatHistory: ChatMessage[];
  chatMsg: string;
  setChatMsg: (v: string) => void;
  sendChat: () => void;
  aiTyping: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
}

// Floating Gemini Civic AI assistant with a chat panel and launcher button.
export function AiChatWidget({
  t, isDark, aiOpen, setAiOpen, chatHistory, chatMsg, setChatMsg, sendChat, aiTyping, chatEndRef,
}: AiChatWidgetProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {aiOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.85, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border overflow-hidden"
            style={{ width: "min(320px, calc(100vw - 32px))", height: 420, background: t.card, borderColor: t.cardBorder, boxShadow: isDark?"0 20px 60px rgba(0,0,0,0.50)":"0 20px 60px rgba(15,23,42,0.15)" }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">AI Assistant</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                    <p className="text-blue-100 text-xs">Online</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ height: 296 }}>
              {chatHistory.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed"
                    style={{
                      background: msg.from === "user" ? "#2563EB" : t.tagBg,
                      color: msg.from === "user" ? "white" : t.text,
                      borderBottomRightRadius: msg.from === "user" ? 4 : undefined,
                      borderBottomLeftRadius: msg.from === "ai" ? 4 : undefined,
                    }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {aiTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5" style={{ background: t.tagBg }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: t.textMuted }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2 border"
                style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about your city..."
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: t.text, fontFamily: "Inter, sans-serif" }} />
                <button onClick={sendChat}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-colors"
                  style={{ background: chatMsg.trim() ? "#2563EB" : (isDark ? "#1E293B" : "#CBD5E1") }}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button onClick={() => setAiOpen(!aiOpen)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
        animate={{ boxShadow: aiOpen ? "0 8px 32px rgba(37,99,235,0.45)" : ["0 4px 20px rgba(37,99,235,0.30)","0 8px 32px rgba(37,99,235,0.55)","0 4px 20px rgba(37,99,235,0.30)"] }}
        transition={{ boxShadow: { repeat: Infinity, duration: 2.5 } }}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg,#2563EB,#3B82F6)" }}>
        {aiOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {!aiOpen && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          className="absolute bottom-16 right-0 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap pointer-events-none"
          style={{ background: isDark?"#1E293B":"#0F172A", boxShadow: "0 4px 12px rgba(15,23,42,0.20)" }}>
          Need Help?
          <div className="absolute bottom-[-4px] right-4 w-2 h-2 rotate-45" style={{ background: isDark?"#1E293B":"#0F172A" }} />
        </motion.div>
      )}
    </div>
  );
}
