"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageCircle, Search, Send, Phone, X,
  CheckCheck, Check, Clock,
} from "lucide-react";
import type { Conversation, Message } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

export default function ConversationsPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [orgId, setOrgId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed" | "pending">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    setLoading(true);
    const authRes = await fetch("/api/auth/me");
    if (!authRes.ok) { setLoading(false); return; }
    const { user } = await authRes.json();
    const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user!.id).single();
    if (!member) return;
    setOrgId(member.org_id);
    const { data } = await supabase.from("conversations")
      .select("*, contact:contacts(id, name, phone), instance:whatsapp_instances(id, name)")
      .eq("org_id", member.org_id)
      .order("updated_at", { ascending: false });
    setConversations((data as Conversation[]) ?? []);
    setLoading(false);
  }

  async function selectConversation(conv: Conversation) {
    setSelected(conv);
    setLoadingMsgs(true);
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at");
    setMessages((data as Message[]) ?? []);
    setLoadingMsgs(false);
    // Mark as read
    await supabase.from("conversations").update({ unread_count: 0 }).eq("id", conv.id);
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  }

  async function sendMessage() {
    if (!msgText.trim() || !selected || sending) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceId: selected.instance_id,
          to: selected.contact?.phone,
          message: text,
          conversationId: selected.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", selected.id).order("created_at");
        setMessages((msgs as Message[]) ?? []);
        setConversations((prev) =>
          prev.map((c) => c.id === selected.id ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c)
        );
      }
    } catch {}
    setSending(false);
  }

  async function updateStatus(convId: string, status: string) {
    await supabase.from("conversations").update({ status }).eq("id", convId);
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, status: status as Conversation["status"] } : c));
    if (selected?.id === convId) setSelected((prev) => prev ? { ...prev, status: status as Conversation["status"] } : null);
  }

  const filtered = conversations.filter((c) => {
    const matchSearch = [c.contact?.name, c.contact?.phone, c.last_message]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusIcon = (status: string) => {
    if (status === "sent") return <Check className="w-3 h-3" />;
    if (status === "delivered" || status === "read") return <CheckCheck className={cn("w-3 h-3", status === "read" ? "text-blue-400" : "")} />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="flex h-full">
      {/* Sidebar list */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h1 className="font-bold text-slate-900">Conversations</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 text-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {(["all", "open", "pending", "closed"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn("flex-1 py-1 text-xs rounded-lg font-medium transition-colors capitalize",
                  statusFilter === s ? "bg-whatsapp-teal text-white" : "text-slate-500 hover:bg-slate-100")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-12"><PacmanLoader size={32} label="Loading conversations" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm"><MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />No conversations</div>
          ) : (
            filtered.map((conv) => (
              <button key={conv.id} onClick={() => selectConversation(conv)}
                className={cn("w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors",
                  selected?.id === conv.id && "bg-whatsapp-teal/5 border-r-2 border-whatsapp-teal")}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-whatsapp-teal/10 rounded-full flex items-center justify-center text-whatsapp-teal font-semibold text-sm flex-shrink-0">
                    {(conv.contact?.name ?? conv.contact?.phone ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {conv.contact?.name ?? conv.contact?.phone ?? "Unknown"}
                      </p>
                      {conv.last_message_at && (
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatRelativeTime(conv.last_message_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-400 truncate">{conv.last_message ?? "No messages"}</p>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 w-5 h-5 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose from the list on the left</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-whatsapp-teal/10 rounded-full flex items-center justify-center text-whatsapp-teal font-semibold text-sm">
                  {(selected.contact?.name ?? selected.contact?.phone ?? "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {selected.contact?.name ?? selected.contact?.phone}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Phone className="w-3 h-3" />{selected.contact?.phone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-whatsapp-teal"
                  value={selected.status}
                  onChange={(e) => updateStatus(selected.id, e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="bot">Bot</option>
                </select>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12"><PacmanLoader size={32} label="Loading messages" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">No messages yet</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-xs lg:max-w-md", msg.direction === "outbound" ? "bubble-out" : "bubble-in")}>
                      <p className="text-sm text-slate-800">{msg.content}</p>
                      <div className={cn("flex items-center gap-1 mt-1", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                        <span className="text-xs text-slate-400">{formatRelativeTime(msg.created_at)}</span>
                        {msg.direction === "outbound" && (
                          <span className="text-slate-400">{statusIcon(msg.status)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                />
                <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    msgText.trim() ? "bg-whatsapp-teal text-white hover:bg-whatsapp-dark" : "bg-slate-100 text-slate-400")}>
                  {sending ? <PacmanLoader size={14} className="mr-1.5" label="Sending message" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

