"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  MessageCircle, Search, Send, Phone, X,
  CheckCheck, Check, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import type { Conversation, Message } from "@/types";
import { cn, formatRelativeTime } from "@/lib/utils";
import PacmanLoader from "@/components/ui/PacmanLoader";

interface ContactGroup {
  contactId: string;
  contactName: string;
  contactPhone: string;
  conversations: Conversation[];
  latestConversation: Conversation;
}

function groupByContact(conversations: Conversation[]): ContactGroup[] {
  const map = new Map<string, Conversation[]>();
  for (const conv of conversations) {
    const key = conv.contact_id ?? conv.contact?.phone ?? conv.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(conv);
  }
  const groups: ContactGroup[] = [];
  for (const [contactId, convs] of map) {
    const sorted = [...convs].sort((a, b) =>
      new Date(b.last_message_at ?? b.updated_at ?? 0).getTime() -
      new Date(a.last_message_at ?? a.updated_at ?? 0).getTime()
    );
    const latest = sorted[0];
    groups.push({
      contactId,
      contactName: latest.contact?.name ?? latest.contact?.phone ?? "Unknown",
      contactPhone: latest.contact?.phone ?? "",
      conversations: sorted,
      latestConversation: latest,
    });
  }
  return groups.sort((a, b) =>
    new Date(b.latestConversation.last_message_at ?? b.latestConversation.updated_at ?? 0).getTime() -
    new Date(a.latestConversation.last_message_at ?? a.latestConversation.updated_at ?? 0).getTime()
  );
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [orgId, setOrgId] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => loadConversations(search, true), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadConversations(search, conversations.length > 0), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/conversations/${selected.id}/messages`);
      if (res.ok) {
        const { messages: msgs } = await res.json();
        setMessages(msgs ?? []);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selected?.id]);

  async function loadConversations(q = "", silent = false) {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/conversations${params.size ? `?${params}` : ""}`);
    if (!res.ok) { setLoading(false); return; }
    const { conversations: data, orgId: oid } = await res.json();
    if (oid) setOrgId(oid);
    setConversations((data as Conversation[]) ?? []);
    setLoading(false);
  }

  async function selectConversation(conv: Conversation) {
    setSelected(conv);
    setLoadingMsgs(true);
    const msgsRes = await fetch(`/api/conversations/${conv.id}/messages`);
    const msgsData = msgsRes.ok ? await msgsRes.json() : { messages: [] };
    setMessages((msgsData.messages as Message[]) ?? []);
    setLoadingMsgs(false);
    await fetch(`/api/conversations/${conv.id}/messages`, { method: "PATCH" });
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  }

  async function sendMessage() {
    if (!msgText.trim() || !selected || sending) return;
    setSending(true);
    const text = msgText.trim();
    setMsgText("");

    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: selected.id,
      org_id: orgId,
      direction: "outbound",
      source: "direct",
      type: "text",
      content: text,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setConversations((prev) =>
      prev.map((c) => c.id === selected.id ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c)
    );

    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceId: selected.instance_id,
        to: selected.contact?.phone,
        message: text,
        conversationId: selected.id,
      }),
    });

    const msgsRes = await fetch(`/api/conversations/${selected.id}/messages`);
    const msgsData = msgsRes.ok ? await msgsRes.json() : { messages: [] };
    setMessages((msgsData.messages as Message[]) ?? []);
    setSending(false);
  }

  async function updateStatus(convId: string, status: string) {
    await fetch(`/api/conversations/${convId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, status: status as Conversation["status"] } : c));
    if (selected?.id === convId) setSelected((prev) => prev ? { ...prev, status: status as Conversation["status"] } : null);
  }

  function highlight(text: string | null | undefined) {
    if (!text || !search) return text ?? "";
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + search.length)}</mark>
        {text.slice(idx + search.length)}
      </>
    );
  }

  function toggleExpand(contactId: string) {
    setExpandedContacts((prev) => {
      const next = new Set(prev);
      next.has(contactId) ? next.delete(contactId) : next.add(contactId);
      return next;
    });
  }

  const groups = useMemo(() => {
    const filtered = conversations.filter((c) =>
      readFilter === "all" || (readFilter === "unread" ? c.unread_count > 0 : c.unread_count === 0)
    );
    return groupByContact(filtered);
  }, [conversations, readFilter]);

  const statusIcon = (status: string) => {
    if (status === "sent") return <Check className="w-3 h-3" />;
    if (status === "delivered" || status === "read") return <CheckCheck className={cn("w-3 h-3", status === "read" ? "text-blue-400" : "")} />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <h1 className="font-bold text-slate-900">Conversations</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-9 text-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {(["all", "unread", "read"] as const).map((s) => (
              <button key={s} onClick={() => setReadFilter(s)}
                className={cn("flex-1 py-1 text-xs rounded-lg font-medium transition-colors capitalize",
                  readFilter === s ? "bg-whatsapp-teal text-white" : "text-slate-500 hover:bg-slate-100")}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {loading ? (
            <div className="flex items-center justify-center py-12"><PacmanLoader size={32} label="Loading conversations" /></div>
          ) : groups.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm"><MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />No conversations</div>
          ) : (
            groups.map((group) => {
              const isExpanded = expandedContacts.has(group.contactId);
              const hasMultiple = group.conversations.length > 1;
              const totalUnread = group.conversations.reduce((sum, c) => sum + c.unread_count, 0);
              const latest = group.latestConversation;

              return (
                <div key={group.contactId}>
                  {/* Contact row */}
                  <div className={cn(
                    "w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors",
                    selected && group.conversations.some((c) => c.id === selected.id) && !hasMultiple && "bg-whatsapp-teal/5 border-r-2 border-whatsapp-teal"
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-whatsapp-teal/10 rounded-full flex items-center justify-center text-whatsapp-teal font-semibold text-sm flex-shrink-0">
                        {group.contactName[0].toUpperCase()}
                      </div>
                      <button className="flex-1 min-w-0 text-left" onClick={() => hasMultiple ? toggleExpand(group.contactId) : selectConversation(latest)}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {highlight(group.contactName)}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            {latest.last_message_at && (
                              <span className="text-xs text-slate-400">{formatRelativeTime(latest.last_message_at)}</span>
                            )}
                            {hasMultiple && (
                              isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className={cn("text-xs truncate", totalUnread > 0 ? "text-slate-700 font-medium" : "text-slate-400")}>
                            {hasMultiple
                              ? `${group.conversations.length} conversations`
                              : highlight(latest.last_message) || (totalUnread > 0 ? "New message" : "No messages")}
                          </p>
                          {totalUnread > 0 && (
                            <span className="ml-2 w-5 h-5 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {totalUnread}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Expanded conversation list */}
                  {hasMultiple && isExpanded && (
                    <div className="bg-slate-50 border-t border-slate-100">
                      {group.conversations.map((conv, i) => (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 hover:bg-slate-100 transition-colors flex items-start gap-3 border-b border-slate-100 last:border-0",
                            selected?.id === conv.id && "bg-whatsapp-teal/10 border-r-2 border-whatsapp-teal"
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0 ml-2" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-slate-600 truncate">
                                Conversation {i + 1}
                                <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                  conv.status === "open" ? "bg-green-100 text-green-700" :
                                  conv.status === "closed" ? "bg-slate-100 text-slate-500" :
                                  "bg-amber-100 text-amber-700"
                                )}>
                                  {conv.status}
                                </span>
                              </p>
                              {conv.last_message_at && (
                                <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{formatRelativeTime(conv.last_message_at)}</span>
                              )}
                            </div>
                            <p className={cn("text-xs truncate mt-0.5", conv.unread_count > 0 ? "text-slate-700 font-medium" : "text-slate-400")}>
                              {conv.last_message || "No messages"}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="w-4 h-4 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
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
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                  selected.status === "open" ? "bg-green-100 text-green-700" :
                  selected.status === "closed" ? "bg-slate-100 text-slate-500" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {selected.status}
                </span>
                {selected.unread_count > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-whatsapp-green/10 text-whatsapp-green">
                    {selected.unread_count} unread
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12"><PacmanLoader size={32} label="Loading messages" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">No messages yet</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-xs lg:max-w-md", msg.direction === "outbound" ? "bubble-out" : "bubble-in")}>
                      <p className="text-sm text-slate-800">{highlight(msg.content)}</p>
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
