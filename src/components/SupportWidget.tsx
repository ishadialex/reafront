"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import "./SignupForm/phoneInput.css";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SESSION_KEY = "chat_session_token";

interface ChatMsg {
  id: string;
  senderType: "visitor" | "admin";
  content: string;
  createdAt: string;
}

function getOrCreateToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineForm, setOfflineForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [offlineSending, setOfflineSending] = useState(false);
  const [offlineSent, setOfflineSent] = useState(false);
  const [offlineError, setOfflineError] = useState("");

  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);
  const sessionTokenRef = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Notify admin on WhatsApp when a brand-new visitor lands on the site
  useEffect(() => {
    const alreadyHadToken = !!localStorage.getItem(SESSION_KEY);
    if (alreadyHadToken) return; // returning visitor — skip
    const token = getOrCreateToken();
    sessionTokenRef.current = token;
    fetch(`${API_BASE}/chat/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: token,
        currentPage: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-close widget and reset offline form 3s after successful submission
  useEffect(() => {
    if (!offlineSent) return;
    const t = setTimeout(() => {
      setOpen(false);
      setOfflineSent(false);
      setOfflineForm({ name: "", email: "", phone: "", message: "" });
    }, 3000);
    return () => clearTimeout(t);
  }, [offlineSent]);

  // Fetch online/offline status on mount
  useEffect(() => {
    fetch(`${API_BASE}/chat/status`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setIsOnline(res.data.isOnline); })
      .catch(() => {});
  }, []);

  // Fire-and-forget page update on every navigation (only if session exists)
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/chat/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionToken: token, currentPage: window.location.href }),
    }).catch(() => {});
  }, [pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  const connectSocket = useCallback((token: string) => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { sessionToken: token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("chat_status", ({ isOnline }: { isOnline: boolean }) => {
      setIsOnline(isOnline);
    });

    socket.on("chat_reply", (msg: ChatMsg) => {
      setMessages((prev) => {
        // deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socketRef.current = socket;
  }, []);

  // Initialise session + socket when widget opens for the first time
  useEffect(() => {
    if (!open) return;

    const token = getOrCreateToken();
    sessionTokenRef.current = token;

    // Load history
    fetch(`${API_BASE}/chat/history/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setMessages(res.data);
          setNameSubmitted(true); // already chatted before
        }
      })
      .catch(() => {});

    connectSocket(token);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleStartChat() {
    const name = visitorName.trim() || "Visitor";
    const token = sessionTokenRef.current;

    await fetch(`${API_BASE}/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: token,
        visitorName: name,
        currentPage: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });

    setNameSubmitted(true);
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    const token = sessionTokenRef.current;
    const name = visitorName.trim() || "Visitor";

    setSending(true);
    setInput("");

    // Optimistic update
    const tempMsg: ChatMsg = {
      id: `temp-${Date.now()}`,
      senderType: "visitor",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: token, content, visitorName: name, currentPage: window.location.href }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Replace temp with real
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...data.data, senderType: "visitor" } : m))
        );
      }
    } catch {
      // keep the optimistic message even on error
    } finally {
      setSending(false);
    }
  }

  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const phoneValid = (v: string) => (v.replace(/\D/g, "").length >= 10);

  async function handleOfflineSubmit() {
    const { name, email, phone, message } = offlineForm;
    if (!name.trim() || !emailValid(email) || !phoneValid(phone) || !message.trim()) return;
    setOfflineSending(true);
    setOfflineError("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setOfflineSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setOfflineError(data.message || "Failed to send. Please try again.");
      }
    } catch {
      setOfflineError("Network error. Please try again.");
    } finally {
      setOfflineSending(false);
    }
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-[9998] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#4a6cf7] text-white shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Alvarado Support</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline && connected ? "bg-green-300" : isOnline ? "bg-yellow-300" : "bg-red-400"}`} />
                {!isOnline ? "Offline" : connected ? "Online" : "Connecting…"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Offline state */}
          {!isOnline ? (
            <div className="flex flex-col flex-1 overflow-y-auto px-5 py-5 gap-3">
              {offlineSent ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">Message sent!</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">We&apos;ll get back to you as soon as we&apos;re back online.</p>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">We&apos;re offline right now</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Leave your details and we&apos;ll follow up shortly.</p>
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={offlineForm.name}
                    onChange={(e) => setOfflineForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                  />
                  <div>
                    <input
                      type="email"
                      placeholder="Email address *"
                      value={offlineForm.email}
                      onChange={(e) => setOfflineForm((f) => ({ ...f, email: e.target.value }))}
                      className={`w-full rounded-xl border bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7] ${offlineForm.email && !emailValid(offlineForm.email) ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
                    />
                    {offlineForm.email && !emailValid(offlineForm.email) && (
                      <p className="text-[10px] text-red-400 mt-0.5 pl-1">Enter a valid email address</p>
                    )}
                  </div>
                  <div>
                    <div className={`phone-input-compact${offlineForm.phone.replace(/\D/g, "").length > 1 && !phoneValid(offlineForm.phone) ? " phone-input-error" : ""}`}>
                      <PhoneInput
                        defaultCountry="us"
                        value={offlineForm.phone}
                        onChange={(phone) => setOfflineForm((f) => ({ ...f, phone }))}
                      />
                    </div>
                    {offlineForm.phone.replace(/\D/g, "").length > 1 && !phoneValid(offlineForm.phone) && (
                      <p className="text-[10px] text-red-400 mt-0.5 pl-1">Enter a valid phone number (min 10 digits)</p>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Your message *"
                    value={offlineForm.message}
                    onChange={(e) => setOfflineForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                  />
                  {offlineError && (
                    <p className="text-[10px] text-red-400 text-center">{offlineError}</p>
                  )}
                  <button
                    onClick={handleOfflineSubmit}
                    disabled={offlineSending || !offlineForm.name.trim() || !emailValid(offlineForm.email) || !phoneValid(offlineForm.phone) || !offlineForm.message.trim()}
                    className="w-full rounded-xl bg-[#4a6cf7] text-white py-2.5 text-xs font-medium hover:bg-[#3a5ce7] transition-colors disabled:opacity-50"
                  >
                    {offlineSending ? "Sending…" : "Send Message"}
                  </button>
                </>
              )}
            </div>
          ) : !nameSubmitted ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[#4a6cf7]/10 flex items-center justify-center">
                <svg className="h-7 w-7 text-[#4a6cf7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">How can we help?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chat directly with our support team — no login needed.
                </p>
              </div>
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleStartChat(); }}
                placeholder="Your name (optional)"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
              />
              <button
                onClick={handleStartChat}
                className="w-full rounded-xl bg-[#4a6cf7] text-white py-2.5 text-sm font-medium hover:bg-[#3a5ce7] transition-colors"
              >
                Start Chat
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-8">
                    Send a message to start chatting with support.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2 ${m.senderType === "admin" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-white
                        ${m.senderType === "admin" ? "bg-indigo-500" : "bg-[#4a6cf7]"}`}
                    >
                      {m.senderType === "admin" ? "S" : "U"}
                    </div>
                    <div className={`flex-1 flex flex-col ${m.senderType === "admin" ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-xl px-3 py-2 text-xs whitespace-pre-wrap max-w-[85%]
                          ${m.senderType === "admin"
                            ? "rounded-tr-none bg-indigo-600 text-white"
                            : "rounded-tl-none bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                          }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5">{fmt(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-2 shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message…"
                    className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4a6cf7]"
                    style={{ maxHeight: 80 }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="shrink-0 h-8 w-8 rounded-full bg-[#4a6cf7] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#3a5ce7] transition-colors"
                    aria-label="Send"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Support chat"
        className="fixed bottom-4 right-4 z-[9999] h-14 w-14 rounded-full bg-[#4a6cf7] text-white shadow-lg flex items-center justify-center hover:bg-[#3a5ce7] transition-all hover:scale-105"
      >
        {open ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}
