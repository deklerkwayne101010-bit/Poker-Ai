'use client';

import { useState, useCallback, useMemo } from 'react';
import type {
  Position, OpponentType,
  Recommendation, AnalysisInput,
} from '@/lib/poker/engine';
import { analyzePokerHand, POSITIONS as ALL_POSITIONS } from '@/lib/poker/engine';
import { PREFLOP_OPEN_RANGES } from '@/lib/preflopRanges';

/* ─── helpers ─── */
const SUITS = ['s', 'h', 'd', 'c'] as const;
const RANKS = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'] as const;

const suitChar: Record<string, string> = { s:'♠', h:'♥', d:'♦', c:'♣' };
const suitColor: Record<string, string> = { s:'card-suit-s', h:'card-suit-h', d:'card-suit-d', c:'card-suit-c' };

function all52Cards(): { id: string; label: string; suitClass: string }[] {
  return SUITS.flatMap(s =>
    RANKS.map(r => ({
      id: r + s,
      label: suitChar[s] + (r === 'T' ? '10' : r),
      suitClass: suitColor[s],
    }))
  );
}

function DEFAULT_INPUT(): AnalysisInput {
  return {
    heroCards: ['As', 'Kh'],
    boardCards: [],
    heroPosition: 'BTN',
    gameType: 'CASH',
    potSize: 25, amountToCall: 5, heroStack: 100, effStack: 90,
    activeOpponents: 2, opponentPositions: [], opponentType: 'TAG',
    tournamentM: 12, dealerButton: 0,
  };
}

function actionColor(action: string): string {
  if (['RAISE','BET','JAM'].includes(action)) return 'bg-emerald-600';
  if (action === 'CALL') return 'bg-blue-600';
  if (action === 'FOLD') return 'bg-red-700';
  return 'bg-slate-600';
}

function evColor(ev: string): string {
  if (ev === 'VERY_HIGH') return 'text-emerald-400';
  if (ev === 'HIGH') return 'text-emerald-300';
  if (ev === 'MEDIUM') return 'text-blue-300';
  if (ev === 'LOW') return 'text-amber-400';
  return 'text-red-400';
}

/* ─── main component ─── */
export default function Home() {
  const [input, setInput] = useState<AnalysisInput>(DEFAULT_INPUT());
  const [tab, setTab] = useState<'hero' | 'board'>('hero');
  const [boardSlot, setBoardSlot] = useState(0);
  const [preflop, setPreflop] = useState<string[]>([]);
  const [postflop, setPostflop] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState< (Recommendation & { equity: number; potOddsPct: number; spr: number; sprInfo: { spr: number; label: 'LOW'|'MEDIUM'|'HIGH'; description: string; betSizingMultiplier: number }; positionAdv: number }) | null >(null);

  /* ─── card selection ─── */
  const all52 = useMemo(() => all52Cards(), []);
  const usedCards = useMemo(() => [...input.heroCards, ...input.boardCards], [input.heroCards, input.boardCards]);

  const pickCard = useCallback((id: string) => {
    if (usedCards.includes(id)) return;
    if (tab === 'hero') {
      const idx = input.heroCards.indexOf('__empty__');
      if (idx !== -1) {
        const next = [...input.heroCards];
        next[idx] = id;
        setInput(p => ({ ...p, heroCards: next }));
      }
    } else {
      if (input.boardCards.length >= 5) return;
      setInput(p => ({ ...p, boardCards: [...p.boardCards, id] }));
    }
  }, [tab, usedCards, input.heroCards, input.boardCards]);

  const removeHeroCard = useCallback((idx: number) => {
    const next = [...input.heroCards];
    next[idx] = '__empty__';
    setInput(p => ({ ...p, heroCards: next }));
  }, [input.heroCards]);

  const removeBoardCard = useCallback((idx: number) => {
    setInput(p => ({ ...p, boardCards: p.boardCards.filter((_, i) => i !== idx) }));
  }, []);

  const dealRandom = useCallback(() => {
    const shuffled = [...all52].sort(() => Math.random() - 0.5);
    setInput(p => ({ ...p, heroCards: [shuffled[0].id, shuffled[1].id], boardCards: [] }));
  }, [all52]);

  /* ─── analyze ─── */
  const runAnalysis = useCallback(async () => {
    if (!input.heroCards.includes('__empty__') === false && input.heroCards.filter(c=>c!=='__empty__').length < 2) return;
    if (input.potSize <= 0) return;
    setAnalyzing(true);
    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));
    const res = analyzePokerHand(input);
    setResult(res);
    setAnalyzing(false);
  }, [input]);

  /* ─── canvas ─── */
  const heroDisplay = (input.heroCards.length === 0 ? ['__empty__','__empty__'] : input.heroCards) as string[];
  while (heroDisplay.length < 2) heroDisplay.push('__empty__');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#070d1a 0%,#0a1628 55%,#0d1f35 100%)' }}>
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor:'#1e3a5f', background:'linear-gradient(135deg,#0f1b2e,#172a40)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">♠️</span>
            <div>
              <h1 className="text-base font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-sans)' }}>
                POKER<span className="text-amber-400">AI</span> ASSISTANT
              </h1>
              <p className="text-xs" style={{ color:'#94a3b8' }}>GTO Solver · Real-Time Analysis · All Stakes</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs px-3 py-1 rounded-full border" style={{ borderColor:'#1e3a5f', color:'#94a3b8', background:'#0f1b2e' }}>
              ♟️ Deterministic Engine
            </span>
            <span className="text-xs px-3 py-1 rounded-full border" style={{ borderColor:'#1e3a5f', color:'#94a3b8', background:'#0f1b2e' }}>
              ⚡ &lt;50ms Response
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ── */}
      <main className="max-w-screen-2xl mx-auto px-3 py-4 md:px-6 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

          {/* ══════ LEFT PANEL ══════ */}
          <div className="flex-1 flex flex-col gap-4">

            {/* ── HOLDS CARDS ── */}
            <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
              <div className="section-head">Hero Hole Cards</div>

              {/* Card Toggle */}
              <div className="flex gap-2 mb-3">
                {(['hero','board'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`action-btn ${tab === t ? 'active' : ''}`}
                    style={{ textTransform:'capitalize', letterSpacing:'0' }}
                  >
                    {t === 'hero' ? 'Hole Cards' : 'Board Cards'}
                  </button>
                ))}
                <button onClick={dealRandom} className="action-btn" style={{ marginLeft:'auto' }}>
                  🎲 Deal Random
                </button>
              </div>

              {/* Card Picker Area */}
              <div className="rounded-xl p-4" style={{ background:'#070d1a', border:'1px solid #172a40' }}>
                {tab === 'hero' ? (
                  <div className="flex flex-wrap gap-3 items-center">
                    {heroDisplay.map((c, i) => {
                      const isSelected = c !== '__empty__';
                      const picked = all52.find(x => x.id === c);
                      return (
                        <div key={i} className="relative">
                          {isSelected && picked ? (
                            <div className="relative group">
                              <div className={`poker-card ${picked.suitClass}`}>
                                <div className="card-ranksym">{suitChar[picked.id[1]]}</div>
                                <div className="card-ranktxt">{picked.label}</div>
                              </div>
                              <button
                                onClick={() => removeHeroCard(i)}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                              >×</button>
                            </div>
                          ) : (
                            <button onClick={() => {}} className="poker-card card-empty">
                              <span style={{ fontSize:'0.7rem', color:'#64748b' }}>+ Card</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-3">
                      {['Flop (3)','Turn (1)','River (1)'].map((lbl, i) => (
                        <button
                          key={i}
                          onClick={() => setBoardSlot(i)}
                          className={`text-xs px-3 py-1.5 rounded-full border ${boardSlot === i ? 'bg-blue-600 border-blue-500 text-white' : 'text-slate-400 border-slate-700'}`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[0,1,2,3,4].map(i => {
                        const c = input.boardCards[i];
                        const picked = c ? all52.find(x => x.id === c) : null;
                        return (
                          <div key={i} className="relative">
                            {picked ? (
                              <div className="relative group">
                                <div className={`poker-card ${picked.suitClass}`}>
                                  <div className="card-ranksym">{suitChar[picked.id[1]]}</div>
                                  <div className="card-ranktxt">{picked.label}</div>
                                </div>
                                <button
                                  onClick={() => removeBoardCard(i)}
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                                >×</button>
                              </div>
                            ) : (
                              <button className="poker-card card-empty">
                                <span style={{ fontSize:'0.65rem', color:'#64748b' }}>—</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* unpack all cards button */}
              {tab === 'hero' && (
                <div className="mt-3">
                  <div className="section-head">Pick Hole Cards</div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {all52.map(c => {
                      const isUsed = usedCards.includes(c.id);
                      const isHero = input.heroCards.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => pickCard(c.id)}
                          disabled={isUsed}
                          title={c.id}
                          className={`poker-card ${c.suitClass}`}
                          style={{
                            width: 36, height: 50,
                            fontSize: '0.85rem',
                            border: isHero ? '2px solid #f59e0b' : isUsed ? '1px solid transparent' : '1px solid #1e3a5f',
                            boxShadow: isHero ? '0 0 6px rgba(245,158,11,.4)' : undefined,
                            opacity: isUsed && !isHero ? 0.3 : 1,
                            cursor: isUsed && !isHero ? 'not-allowed' : 'pointer',
                            background: isUsed && !isHero ? 'transparent' : '#f8fafc',
                          }}
                        >
                          <div className="card-ranksym" style={{ fontSize:'0.9rem' }}>{suitChar[c.id[1]]}</div>
                          <div className="card-ranktxt">{c.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {tab === 'board' && (
                <div className="mt-3">
                  <div className="section-head">Pick Board Card</div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {all52.map(c => {
                      const isUsed = usedCards.includes(c.id);
                      const isBoard = input.boardCards.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => pickCard(c.id)}
                          disabled={isUsed}
                          title={c.id}
                          className={`poker-card ${c.suitClass}`}
                          style={{
                            width: 36, height: 50,
                            fontSize: '0.85rem',
                            border: isBoard ? '2px solid #3b82f6' : isUsed ? '1px solid transparent' : '1px solid #1e3a5f',
                            boxShadow: isBoard ? '0 0 6px rgba(59,130,246,.4)' : undefined,
                            opacity: isUsed && !isBoard ? 0.3 : 1,
                            cursor: isUsed && !isBoard ? 'not-allowed' : 'pointer',
                            background: isUsed && !isBoard ? 'transparent' : '#f8fafc',
                          }}
                        >
                          <div className="card-ranksym" style={{ fontSize:'0.9rem' }}>{suitChar[c.id[1]]}</div>
                          <div className="card-ranktxt">{c.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ── POSITION & SETTINGS ── */}
            <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
              <div className="section-head">Position &amp; Players</div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Hero Position</label>
                  <select
                    className="input-field"
                    value={input.heroPosition}
                    onChange={e => setInput(p => ({ ...p, heroPosition: e.target.value as Position }))}
                  >
                    {ALL_POSITIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Players</label>
                  <select
                    className="input-field"
                    value={input.activeOpponents + 1}
                    onChange={e => {
                      const t = parseInt(e.target.value);
                      setInput(p => ({ ...p, activeOpponents: t - 1 }));
                    }}
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} Players</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Opponent Type</label>
                  <select
                    className="input-field"
                    value={input.opponentType}
                    onChange={e => setInput(p => ({ ...p, opponentType: e.target.value as OpponentType }))}
                  >
                    {(['Nit','Tight','TAG','LAG','Maniac','Unknown'] as OpponentType[]).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Tournament M</label>
                  <input
                    className="input-field mono"
                    type="number"
                    min={0}
                    step={1}
                    value={input.gameType === 'TOURNAMENT' ? input.tournamentM : 0}
                    disabled={input.gameType === 'CASH'}
                    onChange={e => setInput(p => ({ ...p, tournamentM: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Game Type Toggle */}
              <div className="mb-4">
                <div className="section-head">Game Type</div>
                <div className="flex gap-2">
                  {(['CASH','TOURNAMENT'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setInput(p => ({ ...p, gameType: g }))}
                      className={`action-btn ${input.gameType === g ? 'active' : ''}`}
                    >
                      {g === 'CASH' ? '💰 Cash Game' : '🏆 Tournament'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blinds */}
              <div>
                <div className="section-head">Blind Structure</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Small Blind</label>
                    <input
                      className="input-field mono"
                      type="number"
                      step={0.25}
                      value={input.potSize > 0 ? 0.5 : 1}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Big Blind</label>
                    <input
                      className="input-field mono"
                      type="number"
                      step={0.25}
                      value={1}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>Ante</label>
                    <input
                      className="input-field mono"
                      type="number"
                      step={0.25}
                      value={0}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── STACK & POT ── */}
            <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
              <div className="section-head">Stack &amp; Pot Sizes</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'Hero Stack', key:'heroStack', suffix: 'bb', val: input.heroStack },
                  { label:'Eff. Stack', key:'effStack', suffix: 'bb', val: input.effStack },
                  { label:'Pot Size', key:'potSize', suffix: 'bb', val: input.potSize },
                  { label:'To Call', key:'amountToCall', suffix: 'bb', val: input.amountToCall },
                ].map(({ label, key, suffix, val }) => (
                  <div key={key}>
                    <label className="text-xs mb-1 block" style={{ color:'#94a3b8' }}>{label}</label>
                    <div className="flex items-center">
                      <input
                        className="input-field mono flex-1"
                        type="number"
                        step={0.5}
                        value={val}
                        onChange={e => setInput(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                      />
                      <span className="ml-2 text-xs whitespace-nowrap" style={{ color:'#64748b' }}>{val.toFixed(1)} {suffix}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── ACTION HISTORY ── */}
            <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
              <div className="section-head">Action History</div>

              <div className="mb-3">
                <div className="text-xs mb-2" style={{ color:'#94a3b8' }}>Preflop</div>
                <div className="flex flex-wrap gap-2">
                  {['Limp','Raise','3-Bet','4-Bet','Call'].map(a => (
                    <button
                      key={a}
                      onClick={() => setPreflop(prev => prev.includes(a) ? prev.filter(x=>x!==a) : [...prev,a])}
                      className={`action-btn ${preflop.includes(a) ? 'active' : ''}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs mb-2" style={{ color:'#94a3b8' }}>Postflop</div>
                <div className="flex flex-wrap gap-2">
                  {['Check','Bet','Raise','Call','All-In'].map(a => (
                    <button
                      key={a}
                      onClick={() => setPostflop(prev => prev.includes(a) ? prev.filter(x=>x!==a) : [...prev,a])}
                      className={`action-btn ${postflop.includes(a) ? 'active' : ''}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </section>

          </div>
          {/* end left panel */}

          {/* ══════ RIGHT PANEL ══════ */}
          <div className="flex-1 flex flex-col gap-4">

            {/* ── ANALYZE BUTTON ── */}
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full py-3.5 px-6 rounded-xl font-black text-white text-base tracking-wider uppercase transition-all active:scale-[.98]"
              style={{
                background: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                boxShadow: '0 4px 24px rgba(139,92,246,.35), 0 0 0 1px rgba(139,92,246,.5)',
              }}
            >
              {analyzing ? '⚡ ANALYZING…' : '♟️ ANALYZE HAND'}
            </button>

            {/* ── RESULTS ── */}
            {analyzing && (
              <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
                <div className="skel skel-bar w-2/3 mb-3"></div>
                <div className="skel h-20 mb-4"></div>
                <div className="grid grid-cols-3 gap-3">
                  {[0,1,2].map(i => <div key={i} className="skel h-10" />)}
                </div>
              </section>
            )}

            {!analyzing && result && (
              <>
                {/* ── RECOMMENDATION CARD ── */}
                <section className="rounded-2xl p-6" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
                  <div className="section-head mb-5">AI Recommendation</div>

                  {/* HERO EQUITY & METRICS ROW */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      ['Equity', (result.equity * 100).toFixed(1) + '%', '#3b82f6'],
                      ['Pot Odds', (result.potOddsPct * 100).toFixed(1) + '%', '#8b5cf6'],
                      ['SPR', result.spr.toFixed(1) + ' (' + result.sprInfo.label + ')', '#22c55e'],
                    ].map(([label, val, color]) => (
                      <div key={label as string}
                        className="rounded-xl p-3 text-center"
                        style={{ background:'#070d1a', border:'1px solid #1e3a5f' }}>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:'#64748b' }}>{label as string}</div>
                        <div className="text-lg font-black font-mono" style={{ color }}>{val as string}</div>
                      </div>
                    ))}
                  </div>

                  {/* ─── POKER CHIP BADGE ─── */}
                  <div className="flex justify-center mb-6">
                    <div
                      className={`chip-badge chip-stripes p-6 transform -rotate-1 scale-100 w-52 h-52 flex flex-col items-center justify-center transition-all duration-300 ${(result.action === 'BET' || result.action === 'RAISE') && result.betSize.match(/^1\.0x/) ? 'chip-streak' : ''}`}
                      style={{
                        background: actionColor(result.action),
                        minWidth: 200,
                        maxWidth: 200,
                        height: 200,
                        borderRadius: '50%',
                        padding: '24px',
                        transform: 'rotate(-2deg)',
                      }}
                    >
                      <div className="chip-face flex flex-col items-center justify-center">
                        <div
                          className="font-black text-white tracking-tight"
                          style={{
                            fontSize: result.action === 'FOLD' ? '2.25rem' : 'clamp(1.75rem, 5vw, 3rem)',
                            lineHeight: 1.1,
                            textShadow: '0 2px 4px rgba(0,0,0,.5) inset, 0 1px 0 rgba(255,255,255,.2)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {result.action === 'BET' || result.action === 'RAISE' ? `▲ ${result.action}` : result.action}
                        </div>
                        <div className="mt-2 font-mono text-white/90 text-sm font-bold tracking-widest">
                          {result.betSize}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Bars */}
                  <div className="space-y-3">
                    {/* Confidence */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs uppercase font-bold tracking-wider" style={{ color:'#94a3b8' }}>Confidence</span>
                        <span className="text-sm font-black font-mono" style={{ color:'#f59e0b' }}>{result.confidence}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1e3a5f' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${result.confidence}%`, background:'linear-gradient(90deg,#f59e0b,#f97316)', minWidth: result.confidence > 0 ? '4px' : '0px' }}
                        />
                      </div>
                    </div>

                    {/* EV */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs uppercase font-bold tracking-wider" style={{ color:'#94a3b8' }}>EV Score</span>
                        <span className={`text-sm font-black font-mono ${evColor(result.ev)}`}>{result.ev.replace('_',' ')}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1e3a5f' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${result.ev === 'VERY_HIGH' ? 95 : result.ev==='HIGH'?80:result.ev==='MEDIUM'?60:result.ev==='LOW'?25:10}%`,
                            background:'linear-gradient(90deg,#22c55e,#3b82f6)', minWidth:'4px' }}
                        />
                      </div>
                    </div>

                    {/* Risk */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs uppercase font-bold tracking-wider" style={{ color:'#94a3b8' }}>Risk Level</span>
                        <span className="text-sm font-bold">{result.risk}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1e3a5f' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${result.risk==='HIGH'?90:result.risk==='MEDIUM'?60:25}%`,
                            background: 'linear-gradient(90deg,#ef4444,#f59e0b,#22c55e)',
                            backgroundPosition: result.risk==='HIGH'?'100% 0':result.risk==='MEDIUM'?'50% 0':'0% 0',
                            minWidth:'4px' }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── REASONING ── */}
                {result.reasoning.length > 0 && (
                  <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
                    <div className="section-head mb-4">Reasoning</div>
                    <ul className="space-y-2.5">
                      {result.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background:'#3b82f6' }}>✓</span>
                          <span className="text-sm leading-relaxed" style={{ color:'#cbd5e1' }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* ── POSITION ADVANTAGE ── */}
                {result.positionAdv !== undefined && (
                  <section className="rounded-2xl p-5" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
                    <div className="section-head mb-3">Position &amp; Context</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ['Position Adv.', result.positionAdv >= 0 ? `+${result.positionAdv.toFixed(2)}` : result.positionAdv.toFixed(2), result.positionAdv >= 0 ? '#22c55e' : '#ef4444'],
                        ['Action', result.action, '#3b82f6'],
                        ['Bet Size', result.betSize, '#8b5cf6'],
                        ['Summary', result.summary, '#94a3b8'],
                      ].map(([label, val, color]) => (
                        <div key={label as string}
                          className="rounded-xl p-3"
                          style={{ background:'#070d1a', border:'1px solid #1e3a5f' }}>
                          <div className="text-[0.625rem] uppercase tracking-wider mb-1 font-bold" style={{ color:'#64748b' }}>{label as string}</div>
                          <div className="text-sm font-black font-mono" style={{ color }}>{val as string}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ── EMPTY STATE ── */}
            {!result && !analyzing && (
              <section className="rounded-2xl p-8 text-center" style={{ background:'#0f1b2e', border:'1px dashed #1e3a5f' }}>
                <div className="text-5xl mb-4 opacity-40">♟️</div>
                <p className="text-sm font-semibold text-white mb-1">Ready to Analyze</p>
                <p className="text-xs" style={{ color:'#64748b' }}>
                  Select your hole cards, configure the game state, then hit <b style={{ color:'#f59e0b' }}>Analyze Hand</b>.
                </p>
              </section>
            )}

            {/* ── PREFLOP RANGES (mobile: collapsed &lt; 768px) ── */}
            <details className="lg:hidden rounded-2xl" style={{ background:'#0f1b2e', border:'1px solid #1e3a5f' }}>
              <summary className="p-4 cursor-pointer text-sm font-bold uppercase tracking-wider" style={{ color:'#94a3b8' }}>
                📋 Preflop Ranges
              </summary>
              <div className="px-4 pb-4">
                <RangeExplorer />
              </div>
            </details>
            <div className="hidden lg:block">
              <RangeExplorer />
            </div>

          </div>
          {/* end right panel */}
        </div>
      </main>

      {/* ════ INLINE PREFLOP RANGES COMPONENT ════ */}
      <style>{`
        .range-label { color:#94a3b8; font-size:0.825rem; font-weight:700; }
        .range-row { display:grid; grid-template-columns:80px 1fr; gap:4px; align-items:center; padding:3px 0; border-bottom:1px solid #1e3a5f; }
        .range-hands { display:flex; flex-wrap:wrap; gap:2px 6px; }
        .range-chip { display:inline-flex; align-items:center; gap:2px; font-size:0.6rem; font-weight:800; padding:2px 8px; border-radius:999px; background:#172a40; border:1px solid #1e3a5f; color:#cbd5e1; }
      `}</style>
    </div>
  );
}

/* ─── Range Explorer inline component (serialized, single render) ─── */
function RangeExplorer() {
  const heroes = ['AA','KK','QQ','JJ','TT','99','88','AKs','AQs','AJs','ATs','KQs','QJs','JTs','T9s','98s','87s','76s','AKo','AQo','AJo'];
  const positions = ['UTG','UTG1','MP','HJ','CO','BTN','SB','BB'] as const;
  const [selPos, setSelPos] = useState<typeof positions[number]>('BTN');
  const [search] = useState('');

  const range = PREFLOP_OPEN_RANGES[selPos];
  const filtered = search
    ? heroes.filter(h => h.includes(search.toUpperCase()))
    : heroes;

  function inRange(h: string, pos: typeof positions[number]) {
    return PREFLOP_OPEN_RANGES[pos]?.hands.includes(h) ?? false;
  }

  return (
    <div className="space-y-3 pt-2 pb-1">
      <div className="flex items-center gap-2 flex-wrap">
        {positions.map(p => (
          <button
            key={p}
            onClick={() => setSelPos(p)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selPos === p
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
              : 'text-slate-400 border border-slate-700 hover:border-blue-500/50 hover:text-slate-200'}`}
          >
            {p === 'UTG1' ? 'UTG+1' : p}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">Range:</span>
          <span className="text-xs font-bold text-amber-400">{range?.percentage ?? 0}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {filtered.map(h => {
          const matched = inRange(h, selPos);
          return (
            <div
              key={h}
              className={`range-row rounded-lg px-2 py-1.5 ${matched ? 'bg-blue-900/10' : ''}`}
              style={!matched ? { opacity: '.4' } : {}}
            >
              <span className="range-label">{h}</span>
              <div className="range-hands text-[0.62rem]">
                {range && range.hands.includes(h) && (
                  <span className="range-chip" style={{ color: matched ? '#60a5fa' : '#94a3b8', borderColor:'matched ? #3b82f6/50 : #1e3a5f', background: matched ? '#1e3a8a' : '#172a40' }}>
                    ✓ In {selPos} range
                  </span>
                )}
                {!range?.hands.includes(h) && <span className="range-chip">✗</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
