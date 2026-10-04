import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Bookmark, BookOpen, BrainCircuit,
  BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock3,
  Code2, Flame, Grid2X2, Layers3, LayoutGrid, ListChecks, Menu, Moon, Search, Settings2, Sparkles,
  Star, Sun, Target, TrendingUp, Trophy, X, Zap, FileText, Save, PlaySquare
} from 'lucide-react'
import { loadSheets, TOPIC_ORDER } from './lib/parseSheets'
import type { Problem, ProgressState, Sheet } from './types'
import { useAuth } from './lib/AuthContext'
import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from './lib/firebase'
const sheets = loadSheets()
const STORAGE_KEY = 'dsagrind-progress-v1'

const iconMap = {
  target: Target,
  layers: Layers3,
  code: Code2,
  briefcase: BriefcaseBusiness,
}

const difficultyRank = { Easy: 0, Medium: 1, Hard: 2 }
type View = 'home' | 'sheet' | 'bookmarks' | 'all' | 'leaderboard' | 'mock' | 'profile' | 'contests'
type NavTarget = 'home' | 'bookmarks' | 'all' | 'leaderboard' | 'mock' | 'profile' | 'contests'

// Rewrite any legacy sheet-scoped ids ("slug:title") to the canonical
// per-question id and drop duplicates, so old saved progress carries over and
// the same problem stays in sync across every sheet it appears in.
function migrateProgress(raw: unknown): ProgressState {
  const base = (raw && typeof raw === 'object' ? raw : {}) as Partial<ProgressState>
  const legacyToCanonical: Record<string, string> = {}
  sheets.forEach((sheet) => sheet.problems.forEach((problem) => {
    const legacy = `${sheet.slug}:${problem.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    legacyToCanonical[legacy] = problem.id
  }))
  const remap = (ids?: string[]) => Array.from(new Set((ids ?? []).map((id) => legacyToCanonical[id] ?? id)))
  const remapNotes = (notes?: Record<string, string>) => {
    if (!notes) return {}
    const newNotes: Record<string, string> = {}
    Object.entries(notes).forEach(([id, text]) => { newNotes[legacyToCanonical[id] ?? id] = text })
    return newNotes
  }
  return { completed: remap(base.completed), bookmarked: remap(base.bookmarked), notes: remapNotes(base.notes), completionDates: base.completionDates || {}, leetcodeUsername: base.leetcodeUsername }
}

function useProgress() {
  const { user } = useAuth();
  const [state, setState] = useState<ProgressState>(() => {
    try {
      return migrateProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
    } catch {
      return { completed: [], bookmarked: [], notes: {}, completionDates: {} }
    }
  })

  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
      try {
        const docRef = doc(db, 'progress', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as ProgressState;
          setState((local) => {
            const mergedCompleted = Array.from(new Set([...local.completed, ...(cloudData.completed || [])]));
            const mergedBookmarked = Array.from(new Set([...local.bookmarked, ...(cloudData.bookmarked || [])]));
            const mergedNotes = { ...(local.notes || {}), ...(cloudData.notes || {}) };
            const mergedDates = { ...(local.completionDates || {}), ...(cloudData.completionDates || {}) };
            return { completed: mergedCompleted, bookmarked: mergedBookmarked, notes: mergedNotes, completionDates: mergedDates, leetcodeUsername: cloudData.leetcodeUsername || local.leetcodeUsername };
          });
        }
      } catch (e) {
        console.error("Error fetching progress:", e);
      }
    };
    fetchProgress();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (user) {
      const syncToCloud = async () => {
        try {
          const payload = {
            ...state,
            completedCount: state.completed.length,
            displayName: user.displayName || 'Anonymous Developer',
            photoURL: user.photoURL || '',
            lastActive: new Date().toISOString(),
          };
          // Firebase doesn't allow undefined values
          if (payload.leetcodeUsername === undefined) {
            delete payload.leetcodeUsername;
          }
          await setDoc(doc(db, 'progress', user.uid), payload);
        } catch (e) {
          console.error("Error saving progress to cloud:", e);
        }
      };
      syncToCloud();
    }
  }, [state, user]);

  const toggle = (key: keyof ProgressState, id: string) => {
    if (key === 'notes' || key === 'completionDates' || key === 'leetcodeUsername') return;
    setState((current) => {
      const arr = current[key] as string[];
      const isCompleted = arr.includes(id);
      const nextArr = isCompleted ? arr.filter((item) => item !== id) : [...arr, id];
      const updates: Partial<ProgressState> = { [key]: nextArr };
      if (key === 'completed') {
        const dates = { ...(current.completionDates || {}) };
        if (!isCompleted) dates[id] = new Date().toISOString().split('T')[0];
        else delete dates[id];
        updates.completionDates = dates;
      }
      return { ...current, ...updates };
    });
  }
  const saveNote = (id: string, text: string) => setState((current) => ({ ...current, notes: { ...current.notes, [id]: text } }))
  const updateLeetcodeUsername = (username: string) => setState((current) => ({ ...current, leetcodeUsername: username }))

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DSA_GRIND_SYNC' && Array.isArray(event.data.completed)) {
        const newIds: string[] = event.data.completed;
        setState((current) => {
          const merged = Array.from(new Set([...current.completed, ...newIds]));
          const dates = { ...(current.completionDates || {}) };
          const today = new Date().toISOString().split('T')[0];
          newIds.forEach((id: string) => { if (!dates[id]) dates[id] = today; });
          return { ...current, completed: merged, completionDates: dates };
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return { state, toggle, saveNote, updateLeetcodeUsername }
}

function Logo({ onClick }: { onClick?: () => void }) {
  const interactive = Boolean(onClick)
  return (
    <div
      className={`logo-wrap${interactive ? ' clickable' : ''}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.() } } : undefined}
      aria-label={interactive ? 'DSA Grind home' : undefined}
    >
      <div className="logo-mark"><Code2 size={20} strokeWidth={2.5} /></div>
      <span>DSA<span> Grind</span></span>
    </div>
  )
}

const REPO_URL = 'https://github.com/sumitsingh4411/faang'
const REPO_SLUG = 'sumitsingh4411/faang'

// lucide-react ships no brand marks, so the GitHub logo is inlined.
function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  )
}

function Header({ theme, setTheme, onMenu, view, navigate, solved }: { theme: string; setTheme: (theme: string) => void; onMenu: () => void; view: View; navigate: (view: NavTarget) => void; solved: number }) {
  const { user, loginWithGoogle, logout } = useAuth();
  // The bar sits flush with the page until you scroll, then earns its hairline
  // and shadow — so it reads as chrome lifting over the content, not a box.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`topbar${scrolled ? ' scrolled' : ''}`}>
      <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <Logo onClick={() => navigate('home')} />
      <nav className="desktop-nav" aria-label="Main navigation">
        <button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Explore</button>
        <button onClick={() => { navigate('home'); setTimeout(() => document.getElementById('sheets')?.scrollIntoView(), 50) }}>Sheets</button>
        <button className={view === 'all' ? 'active' : ''} onClick={() => navigate('all')}>All Problems</button>
        <button className={view === 'leaderboard' ? 'active' : ''} onClick={() => navigate('leaderboard')}>Leaderboard</button>
        <button className={view === 'mock' ? 'active' : ''} onClick={() => navigate('mock')}>Mock Interview</button>
        <button className={view === 'contests' ? 'active' : ''} onClick={() => navigate('contests')}>Contests</button>
        <button className={view === 'profile' ? 'active' : ''} onClick={() => navigate('profile')}>Profile</button>
      </nav>
      <div className="top-actions">
        {user ? (
          <button className="solved-chip" onClick={() => navigate('profile')} title="View profile" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <img src={user.photoURL || ''} alt="avatar" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            <strong>{user.displayName?.split(' ')[0]}</strong>
          </button>
        ) : (
          <button className="solved-chip" onClick={loginWithGoogle} title="Sign in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <strong>Sign In</strong>
          </button>
        )}
        <button className="solved-chip desktop-only" onClick={() => navigate('profile')} title="View your profile">
          <CheckCircle2 size={13} strokeWidth={2.6} />
          <strong>{solved}</strong> solved
        </button>
        <button className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}

function Sidebar({ open, close, view, setView }: { open: boolean; close: () => void; view: string; setView: (view: NavTarget) => void }) {
  const navigate = (next: NavTarget) => { setView(next); close() }
  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={close} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={close}><X size={20} /></button>
        <p className="nav-label">Workspace</p>
        <button className={view === 'home' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('home')}><Grid2X2 size={18} /> Overview</button>
        <a className="nav-item" href="#sheets" onClick={close}><BookOpen size={18} /> Study sheets</a>
        <button className={view === 'bookmarks' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('bookmarks')}><Bookmark size={18} /> Bookmarks</button>
        <button className={view === 'leaderboard' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('leaderboard')}><Trophy size={18} /> Leaderboard</button>
        <button className={view === 'profile' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('profile')}><BarChart3 size={18} /> Profile</button>
        <p className="nav-label second">Practice</p>
        <a className="nav-item" href="#daily" onClick={close}><Zap size={18} /> Daily challenge <span className="new-pill">NEW</span></a>
        <button className={view === 'mock' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('mock')}><Clock3 size={18} /> Mock interview</button>
        <button className={view === 'contests' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('contests')}><CalendarDays size={18} /> Contests</button>
        <button className={view === 'all' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('all')}><ListChecks size={18} /> All problems</button>
        <div className="streak-card">
          <div className="streak-icon"><Flame size={19} fill="currentColor" /></div>
          <div><strong>3 day streak</strong><span>Keep the momentum going!</span></div>
        </div>
        <button className="nav-item settings"><Settings2 size={18} /> Settings</button>
      </aside>
    </>
  )
}

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: string | number; label: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>
}

function ProgressRing({ value, size = 46 }: { value: number; size?: number }) {
  const radius = 19
  const circumference = 2 * Math.PI * radius
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48"><circle className="ring-bg" cx="24" cy="24" r={radius} /><circle className="ring-value" cx="24" cy="24" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} /></svg>
      <span>{value}%</span>
    </div>
  )
}

function SheetCard({ sheet, completed, onOpen }: { sheet: Sheet; completed: string[]; onOpen: () => void }) {
  const Icon = iconMap[sheet.icon as keyof typeof iconMap] || Code2
  const difficultyCounts = sheet.problems.reduce((acc, p) => ({ ...acc, [p.difficulty]: acc[p.difficulty] + 1 }), { Easy: 0, Medium: 0, Hard: 0 })
  const cardRef = useRef<HTMLElement>(null)

  // What the roadmap actually covers, heaviest topic first — the useful answer
  // to "what am I signing up for" before you open a 450-problem sheet.
  const topics = useMemo(() => {
    const counts = new Map<string, number>()
    sheet.problems.forEach((problem) => counts.set(problem.topic, (counts.get(problem.topic) ?? 0) + 1))
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [sheet])

  // Drive the 3D tilt, the parallax and the glare position from the pointer.
  // Written straight to CSS custom properties rather than through state, so
  // moving across a card never re-renders the grid.
  const tilt = (event: React.MouseEvent) => {
    const card = cardRef.current
    if (!card || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const box = card.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    card.style.setProperty('--px', String(x - 0.5))
    card.style.setProperty('--py', String(y - 0.5))
    card.style.setProperty('--mx', `${x * 100}%`)
    card.style.setProperty('--my', `${y * 100}%`)
  }
  const level = () => {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--px', '0')
    card.style.setProperty('--py', '0')
  }

  return (
    <article ref={cardRef} className={`glass-card accent-${sheet.accent}`} onClick={onOpen} onMouseMove={tilt} onMouseLeave={level} tabIndex={0} role="button" aria-label={`Open ${sheet.title}, ${sheet.problems.length} problems`} onKeyDown={(event) => event.key === 'Enter' && onOpen()}>
      <span className="gc-glare" aria-hidden="true" />
      <span className="gc-figure" aria-hidden="true">{sheet.problems.length}</span>
      <span className="gc-by"><Icon size={11} /> {sheet.author}</span>
      <h3>
        {sheet.title}
        {sheet.featured && <span className="gc-flag">essential</span>}
      </h3>
      <p className="gc-desc">{sheet.description}</p>
      <div className="gc-topics">
        {topics.slice(0, 3).map(([topic, count]) => (
          <span className="gc-chip" key={topic}>{topic}<b>{count}</b></span>
        ))}
        {topics.length > 3 && <span className="gc-more">+{topics.length - 3} more</span>}
      </div>
      <span className="gc-meter" role="img" aria-label={`${difficultyCounts.Easy} easy, ${difficultyCounts.Medium} medium, ${difficultyCounts.Hard} hard`}>
        <i className="easy" style={{ flexGrow: difficultyCounts.Easy }} />
        <i className="medium" style={{ flexGrow: difficultyCounts.Medium }} />
        <i className="hard" style={{ flexGrow: difficultyCounts.Hard }} />
      </span>
      <div className="gc-foot">
        <span className="gc-nums" aria-hidden="true">
          <b className="easy">{difficultyCounts.Easy}</b><s>/</s>
          <b className="medium">{difficultyCounts.Medium}</b><s>/</s>
          <b className="hard">{difficultyCounts.Hard}</b>
        </span>
        <span className="gc-right">
          <span className="gc-est">{sheet.estimated}</span>
          <span className="gc-go">Start <ArrowRight size={15} /></span>
        </span>
      </div>
    </article>
  )
}

function DailyChallenge({ problem, done, toggle }: { problem?: Problem; done: boolean; toggle: () => void }) {
  if (!problem) return null
  return (
    <section className="daily-card" id="daily">
      <div className="daily-glow" />
      <div className="daily-content">
        <div className="daily-label"><Zap size={15} fill="currentColor" /> Daily challenge</div>
        <h2>{problem.title}</h2>
        <p>Sharpen your pattern recognition with today’s hand-picked problem.</p>
        <div className="daily-meta"><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span><BrainCircuit size={15} /> {problem.pattern}</span></div>
      </div>
      <div className="daily-actions">
        <button className={`complete-button ${done ? 'done' : ''}`} onClick={toggle}>{done ? <Check size={17} /> : <Circle size={17} />}{done ? 'Completed' : 'Mark complete'}</button>
        <a className="primary-button" href={problem.url} target="_blank" rel="noreferrer">Solve on LeetCode <ArrowRight size={16} /></a>
      </div>
    </section>
  )
}

function HomeView({ completed, onOpen, onBrowseAll }: { completed: string[]; onOpen: (sheet: Sheet) => void; onBrowseAll: () => void }) {
  const unique = useMemo(() => {
    const seen = new Set<string>()
    return sheets.flatMap((sheet) => sheet.problems).filter((problem) => !seen.has(problem.id) && seen.add(problem.id))
  }, [])
  const diff = useMemo(() => unique.reduce((acc, p) => { acc[p.difficulty] += 1; return acc }, { Easy: 0, Medium: 0, Hard: 0 }), [unique])
  const today = unique.find((problem) => problem.title === 'Longest Substring Without Repeating Characters') || unique[0]
  const [filter, setFilter] = useState('All sheets')
  const visibleSheets = sheets.filter((sheet) => filter === 'All sheets' || (filter === 'Beginner friendly' ? sheet.problems.filter(p => p.difficulty === 'Easy').length >= 3 : sheet.featured))

  return (
    <main className="main-content">
      <section className="hero" id="daily">
        <div className="hero-copy">
          <p className="hero-kicker"><span className="kicker-dot" /> curated · tracked · offer-ready</p>
          <h1>Master DSA.<br /><span>Land the offer.</span></h1>
          <p className="hero-sub">{sheets.length} legendary roadmaps, {unique.length} must-do problems, and one tracker that keeps your progress in sync across every list.</p>
          <div className="hero-ctas">
            <button className="hero-cta primary" onClick={() => document.getElementById('sheets')?.scrollIntoView({ behavior: 'smooth' })}>Explore roadmaps <ArrowRight size={16} /></button>
            <button className="hero-cta ghost" onClick={onBrowseAll}>Browse all problems</button>
          </div>
          <div className="hero-cred">
            <span><Layers3 size={14} /> {sheets.length} roadmaps</span>
            <span><ListChecks size={14} /> {unique.length} problems</span>
            <span><Code2 size={14} /> every link → LeetCode</span>
          </div>
        </div>

        {today && (
          <aside className="console">
            <div className="console-bar"><i /><i /><i /><span>dsagrind — today</span></div>
            <div className="console-body">
              <p className="console-kicker">Today's problem <span className={`difficulty ${today.difficulty.toLowerCase()}`}>{today.difficulty}</span></p>
              <a className="console-title" href={today.url} target="_blank" rel="noreferrer">{today.title}</a>
              <p className="console-pattern"><BrainCircuit size={14} /> {today.pattern}</p>
              <div className="console-actions">
                <a className="console-solve" href={today.url} target="_blank" rel="noreferrer">Solve on LeetCode <ArrowRight size={15} /></a>
                <button className={`console-check ${completed.includes(today.id) ? 'done' : ''}`} onClick={() => document.dispatchEvent(new CustomEvent('toggle-complete', { detail: today.id }))} aria-label={completed.includes(today.id) ? "Mark today's problem incomplete" : "Mark today's problem complete"}>{completed.includes(today.id) ? <Check size={16} strokeWidth={3} /> : <Circle size={16} />}</button>
              </div>
              <div className="console-divider" />
              <p className="console-kicker">Library pulse</p>
              <div className="pulse-bar" role="img" aria-label={`${diff.Easy} easy, ${diff.Medium} medium, ${diff.Hard} hard`}>
                <i className="easy" style={{ flexGrow: diff.Easy }} />
                <i className="medium" style={{ flexGrow: diff.Medium }} />
                <i className="hard" style={{ flexGrow: diff.Hard }} />
              </div>
              <div className="pulse-legend">
                <span><i className="dot easy" />{diff.Easy} Easy</span>
                <span><i className="dot medium" />{diff.Medium} Medium</span>
                <span><i className="dot hard" />{diff.Hard} Hard</span>
              </div>
            </div>
          </aside>
        )}
      </section>

      <section className="sheets-section" id="sheets">
        <div className="section-heading"><div><span className="section-kicker">CURATED ROADMAPS</span><h2>Choose your path</h2><p>Battle-tested problem sets built by the DSA community.</p></div>
          <div className="select-wrap"><Settings2 size={15} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All sheets</option><option>Popular</option><option>Beginner friendly</option></select><ChevronDown size={15} /></div>
        </div>
        <div className="glass-grid">{visibleSheets.map((sheet) => <SheetCard key={sheet.slug} sheet={sheet} completed={completed} onOpen={() => onOpen(sheet)} />)}</div>
      </section>
      <section className="quote-card">
        <Star size={19} fill="currentColor" />
        <blockquote>“Jab tak phodenge nahi tab tak chhodenge nahi”</blockquote>
        <span>— Owner</span>
        <div className="owner-leetcode-container">
          <a href="https://leetcode.com/u/pankaj4396/" target="_blank" rel="noreferrer" className="owner-leetcode-link">
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" alt="LeetCode" className="leetcode-logo" />
            <span className="leetcode-text">pankaj4396</span>
          </a>
        </div>
      </section>
    </main>
  )
}

function Heatmap({ dates }: { dates: Record<string, string> }) {
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    Object.values(dates).forEach(d => { map.set(d, (map.get(d) || 0) + 1) })
    return map
  }, [dates])

  const days = 147;
  const today = new Date();
  const squares = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = counts.get(dateStr) || 0;

    let level = 0;
    if (count > 0) level = 1;
    if (count > 3) level = 2;
    if (count > 6) level = 3;
    if (count > 9) level = 4;

    squares.push({ date: dateStr, count, level, isToday: i === 0 });
  }

  return (
    <div className="heatmap-container">
      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {squares.map((sq, idx) => (
            <div
              key={`${sq.date}-${idx}`}
              className={`heatmap-square level-${sq.level} ${sq.isToday ? 'today' : ''}`}
              title={`${sq.count} problems on ${sq.date}`}
            />
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="heatmap-square level-0"></div>
        <div className="heatmap-square level-1"></div>
        <div className="heatmap-square level-2"></div>
        <div className="heatmap-square level-3"></div>
        <div className="heatmap-square level-4"></div>
        <span>More</span>
      </div>
    </div>
  )
}

function ProfileView({ progress, onOpen, updateLeetcodeUsername }: { progress: ProgressState; onOpen: (sheet: Sheet) => void; updateLeetcodeUsername: (name: string) => void }) {
  const { user, logout } = useAuth()
  const allProblems = sheets.flatMap((sheet) => sheet.problems)
  const solvedProblems = allProblems.filter((problem) => progress.completed.includes(problem.id))
  const total = allProblems.length
  const solved = solvedProblems.length
  const overall = total ? Math.round((solved / total) * 100) : 0
  const difficultyStats = (['Easy', 'Medium', 'Hard'] as const).map((level) => {
    const available = allProblems.filter((problem) => problem.difficulty === level).length
    const complete = solvedProblems.filter((problem) => problem.difficulty === level).length
    return { level, available, complete, percentage: available ? Math.round(complete / available * 100) : 0 }
  })
  const topicMap = allProblems.reduce<Record<string, { total: number; solved: number }>>((acc, problem) => {
    const current = acc[problem.category] || { total: 0, solved: 0 }
    return { ...acc, [problem.category]: { total: current.total + 1, solved: current.solved + Number(progress.completed.includes(problem.id)) } }
  }, {})
  const topTopics = Object.entries(topicMap).sort((a, b) => b[1].total - a[1].total).slice(0, 7)

  const nextMilestone = Math.max(25, Math.ceil((solved + 1) / 25) * 25)

  if (!user) return <main className="main-content"><div className="empty-state"><h3>Not logged in</h3></div></main>

  return (
    <main className="main-content progress-page">
      <section className="all-hero" style={{ textAlign: 'center', paddingBottom: 40 }}>
        <img src={user.photoURL || ''} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 20px', display: 'block', border: '3px solid var(--orange)' }} />
        <h1>{user.displayName}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 15 }}>{user.email}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={progress.leetcodeUsername || ''}
            onChange={(e) => updateLeetcodeUsername(e.target.value)}
            placeholder="LeetCode Username (optional)"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-soft)', color: 'var(--text)', outline: 'none' }}
          />
        </div>
        <button className="primary-button" style={{ margin: '0 auto' }} onClick={logout}>Sign Out</button>
      </section>

      <section className="progress-overview-card">
        <div className="overview-copy"><div className="overview-icon"><TrendingUp size={21} /></div><span>Overall completion</span><h2>{solved} <small>of {total} problems</small></h2><p>You’re building real momentum. Every solved pattern makes the next interview problem easier.</p><div className="milestone-line"><span>Next milestone: {nextMilestone} solved</span><strong>{Math.min(solved, nextMilestone)}/{nextMilestone}</strong></div><div className="milestone-track"><i style={{ width: `${Math.min(100, solved / nextMilestone * 100)}%` }} /></div></div>
        <div className="hero-progress-ring" style={{ '--progress': `${overall * 3.6}deg` } as React.CSSProperties}><div><strong>{overall}%</strong><span>complete</span></div></div>
        <div className="overview-metrics">
          <div><span className="metric-symbol violet"><CheckCircle2 size={18} /></span><p><strong>{solved}</strong><small>Solved</small></p></div>
          <div><span className="metric-symbol orange"><Flame size={18} /></span><p><strong>3 days</strong><small>Current streak</small></p></div>
          <div><span className="metric-symbol green"><Bookmark size={18} /></span><p><strong>{progress.bookmarked.length}</strong><small>Bookmarked</small></p></div>
        </div>
      </section>

      <section className="progress-dashboard-grid">
        <article className="analytics-card difficulty-card"><div className="analytics-heading"><div><span>DIFFICULTY</span><h2>Problem breakdown</h2></div><Award size={20} /></div><div className="difficulty-breakdown">{difficultyStats.map((item) => <div className="difficulty-stat" key={item.level}><div className={`difficulty-orb ${item.level.toLowerCase()}`}><strong>{item.percentage}%</strong></div><div className="difficulty-stat-copy"><div><strong>{item.level}</strong><span>{item.complete} / {item.available}</span></div><div className="difficulty-track"><i className={item.level.toLowerCase()} style={{ width: `${item.percentage}%` }} /></div></div></div>)}</div></article>
        <article className="analytics-card activity-card"><div className="analytics-heading"><div><span>ACTIVITY</span><h2>Contributions</h2></div><span className="positive-change"><ArrowUpRight size={13} /> Keep going</span></div><Heatmap dates={progress.completionDates || {}} /></article>
      </section>

      <section className="progress-dashboard-grid lower-grid">
        <article className="analytics-card topic-card"><div className="analytics-heading"><div><span>TOPICS</span><h2>Pattern mastery</h2></div><BrainCircuit size={20} /></div><div className="topic-list">{topTopics.map(([topic, value]) => { const percent = value.total ? Math.round(value.solved / value.total * 100) : 0; return <div className="topic-progress" key={topic}><div><strong>{topic}</strong><span>{value.solved}/{value.total}</span></div><div className="topic-track"><i style={{ width: `${percent}%` }} /></div></div> })}</div></article>
        <article className="analytics-card streak-panel"><div className="analytics-heading"><div><span>CONSISTENCY</span><h2>Practice streak</h2></div><Flame size={20} /></div><div className="streak-highlight"><div><Flame size={29} fill="currentColor" /></div><p><strong>3 day streak</strong><span>Your best is 7 days. Practice tomorrow to keep it alive.</span></p></div><div className="week-checks">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <div key={`${day}-${index}`}><span className={index < 3 ? 'checked' : index === 3 ? 'current' : ''}>{index < 3 ? <Check size={13} /> : day}</span><small>{index === 3 ? 'Today' : ''}</small></div>)}</div><div className="streak-tip"><Sparkles size={15} /><span>One problem a day is enough to build an unstoppable habit.</span></div></article>
      </section>

      <section className="sheet-progress-section"><div className="section-heading"><div><span className="section-kicker">ROADMAP PROGRESS</span><h2>Progress by sheet</h2><p>Continue exactly where you left off.</p></div></div><div className="progress-sheet-grid">{sheets.map((sheet) => { const count = sheet.problems.filter(p => progress.completed.includes(p.id)).length; const percent = sheet.problems.length ? Math.round(count / sheet.problems.length * 100) : 0; const Icon = iconMap[sheet.icon as keyof typeof iconMap] || Code2; return <button className={`progress-sheet-item accent-${sheet.accent}`} key={sheet.slug} onClick={() => onOpen(sheet)}><span className="progress-sheet-icon"><Icon size={19} /></span><span className="progress-sheet-copy"><strong>{sheet.title}</strong><small>{count} of {sheet.problems.length} completed</small><span className="progress-sheet-track"><i style={{ width: `${percent}%` }} /></span></span><span className="sheet-percent">{percent}%</span><ArrowRight size={17} /></button> })}</div></section>
    </main>
  )
}

function ProblemRow({ problem, index, completed, bookmarked, note, frequency, toggleComplete, toggleBookmark, onSaveNote }: { problem: Problem; index: number; completed: boolean; bookmarked: boolean; note?: string; frequency?: number; toggleComplete: () => void; toggleBookmark: () => void; onSaveNote?: (text: string) => void }) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(note || '')

  const handleSave = () => {
    onSaveNote?.(noteText)
    setEditingNote(false)
  }

  return (
    <>
      <div className={`problem-row ${completed ? 'solved' : ''}`}>
        <button className="check-button" onClick={toggleComplete} aria-pressed={completed} aria-label={completed ? 'Mark incomplete' : 'Mark complete'}>{completed ? <Check size={15} strokeWidth={3} /> : null}</button>
        <span className="problem-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="problem-name"><strong><a href={problem.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{problem.title}</a>{frequency && frequency >= 3 ? <span className="hot-pill" title={`On ${frequency} study sheets`}><Flame size={9} fill="currentColor" />{frequency}</span> : null}</strong><span>{completed && <i className="completed-dot" />} {completed ? 'Completed · ' : ''}{problem.company}</span></div>
        <span className="pattern-pill">{problem.pattern}</span>
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        <a className="bookmark-button" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(problem.title + ' leetcode solution neetcode')}`} target="_blank" rel="noreferrer" title="Watch explanation" aria-label="Watch video explanation"><PlaySquare size={17} /></a>
        <button className={`bookmark-button ${note ? 'has-note' : ''}`} onClick={() => setEditingNote(!editingNote)} aria-label="Toggle notes"><FileText size={17} fill={note ? 'currentColor' : 'none'} /></button>
        <button className={`bookmark-button ${bookmarked ? 'active' : ''}`} onClick={toggleBookmark} aria-label="Bookmark problem"><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button>
        <a className="solve-button" href={problem.url} target="_blank" rel="noreferrer">{completed ? 'Review' : 'Solve'} <ArrowRight size={15} /></a>
      </div>
      {editingNote && (
        <div className="problem-note-editor">
          <textarea placeholder="Write down your approach, time/space complexity, or personal tricks for this problem..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          <div className="note-actions">
            <button className="ghost-button" onClick={() => setEditingNote(false)}>Cancel</button>
            <button className="primary-button" onClick={handleSave}><Save size={15} /> Save Note</button>
          </div>
        </div>
      )}
    </>
  )
}

function SheetView({ sheet, progress, toggle, saveNote, onBack }: { sheet: Sheet; progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void; saveNote: (id: string, text: string) => void; onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('All')
  const [sort, setSort] = useState('Default')
  const solved = sheet.problems.filter((p) => progress.completed.includes(p.id)).length
  const grouped = useMemo(() => {
    const filtered = sheet.problems.filter((problem) => problem.title.toLowerCase().includes(query.toLowerCase()) && (difficulty === 'All' || problem.difficulty === difficulty))
    if (sort === 'Difficulty') filtered.sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty])
    return filtered.reduce<Record<string, Problem[]>>((acc, problem) => ({ ...acc, [problem.category]: [...(acc[problem.category] || []), problem] }), {})
  }, [sheet, query, difficulty, sort])

  return (
    <main className="main-content sheet-view">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> All sheets</button>
      <section className={`sheet-hero accent-${sheet.accent}`}>
        <div><span className="section-kicker">{sheet.author.toUpperCase()}</span><h1>{sheet.title}</h1><p>{sheet.description}</p><div className="sheet-hero-meta"><span><ListChecks size={16} /> {sheet.problems.length} problems</span><span><Clock3 size={16} /> {sheet.estimated}</span></div></div>
        <div className="large-progress"><ProgressRing value={sheet.problems.length ? Math.round(solved / sheet.problems.length * 100) : 0} size={96} /><div><strong>{solved} of {sheet.problems.length}</strong><span>problems completed</span></div></div>
      </section>
      <div className="problem-toolbar">
        <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search problems..." /></label>
        <div className="toolbar-select"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select><ChevronDown size={15} /></div>
        <div className="toolbar-select"><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Default</option><option>Difficulty</option></select><ChevronDown size={15} /></div>
      </div>
      <div className="problem-list">
        {Object.entries(grouped).map(([category, problems]) => (
          <section className="category-group" key={category}><div className="category-heading"><div><h2>{category}</h2><span>{problems.filter(p => progress.completed.includes(p.id)).length}/{problems.length} completed</span></div><div className="mini-track"><i style={{ width: `${problems.length ? problems.filter(p => progress.completed.includes(p.id)).length / problems.length * 100 : 0}%` }} /></div></div>
            {problems.map((problem) => <ProblemRow key={problem.id} problem={problem} index={sheet.problems.indexOf(problem)} completed={progress.completed.includes(problem.id)} bookmarked={progress.bookmarked.includes(problem.id)} note={progress.notes?.[problem.id]} toggleComplete={() => toggle('completed', problem.id)} toggleBookmark={() => toggle('bookmarked', problem.id)} onSaveNote={(text) => saveNote(problem.id, text)} />)}
          </section>
        ))}
        {!Object.keys(grouped).length && <div className="empty-state"><Search size={28} /><h3>No problems found</h3><p>Try changing your search or difficulty filter.</p></div>}
      </div>
    </main>
  )
}

function BookmarksView({ progress, toggle, saveNote }: { progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void; saveNote: (id: string, text: string) => void }) {
  const bookmarked = sheets.flatMap(s => s.problems).filter(p => progress.bookmarked.includes(p.id))
  return <main className="main-content sheet-view"><div className="simple-page-head"><span className="section-kicker">YOUR COLLECTION</span><h1>Bookmarked problems</h1><p>Everything you saved for another focused practice session.</p></div><div className="problem-list standalone">{bookmarked.map((p, i) => <ProblemRow key={p.id} problem={p} index={i} completed={progress.completed.includes(p.id)} bookmarked note={progress.notes?.[p.id]} toggleComplete={() => toggle('completed', p.id)} toggleBookmark={() => toggle('bookmarked', p.id)} onSaveNote={(text) => saveNote(p.id, text)} />)}{!bookmarked.length && <div className="empty-state"><Bookmark size={29} /><h3>No bookmarks yet</h3><p>Save problems from any sheet and they’ll appear here.</p></div>}</div></main>
}

function AllProblemsView({ progress, toggle, saveNote }: { progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void; saveNote: (id: string, text: string) => void }) {
  // One deduped list of every problem across all sheets (ids are canonical, so
  // the same question appears once and stays in sync with its sheets). We rank
  // by "popularity" — how many sheets include a question — so the famous, most
  // frequently asked problems surface at the top instead of raw sheet order.
  const { allProblems, popularity } = useMemo(() => {
    const counts = new Map<string, number>()
    sheets.forEach((sheet) => sheet.problems.forEach((problem) => counts.set(problem.id, (counts.get(problem.id) ?? 0) + 1)))
    const seen = new Set<string>()
    const unique = sheets.flatMap((sheet) => sheet.problems).filter((problem) => !seen.has(problem.id) && seen.add(problem.id))
    unique.sort((a, b) =>
      (counts.get(b.id)! - counts.get(a.id)!) ||
      (difficultyRank[a.difficulty] - difficultyRank[b.difficulty]) ||
      a.title.localeCompare(b.title))
    return { allProblems: unique, popularity: counts }
  }, [])
  const topics = useMemo(() => TOPIC_ORDER.filter((topic) => allProblems.some((problem) => problem.topic === topic)), [allProblems])
  const companies = useMemo(() => Array.from(new Set(allProblems.flatMap((problem) => problem.companies))).sort(), [allProblems])

  const [topic, setTopic] = useState('All')
  const [company, setCompany] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [query, setQuery] = useState('')
  const hasFilters = topic !== 'All' || company !== 'All' || difficulty !== 'All' || query !== ''

  const filtered = allProblems.filter((problem) =>
    (topic === 'All' || problem.topic === topic) &&
    (company === 'All' || problem.companies.includes(company)) &&
    (difficulty === 'All' || problem.difficulty === difficulty) &&
    problem.title.toLowerCase().includes(query.toLowerCase()))
  const solvedCount = filtered.filter((problem) => progress.completed.includes(problem.id)).length

  return (
    <main className="main-content all-problems">
      <section className="all-hero">
        <span className="section-kicker">EVERY QUESTION IN ONE PLACE</span>
        <h1>Browse all problems</h1>
        <p>Filter the entire library by topic and company to drill straight to the questions your next interview will test.</p>
      </section>

      <div className="filter-panel">
        <div className="filter-panel-glow" />
        <div className="filter-panel-top">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all problems..." /></label>
          <div className="toolbar-select"><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select><ChevronDown size={15} /></div>
          {hasFilters && <button className="clear-filters" onClick={() => { setTopic('All'); setCompany('All'); setDifficulty('All'); setQuery('') }}><X size={14} /> Clear</button>}
        </div>
        <div className="filter-group">
          <div className="filter-label"><LayoutGrid size={15} /> Category</div>
          <div className="chip-row">
            <button className={`chip ${topic === 'All' ? 'active' : ''}`} onClick={() => setTopic('All')}>All</button>
            {topics.map((item) => <button key={item} className={`chip ${topic === item ? 'active' : ''}`} onClick={() => setTopic(item)}>{item}</button>)}
          </div>
        </div>
        <div className="filter-group">
          <div className="filter-label"><Building2 size={15} /> Company</div>
          <div className="chip-row">
            <button className={`chip ${company === 'All' ? 'active' : ''}`} onClick={() => setCompany('All')}>All</button>
            {companies.map((item) => <button key={item} className={`chip company-chip ${company === item ? 'active' : ''}`} onClick={() => setCompany(item)}>{item}</button>)}
          </div>
        </div>
      </div>

      <div className="all-results-head">
        <h2>{filtered.length} problem{filtered.length === 1 ? '' : 's'}</h2>
        <span className="sort-hint"><Flame size={13} /> Most asked first</span>
        <span className="solved-hint"><CheckCircle2 size={14} /> {solvedCount} solved</span>
      </div>

      <div className="problem-list standalone">
        {filtered.map((problem, index) => <ProblemRow key={problem.id} problem={problem} index={index} completed={progress.completed.includes(problem.id)} bookmarked={progress.bookmarked.includes(problem.id)} note={progress.notes?.[problem.id]} frequency={popularity.get(problem.id) ?? 0} toggleComplete={() => toggle('completed', problem.id)} toggleBookmark={() => toggle('bookmarked', problem.id)} onSaveNote={(text) => saveNote(problem.id, text)} />)}
        {!filtered.length && <div className="empty-state"><Search size={28} /><h3>No problems match</h3><p>Try clearing a filter or two.</p></div>}
      </div>
    </main>
  )
}

function LeaderboardView() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = collection(db, 'progress')
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

        // Sort in memory so users without 'completedCount' are still included
        data.sort((a: any, b: any) => {
          const countA = a.completedCount ?? (Array.isArray(a.completed) ? a.completed.length : 0);
          const countB = b.completedCount ?? (Array.isArray(b.completed) ? b.completed.length : 0);
          return countB - countA;
        });

        setLeaders(data)
      } catch (e) {
        console.error('Error fetching leaderboard:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaders()
  }, [])

  return (
    <main className="main-content">
      <section className="all-hero">
        <span className="section-kicker">GLOBAL RANKINGS</span>
        <h1>Leaderboard</h1>
        <p>See how you stack up against other developers grinding their way to top tier offers.</p>
      </section>
      <div className="problem-list standalone">
        {loading ? (
          <div className="empty-state"><h3>Loading rankings...</h3></div>
        ) : (
          leaders.map((leader, index) => (
            <div className="problem-row" key={leader.id}>
              <span className="problem-index" style={{ color: index < 3 ? 'var(--orange)' : 'var(--text-muted)', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                #{index + 1}
              </span>
              <img src={leader.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 10px' }} />
              <div className="problem-name">
                <strong>{leader.displayName || 'Anonymous Developer'}</strong>
              </div>
              <span className="pattern-pill">
                <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {leader.completedCount ?? (Array.isArray(leader.completed) ? leader.completed.length : 0)} solved
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

function MockInterviewView({ progress, toggle, saveNote }: { progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void; saveNote: (id: string, text: string) => void }) {
  const [phase, setPhase] = useState<'setup' | 'running' | 'summary'>('setup')
  const [company, setCompany] = useState('All')
  const [sessionProblems, setSessionProblems] = useState<Problem[]>([])
  const [timeLeft, setTimeLeft] = useState(45 * 60)

  const allProblems = useMemo(() => {
    const seen = new Set<string>()
    return sheets.flatMap((sheet) => sheet.problems).filter((problem) => !seen.has(problem.id) && seen.add(problem.id))
  }, [])
  const companies = useMemo(() => Array.from(new Set(allProblems.flatMap((problem) => problem.companies))).sort(), [allProblems])

  const startInterview = () => {
    let pool = company === 'All' ? allProblems : allProblems.filter(p => p.companies.includes(company))
    if (pool.length < 2) pool = allProblems // fallback if not enough problems

    // Pick 1 medium and 1 hard, or just 2 random if not possible
    let mediums = pool.filter(p => p.difficulty === 'Medium')
    let hards = pool.filter(p => p.difficulty === 'Hard')

    let p1 = mediums.length ? mediums[Math.floor(Math.random() * mediums.length)] : pool[Math.floor(Math.random() * pool.length)]
    pool = pool.filter(p => p.id !== p1.id)
    hards = hards.filter(p => p.id !== p1.id)
    let p2 = hards.length ? hards[Math.floor(Math.random() * hards.length)] : pool[Math.floor(Math.random() * pool.length)]

    setSessionProblems([p1, p2])
    setTimeLeft(45 * 60)
    setPhase('running')
  }

  useEffect(() => {
    let timer: number
    if (phase === 'running' && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && phase === 'running') {
      setPhase('summary')
    }
    return () => clearInterval(timer)
  }, [phase, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <main className="main-content">
      {phase === 'setup' && (
        <>
          <section className="all-hero">
            <span className="section-kicker">MOCK INTERVIEW</span>
            <h1>Test your skills</h1>
            <p>Simulate a real 45-minute technical interview. We'll give you 2 random problems to solve under time pressure.</p>
          </section>
          <div className="analytics-card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 40 }}>
            <Clock3 size={48} style={{ margin: '0 auto 20px', color: 'var(--orange)' }} />
            <h2 style={{ marginBottom: 20 }}>Configure your session</h2>
            <div style={{ marginBottom: 30 }}>
              <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold' }}>Target Company (Optional)</label>
              <div className="toolbar-select" style={{ display: 'inline-flex' }}>
                <select value={company} onChange={(event) => setCompany(event.target.value)}>
                  <option>All</option>
                  {companies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
            <button className="primary-button" style={{ fontSize: '1.1rem', padding: '12px 24px' }} onClick={startInterview}>
              Start 45-min Interview
            </button>
          </div>
        </>
      )}

      {phase === 'running' && (
        <>
          <div className="all-results-head" style={{ justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            <div>
              <span className="section-kicker">SESSION IN PROGRESS</span>
              <h2>Solve both problems</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: timeLeft < 300 ? 'var(--red)' : 'var(--text)' }}>
                {formatTime(timeLeft)}
              </div>
              <button className="ghost-button" onClick={() => setPhase('summary')}>End Early</button>
            </div>
          </div>
          <div className="problem-list standalone">
            {sessionProblems.map((p, index) => (
              <ProblemRow key={p.id} problem={p} index={index} completed={progress.completed.includes(p.id)} bookmarked={progress.bookmarked.includes(p.id)} note={progress.notes?.[p.id]} toggleComplete={() => toggle('completed', p.id)} toggleBookmark={() => toggle('bookmarked', p.id)} onSaveNote={(text) => saveNote(p.id, text)} />
            ))}
          </div>
        </>
      )}

      {phase === 'summary' && (
        <>
          <section className="all-hero" style={{ textAlign: 'center' }}>
            <Trophy size={48} style={{ margin: '0 auto 20px', color: 'var(--green)' }} />
            <h1>Session Complete</h1>
            <p>Great job practicing under pressure. Review your solutions and notes below.</p>
            <button className="ghost-button" style={{ marginTop: 20 }} onClick={() => setPhase('setup')}>Start Another</button>
          </section>
          <div className="problem-list standalone">
            {sessionProblems.map((p, index) => (
              <ProblemRow key={p.id} problem={p} index={index} completed={progress.completed.includes(p.id)} bookmarked={progress.bookmarked.includes(p.id)} note={progress.notes?.[p.id]} toggleComplete={() => toggle('completed', p.id)} toggleBookmark={() => toggle('bookmarked', p.id)} onSaveNote={(text) => saveNote(p.id, text)} />
            ))}
          </div>
        </>
      )}
    </main>
  )
}



function ContestsView({ progress }: { progress: ProgressState }) {
  const [now, setNow] = useState(new Date())
  const [ratingData, setRatingData] = useState<any>(null)
  const [loadingRating, setLoadingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!progress.leetcodeUsername) return
    let isMounted = true;
    setLoadingRating(true)
    setRatingError('')
    fetch(`https://alfa-leetcode-api.onrender.com/${progress.leetcodeUsername}/contest`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && data.contestRating) {
          setRatingData(data)
        } else {
          setRatingError('User not found or no contest data.')
        }
      })
      .catch(() => {
        if (isMounted) setRatingError('Error fetching rating data. The API might be down temporarily.')
      })
      .finally(() => {
        if (isMounted) setLoadingRating(false)
      })
    return () => { isMounted = false; }
  }, [progress.leetcodeUsername])

  const getNextWeekly = (date: Date) => {
    const next = new Date(date)
    next.setUTCHours(2, 30, 0, 0)
    if (next.getUTCDay() === 0 && next > date) return next;
    next.setUTCDate(next.getUTCDate() + ((7 - next.getUTCDay()) % 7 || 7))
    return next
  }

  const getNextBiweekly = (date: Date) => {
    const next = new Date(date)
    next.setUTCHours(14, 30, 0, 0)
    const knownBiweekly = 1728743400000;
    const msInTwoWeeks = 14 * 24 * 60 * 60 * 1000;
    const diff = date.getTime() - knownBiweekly;
    const cycles = Math.floor(diff / msInTwoWeeks);
    const nextTime = knownBiweekly + (cycles + 1) * msInTwoWeeks;
    return new Date(nextTime);
  }

  const nextWeekly = getNextWeekly(now)
  const nextBiweekly = getNextBiweekly(now)

  const formatCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime()
    if (diff < 0) return "Started!"
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const m = Math.floor((diff / 1000 / 60) % 60)
    const s = Math.floor((diff / 1000) % 60)
    return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  }

  return (
    <main className="main-content">
      <section className="all-hero" style={{ textAlign: 'center' }}>
        <CalendarDays size={48} style={{ margin: '0 auto 20px', color: 'var(--orange)' }} />
        <h1>Contest Tracker</h1>
        <p>Never miss a LeetCode contest. Put your skills to the test against the world.</p>
      </section>

      <section className="progress-dashboard-grid" style={{ maxWidth: 800, margin: '17px auto 0' }}>
        <article className="analytics-card" style={{ textAlign: 'center' }}>
          <div className="analytics-heading" style={{ justifyContent: 'center' }}>
            <h2>Weekly Contest</h2>
          </div>
          <div className="contest-countdown">
            {formatCountdown(nextWeekly)}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Every Sunday at 2:30 AM UTC</p>
          <a href="https://leetcode.com/contest/" target="_blank" rel="noreferrer" className="primary-button" style={{ display: 'inline-block', marginTop: 20 }}>View on LeetCode</a>
        </article>

        <article className="analytics-card" style={{ textAlign: 'center' }}>
          <div className="analytics-heading" style={{ justifyContent: 'center' }}>
            <h2>Biweekly Contest</h2>
          </div>
          <div className="contest-countdown">
            {formatCountdown(nextBiweekly)}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Every other Saturday at 2:30 PM UTC</p>
          <a href="https://leetcode.com/contest/" target="_blank" rel="noreferrer" className="primary-button" style={{ display: 'inline-block', marginTop: 20 }}>View on LeetCode</a>
        </article>
      </section>

      {progress.leetcodeUsername ? (
        <section className="analytics-card" style={{ maxWidth: 800, margin: '20px auto' }}>
          <div className="analytics-heading" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 15, marginBottom: 20, justifyContent: 'center' }}>
            <h2>LeetCode Rating for {progress.leetcodeUsername}</h2>
          </div>
          {loadingRating ? (
            <div className="empty-state"><h3>Loading rating data...</h3></div>
          ) : ratingError ? (
            <div className="empty-state"><h3 style={{ color: 'var(--red)' }}>{ratingError}</h3></div>
          ) : ratingData ? (
            <div>
              <div className="rating-stats-grid">
                <div className="rating-stat-box">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Rating</span>
                  <div className="rating-stat-value" style={{ color: 'var(--orange)' }}>
                    {Math.round(ratingData.contestRating)}
                  </div>
                </div>
                <div className="rating-stat-box">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Global Rank</span>
                  <div className="rating-stat-value">
                    #{ratingData.contestGlobalRanking.toLocaleString()}
                  </div>
                </div>
                <div className="rating-stat-box">
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Percentage</span>
                  <div className="rating-stat-value" style={{ color: 'var(--green)' }}>
                    {ratingData.contestTopPercentage}%
                  </div>
                </div>
              </div>

              <h3 style={{ marginBottom: 15 }}>Recent Contests</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ratingData.contestParticipation.slice().reverse().slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="contest-history-row">
                    <div>
                      <strong>{c.contest.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>Solved: {c.problemsSolved} / {c.totalProblems}</div>
                    </div>
                    <div className="contest-history-meta">
                      <div style={{ fontWeight: 'bold' }}>Rating: {Math.round(c.rating)}</div>
                      <div style={{ color: c.trendDirection === 'UP' ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.trendDirection === 'UP' ? <ArrowUpRight size={14} /> : <ArrowRight size={14} style={{ transform: 'rotate(45deg)' }} />}
                        Rank {c.ranking.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="analytics-card" style={{ maxWidth: 800, margin: '20px auto', textAlign: 'center' }}>
          <h2>Rating Tracker</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 10 }}>Link your LeetCode username in your Profile to track your rating history.</p>
        </section>
      )}
    </main>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('dsagrind-theme') || 'light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null)
  const { state: progress, toggle, saveNote, updateLeetcodeUsername } = useProgress()

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('dsagrind-theme', theme) }, [theme])
  useEffect(() => {
    const handler = (event: Event) => toggle('completed', (event as CustomEvent<string>).detail)
    document.addEventListener('toggle-complete', handler)
    return () => document.removeEventListener('toggle-complete', handler)
  })

  const openSheet = (sheet: Sheet) => { setActiveSheet(sheet); setView('sheet'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const changeView = (next: NavTarget) => { setView(next); setActiveSheet(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="app-shell">
      <Header theme={theme} setTheme={setTheme} onMenu={() => setSidebarOpen(true)} view={view} navigate={changeView} solved={progress.completed.length} />
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} view={view} setView={changeView} />
      {view === 'home' && <HomeView completed={progress.completed} onOpen={openSheet} onBrowseAll={() => changeView('all')} />}
      {view === 'sheet' && activeSheet && <SheetView sheet={activeSheet} progress={progress} toggle={toggle} saveNote={saveNote} onBack={() => changeView('home')} />}
      {view === 'bookmarks' && <BookmarksView progress={progress} toggle={toggle} saveNote={saveNote} />}
      {view === 'all' && <AllProblemsView progress={progress} toggle={toggle} saveNote={saveNote} />}
      {view === 'leaderboard' && <LeaderboardView />}
      {view === 'mock' && <MockInterviewView progress={progress} toggle={toggle} saveNote={saveNote} />}
      {view === 'contests' && <ContestsView progress={progress} />}
      {view === 'profile' && <ProfileView progress={progress} onOpen={openSheet} updateLeetcodeUsername={updateLeetcodeUsername} />}
      <footer><Logo /><p>Build consistency. Learn patterns. Get the offer.</p><span>© 2026 DSA Grind</span></footer>
    </div>
  )
}
