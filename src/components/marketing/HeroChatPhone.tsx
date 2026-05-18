'use client';
import { useEffect, useState, useRef } from 'react';

const CONVO = [
  { who: 'in',  text: "Hi! Do you still have the Nike Air Max in size 9?", t: '09:42' },
  { who: 'typing' },
  { who: 'tool', label: 'Inventory · Lookup', detail: 'product = "air max", size = 9' },
  { who: 'out', text: "Hey Sarah 👟 Let me check… yes — 3 pairs in stock at the V&A store. Want me to hold one for you?", t: '09:42' },
  { who: 'in',  text: "Yes please! Until 6pm if possible 🙏", t: '09:43' },
  { who: 'typing' },
  { who: 'tool', label: 'CRM · Create hold', detail: 'customer=#4821, expires=18:00' },
  { who: 'out', text: "Done ✅ Pair held under your name until 18:00. Need directions to the store?", t: '09:43' },
  { who: 'in',  text: "You're a lifesaver 😍", t: '09:44' },
  { who: 'out', text: "Anytime! I'll send a reminder at 17:00 so you don't forget.", t: '09:44' },
] as const;

type Message = typeof CONVO[number];
type VisibleMessage = Message & { _i: number };

function Bubble({ m }: { m: VisibleMessage }) {
  if (m.who === 'typing') {
    return (
      <div style={{alignSelf:'flex-start', background:'#fff', padding:'10px 14px', borderRadius:'14px', borderBottomLeftRadius:'4px', display:'flex', gap:5, boxShadow:'0 1px 1px rgba(0,0,0,.08)'}}>
        <span className="td" /><span className="td" /><span className="td" />
        <style>{`
          .td{width:6px;height:6px;background:#9CA3AF;border-radius:50%;animation:tdot 1.2s infinite}
          .td:nth-child(2){animation-delay:.18s}.td:nth-child(3){animation-delay:.36s}
          @keyframes tdot{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-4px);opacity:1}}
        `}</style>
      </div>
    );
  }
  if (m.who === 'tool') {
    return (
      <div style={{
        alignSelf:'center',
        background:'rgba(11,59,54,.92)',
        color:'#DCF8C6',
        fontFamily:"'JetBrains Mono', monospace",
        fontSize:11, lineHeight:1.4,
        padding:'8px 12px', borderRadius:10,
        border:'1px solid rgba(37,211,102,.25)',
        maxWidth:'88%',
        display:'flex', flexDirection:'column', gap:2,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:6, color:'#25D366', fontWeight:600}}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {m.label}
        </div>
        <div style={{opacity:.75}}>{m.detail}</div>
      </div>
    );
  }
  const isIn = m.who === 'in';
  const text = 'text' in m ? m.text : '';
  const time = 't' in m ? m.t : '';
  return (
    <div style={{
      alignSelf: isIn ? 'flex-start' : 'flex-end',
      background: isIn ? '#fff' : '#D9FDD3',
      color:'#0B1F1C',
      padding:'8px 12px 6px',
      borderRadius:12,
      borderBottomLeftRadius: isIn ? 4 : 12,
      borderBottomRightRadius: isIn ? 12 : 4,
      fontSize:14, lineHeight:1.45,
      maxWidth:'82%',
      boxShadow:'0 1px 1px rgba(0,0,0,.08)',
      position:'relative',
    }}>
      <div>{text}</div>
      <div style={{fontSize:10, color:'#6B807B', textAlign:'right', marginTop:2, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3}}>
        {time}
        {!isIn && (
          <svg width="14" height="14" viewBox="0 0 16 11" fill="none"><path d="M11.071.653a.5.5 0 0 0-.708 0L4.717 6.298 2.207 3.789a.5.5 0 0 0-.707.708l2.864 2.863a.5.5 0 0 0 .708 0L11.07 1.361a.5.5 0 0 0 0-.708Z" fill="#53BDEB"/><path d="M15.071.653a.5.5 0 0 0-.708 0L8.717 6.298l-.51-.51a.5.5 0 1 0-.706.706l.864.864a.5.5 0 0 0 .708 0L15.07 1.361a.5.5 0 0 0 0-.708Z" fill="#53BDEB"/></svg>
        )}
      </div>
    </div>
  );
}

export default function HeroChatPhone() {
  const [visibleCount, setVisibleCount] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= CONVO.length) {
      const r = setTimeout(() => setVisibleCount(1), 3500);
      return () => clearTimeout(r);
    }
    const next = CONVO[visibleCount];
    let delay = 1100;
    if (next?.who === 'typing') delay = 700;
    if (next?.who === 'tool') delay = 900;
    if (next?.who === 'out') delay = 350;
    const t = setTimeout(() => setVisibleCount(c => c + 1), delay);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior:'smooth' });
    }
  }, [visibleCount]);

  const visible: VisibleMessage[] = [];
  for (let i = 0; i < visibleCount; i++) {
    const m = CONVO[i];
    if (m.who === 'typing' && i < visibleCount - 1) continue;
    visible.push({ ...m, _i: i } as VisibleMessage);
  }

  return (
    <div style={{
      position:'relative',
      width:300,
      borderRadius:36,
      background:'#0B1F1C',
      padding:8,
      boxShadow:'0 40px 80px -30px rgba(11,31,28,.45), 0 0 0 1px rgba(11,31,28,.05)',
    }}>
      {/* Speaker notch */}
      <div style={{
        position:'absolute', top:14, left:'50%', transform:'translateX(-50%)',
        width:80, height:18, background:'#0B1F1C', borderRadius:14, zIndex:5,
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
        <div style={{width:6,height:6,borderRadius:50,background:'#1B312D'}}/>
        <div style={{width:32,height:4,borderRadius:8,background:'#1B312D'}}/>
      </div>

      <div style={{
        borderRadius:28, overflow:'hidden', background:'#ECE5DD', position:'relative',
        height:560,
        display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{
          background:'#075E54', padding:'40px 12px 10px',
          display:'flex', alignItems:'center', gap:10, color:'#fff', flexShrink:0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          <div style={{
            width:36, height:36, borderRadius:'50%', background:'#25D366',
            display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
            fontSize:14, fontWeight:700, color:'#075E54',
          }}>
            AI
            <span style={{position:'absolute',bottom:-1,right:-1,width:11,height:11,borderRadius:50,background:'#25D366',border:'2px solid #075E54'}}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14,fontWeight:600}}>Acme Sneakers</div>
            <div style={{fontSize:11,opacity:.75}}>AI agent · online</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>

        {/* Chat body */}
        <div ref={scrollRef} style={{
          flex:1, padding:'14px 10px', display:'flex', flexDirection:'column', gap:8,
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='%23DDD2C3' fill-opacity='.35'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='50' cy='30' r='1'/%3E%3Ccircle cx='25' cy='55' r='1'/%3E%3Ccircle cx='65' cy='65' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor:'#ECE5DD',
          overflow:'hidden',
        }}>
          {visible.map(m => (
            <div key={m._i} style={{display:'flex', flexDirection:'column', animation:'msgIn .3s ease both'}}>
              <Bubble m={m} />
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div style={{
          background:'#F0F0F0', padding:'8px 10px', display:'flex', alignItems:'center', gap:8, flexShrink:0,
        }}>
          <div style={{
            flex:1, background:'#fff', borderRadius:24, padding:'8px 14px',
            display:'flex', alignItems:'center', gap:8, color:'#9CA3AF', fontSize:13,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            Message
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{marginLeft:'auto'}}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </div>
          <div style={{width:36,height:36,borderRadius:'50%',background:'#075E54',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes msgIn { from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }
      `}</style>
    </div>
  );
}
