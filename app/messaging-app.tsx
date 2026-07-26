"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { SuiteUser } from "@/lib/auth";
import type { ConversationSummary, PublicMessage } from "@/lib/messages";

const ORIGIN = "https://messaggi.tecnosocialismo.com";
const LOGIN_URL = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent(ORIGIN)}`;
const suiteLinks = [
  { mark: "T", label: "Home", href: "https://tecnosocialismo.com" },
  { mark: "I", label: "Iskra", href: "https://iskra.tecnosocialismo.com" },
  { mark: "R", label: "Rizoma", href: "https://rizoma.tecnosocialismo.com" },
  { mark: "C", label: "Cloud", href: "https://cloud.tecnosocialismo.com" },
  { mark: "M", label: "Mail", href: "https://mail.tecnosocialismo.com" },
  { mark: "V", label: "Video", href: "https://video.tecnosocialismo.com" },
  { mark: "S", label: "Social", href: "https://social.tecnosocialismo.com" },
  { mark: "G", label: "Messaggi", href: ORIGIN, current: true },
  { mark: "A", label: "Account", href: "https://login.tecnosocialismo.com" },
];

export function MessagingApp({ user }: { user: SuiteUser | null }) {
  if (!user) return <Welcome />;
  return <Messenger user={user} />;
}

function Welcome() {
  return <main className="welcome-shell">
    <header className="public-header"><Brand /><SuiteLauncher /><a className="access-link" href={LOGIN_URL}>Accedi</a></header>
    <section className="welcome-copy">
      <p>MESSAGGI · ALFA WEB</p>
      <h1>Un posto per parlare<br /><em>senza rumore.</em></h1>
      <span>Conversazioni dirette e di gruppo, dentro lo stesso account. Nessuna pubblicità e nessun feed da inseguire.</span>
      <a href={LOGIN_URL}>Apri Messaggi <Icon name="arrow" /></a>
    </section>
    <div className="welcome-orbit" aria-hidden="true"><i /><i /><i /><b /></div>
    <footer className="welcome-footer"><span>WEB ADESSO</span><span>APP MOBILE NELLA PROSSIMA FASE</span></footer>
  </main>;
}

function Messenger({ user }: { user: SuiteUser }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (silent = false) => {
    const response = await fetch("/api/conversations", { cache: "no-store" }).catch(() => null);
    if (!response?.ok) {
      if (!silent) { setNotice("Lo spazio messaggi non è ancora disponibile."); setLoading(false); }
      return;
    }
    const payload = await response.json() as { conversations: ConversationSummary[] };
    setConversations(payload.conversations);
    setSelectedId((current) => current && payload.conversations.some((item) => item.id === current) ? current : payload.conversations[0]?.id ?? null);
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (conversationId: string, silent = false) => {
    if (!silent) setMessagesLoading(true);
    const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" }).catch(() => null);
    if (response?.ok) {
      const payload = await response.json() as { messages: PublicMessage[] };
      setMessages(payload.messages);
      setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, unreadCount: 0 } : item));
    } else if (!silent) setNotice("Non è stato possibile aprire la conversazione.");
    setMessagesLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadConversations(), 0);
    const timer = window.setInterval(() => void loadConversations(true), 7000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    const initial = window.setTimeout(() => void loadMessages(selectedId), 0);
    const timer = window.setInterval(() => void loadMessages(selectedId, true), 3500);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [selectedId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const selected = conversations.find((item) => item.id === selectedId) ?? null;
  const visible = useMemo(() => {
    const clean = query.trim().toLocaleLowerCase("it");
    if (!clean) return conversations;
    return conversations.filter((item) => [item.title, item.lastMessage?.body ?? "", ...item.members.map((member) => member.name)].some((value) => value.toLocaleLowerCase("it").includes(clean)));
  }, [conversations, query]);

  function choose(id: string) { setSelectedId(id); setMobileThread(true); }
  function toast(value: string) { setNotice(value); window.setTimeout(() => setNotice(null), 3200); }

  return <div className={`messenger-shell ${mobileThread ? "show-thread" : ""}`}>
    <header className="app-header">
      <Brand />
      <Link className="service-title" href="/">MESSAGGI <i>ALFA</i></Link>
      <SuiteLauncher />
      <a className="profile-link" href="https://login.tecnosocialismo.com" title={user.email}><span>{initials(user.name)}</span><strong>{user.name}</strong></a>
    </header>

    <aside className="conversation-panel">
      <div className="panel-heading"><div><p>CONVERSAZIONI</p><h1>Messaggi</h1></div><button onClick={() => setNewOpen(true)} aria-label="Nuova conversazione"><Icon name="edit" /></button></div>
      <label className="conversation-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca" />{query && <button onClick={() => setQuery("")}><Icon name="close" /></button>}</label>
      <div className="conversation-list">
        {loading ? [1, 2, 3].map((item) => <div className="conversation-skeleton" key={item} />) : visible.length === 0 ? <div className="no-conversations"><Icon name="bubble" /><b>Nessuna conversazione</b><span>Scrivi a qualcuno usando la sua email.</span></div> : visible.map((conversation) => <button className={conversation.id === selectedId ? "active" : ""} onClick={() => choose(conversation.id)} key={conversation.id}>
          <Avatar conversation={conversation} viewerId={user.id} />
          <span className="conversation-copy"><b>{conversation.title}</b><small>{preview(conversation, user.id)}</small></span>
          <span className="conversation-meta"><time>{conversation.lastMessage ? shortTime(conversation.lastMessage.createdAt) : ""}</time>{conversation.unreadCount > 0 && <i>{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</i>}</span>
        </button>)}
      </div>
      <div className="panel-suite"><p>ECOSISTEMA</p>{suiteLinks.map((link) => <a className={link.current ? "current" : ""} href={link.href} key={link.label}><i>{link.mark}</i>{link.label}</a>)}</div>
    </aside>

    <main className="thread-panel">
      {selected ? <>
        <header className="thread-header"><button className="back-button" onClick={() => setMobileThread(false)} aria-label="Conversazioni"><Icon name="back" /></button><Avatar conversation={selected} viewerId={user.id} /><div><h2>{selected.title}</h2><p>{statusLine(selected, user.id)}</p></div><button title="Informazioni"><Icon name="info" /></button></header>
        <section className="message-stream">
          <div className="thread-start"><Avatar conversation={selected} viewerId={user.id} /><h3>{selected.title}</h3><p>{selected.kind === "notes" ? "Uno spazio privato per appunti, idee e collegamenti da ritrovare." : `Questa conversazione è condivisa con ${otherPeople(selected, user.id)}.`}</p><span>{formatDate(selected.updatedAt)}</span></div>
          {messagesLoading && messages.length === 0 ? <div className="message-loading"><i /><i /><i /></div> : messages.map((message, index) => {
            const mine = message.senderId === user.id;
            const showName = selected.kind === "group" && !mine && messages[index - 1]?.senderId !== message.senderId;
            const startsGroup = index === 0 || messages[index - 1]?.senderId !== message.senderId || new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60_000;
            return <article className={`message ${mine ? "mine" : "theirs"} ${startsGroup ? "group-start" : ""}`} key={message.id}>{showName && <b>{message.senderName}</b>}<div><p>{message.body}</p><time>{messageTime(message.createdAt)}</time></div></article>;
          })}
          <div ref={endRef} />
        </section>
        <Composer conversationId={selected.id} onSent={(message) => { setMessages((current) => [...current, message]); void loadConversations(true); }} toast={toast} />
      </> : <div className="empty-thread"><span><Icon name="bubble" /></span><h2>Le conversazioni iniziano qui.</h2><p>Scegline una oppure scrivi a una persona usando il suo account Tecnosocialismo.</p><button onClick={() => setNewOpen(true)}>Nuova conversazione <Icon name="arrow" /></button></div>}
    </main>

    <aside className="detail-panel">
      {selected && <><section className="detail-identity"><Avatar conversation={selected} viewerId={user.id} /><h2>{selected.title}</h2><p>{statusLine(selected, user.id)}</p></section><section className="people-list"><p>PARTECIPANTI · {selected.members.length}</p>{selected.members.map((member) => <div key={member.id}><span>{initials(member.name)}</span><b>{member.name}<small>{member.id === user.id ? "Tu" : member.email}</small></b></div>)}</section><section className="privacy-note"><Icon name="lock" /><div><b>Conversazione privata</b><p>È visibile soltanto agli account che ne fanno parte.</p></div></section><small className="web-note">VERSIONE WEB · ALFA 0.1<br />NOTIFICHE E APP MOBILE NELLA PROSSIMA FASE</small></>}
    </aside>

    {newOpen && <NewConversation onClose={() => setNewOpen(false)} onCreated={async (id) => { setNewOpen(false); await loadConversations(); setSelectedId(id); setMobileThread(true); toast("Conversazione pronta."); }} />}
    {notice && <div className="toast"><span className="spark" />{notice}</div>}
  </div>;
}

function Composer({ conversationId, onSent, toast }: { conversationId: string; onSent: (message: PublicMessage) => void; toast: (message: string) => void }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    const response = await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { message?: PublicMessage; error?: string } : { error: "Connessione non disponibile." };
    setSending(false);
    if (!response?.ok || !payload.message) { toast(payload.error || "Messaggio non inviato."); return; }
    setBody(""); onSent(payload.message); textRef.current?.focus();
  }

  return <form className="composer" onSubmit={submit}><textarea ref={textRef} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Scrivi un messaggio…" maxLength={4000} rows={1} /><small>{body.length ? `${body.length}/4000` : "INVIO ↵ · A CAPO ⇧↵"}</small><button disabled={!body.trim() || sending} aria-label="Invia"><Icon name="send" /></button></form>;
}

function NewConversation({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void | Promise<void> }) {
  const [emails, setEmails] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recipients = emails.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!recipients.length) { setError("Inserisci almeno un indirizzo email."); return; }
    setBusy(true);
    const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emails: recipients, title }) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { conversationId?: string; error?: string } : { error: "Connessione non disponibile." };
    setBusy(false);
    if (!response?.ok || !payload.conversationId) { setError(payload.error || "Conversazione non creata."); return; }
    await onCreated(payload.conversationId);
  }

  return <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="new-modal" role="dialog" aria-modal="true" aria-labelledby="new-title"><header><div><p>NUOVO SPAZIO</p><h2 id="new-title">Inizia una conversazione</h2></div><button onClick={onClose} aria-label="Chiudi"><Icon name="close" /></button></header><form onSubmit={submit}><label><span>PERSONE</span><textarea value={emails} onChange={(event) => setEmails(event.target.value)} placeholder="nome@email.it" autoFocus /><small>Usa email separate da uno spazio per creare un gruppo.</small></label>{recipients.length > 1 && <label><span>NOME DEL GRUPPO · FACOLTATIVO</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Es. Gruppo di lavoro" maxLength={80} /></label>}{error && <p className="form-error">{error}</p>}<footer><span>{recipients.length} {recipients.length === 1 ? "persona" : "persone"}</span><button disabled={busy || !recipients.length}>{busy ? "Creazione…" : "Continua"}<Icon name="arrow" /></button></footer></form></section></div>;
}

function Brand() { return <a className="brand" href="https://tecnosocialismo.com"><span className="spark" /><span>TECNO<br />SOCIALISMO</span></a>; }
function SuiteLauncher() { return <details className="suite-launcher"><summary><Icon name="grid" /><span>Servizi</span></summary><nav>{suiteLinks.map((link) => <a className={link.current ? "current" : ""} href={link.href} key={link.label}><i>{link.mark}</i><span>{link.label}</span>{link.current && <small>QUI</small>}</a>)}</nav></details>; }
function Avatar({ conversation, viewerId }: { conversation: ConversationSummary; viewerId: string }) { const other = conversation.members.find((item) => item.id !== viewerId); return <span className={`avatar ${conversation.kind}`} aria-hidden="true">{conversation.kind === "notes" ? <Icon name="bookmark" /> : conversation.kind === "group" ? <Icon name="people" /> : initials(other?.name || conversation.title)}</span>; }
function preview(conversation: ConversationSummary, viewerId: string) { if (!conversation.lastMessage) return conversation.kind === "notes" ? "Scrivi qualcosa da ricordare" : "Nessun messaggio"; const prefix = conversation.lastMessage.senderId === viewerId ? "Tu: " : conversation.kind === "group" ? `${conversation.lastMessage.senderName}: ` : ""; return `${prefix}${conversation.lastMessage.body}`; }
function statusLine(conversation: ConversationSummary, viewerId: string) { if (conversation.kind === "notes") return "Solo tu"; const count = conversation.members.filter((item) => item.id !== viewerId).length; return conversation.kind === "group" ? `${conversation.members.length} partecipanti` : count ? "Account Tecnosocialismo" : "Conversazione"; }
function otherPeople(conversation: ConversationSummary, viewerId: string) { return conversation.members.filter((item) => item.id !== viewerId).map((item) => item.name).join(", ") || "te"; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }
function shortTime(value: string) { const date = new Date(value); const now = new Date(); if (date.toDateString() === now.toDateString()) return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(date); return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(date); }
function messageTime(value: string) { return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatDate(value: string) { return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)); }

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>, grid: <><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></>, edit: <><path d="M4 20h4L20 8l-4-4L4 16v4Z" /><path d="m14 6 4 4" /></>, search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>, close: <path d="m6 6 12 12M18 6 6 18" />, bubble: <path d="M4 5h16v12H9l-5 4V5Z" />, info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>, send: <><path d="m3 11 18-8-8 18-2-8-8-2Z" /><path d="m11 13 4-4" /></>, back: <path d="m15 18-6-6 6-6" />, lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>, bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />, people: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5c3 0 4 2 4 4s-1 3-3 3M17 14c3 1 4 3 4 6" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
