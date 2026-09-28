import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Bookmark, BookOpen, BrainCircuit,
  BriefcaseBusiness, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, Circle, Clock3,
  Code2, Flame, Grid2X2, Layers3, LayoutGrid, ListChecks, Menu, Moon, Search, Settings2, Sparkles,
  Star, Sun, Target, TrendingUp, Trophy, X, Zap,
} from 'lucide-react'
import { loadSheets, TOPIC_ORDER } from './lib/parseSheets'
import type { Problem, ProgressState, Sheet } from './types'

const sheets = loadSheets()
const STORAGE_KEY = 'algovault-progress-v1'

const iconMap = {
  target: Target,
  layers: Layers3,
  code: Code2,
  briefcase: BriefcaseBusiness,
}

const difficultyRank = { Easy: 0, Medium: 1, Hard: 2 }
type View = 'home' | 'sheet' | 'bookmarks' | 'progress' | 'all'
type NavTarget = 'home' | 'bookmarks' | 'progress' | 'all'

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
  return { completed: remap(base.completed), bookmarked: remap(base.bookmarked) }
}

function useProgress() {
  const [state, setState] = useState<ProgressState>(() => {
    try {
      return migrateProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'))
    } catch {
      return { completed: [], bookmarked: [] }
    }
  })

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)), [state])
  const toggle = (key: keyof ProgressState, id: string) => setState((current) => ({
    ...current,
    [key]: current[key].includes(id) ? current[key].filter((item) => item !== id) : [...current[key], id],
  }))
  return { state, toggle }
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
        <button className={view === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}>Progress</button>
      </nav>
      <div className="top-actions">
        <button className="solved-chip desktop-only" onClick={() => navigate('progress')} title="View your progress">
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
        <button className={view === 'progress' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('progress')}><BarChart3 size={18} /> My progress</button>
        <p className="nav-label second">Practice</p>
        <a className="nav-item" href="#daily" onClick={close}><Zap size={18} /> Daily challenge <span className="new-pill">NEW</span></a>
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
      <section className="quote-card"><Star size={19} fill="currentColor" /><blockquote>“Success is the sum of small efforts, repeated day in and day out.”</blockquote><span>— Robert Collier</span></section>
    </main>
  )
}

function ProgressView({ progress, onOpen }: { progress: ProgressState; onOpen: (sheet: Sheet) => void }) {
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
  const weekActivity = [Math.max(0, solved - 6), Math.max(0, solved - 4), solved ? 1 : 0, Math.max(0, solved - 3), solved ? 2 : 0, Math.max(0, solved - 5), solved ? 1 : 0].map((value) => Math.min(5, value))
  const nextMilestone = Math.max(25, Math.ceil((solved + 1) / 25) * 25)

  return (
    <main className="main-content progress-page">
      <section className="progress-title-row">
        <div><span className="section-kicker">PERFORMANCE CENTER</span><h1>Your progress</h1><p>See what you’ve mastered, find your weak spots, and keep the streak alive.</p></div>
        <div className="progress-period"><CalendarDays size={16} /> All time <ChevronDown size={14} /></div>
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
        <article className="analytics-card activity-card"><div className="analytics-heading"><div><span>ACTIVITY</span><h2>This week</h2></div><span className="positive-change"><ArrowUpRight size={13} /> Keep going</span></div><div className="activity-total"><strong>{weekActivity.reduce((a, b) => a + b, 0)}</strong><span>problems practiced</span></div><div className="activity-chart">{weekActivity.map((value, index) => <div className="activity-day" key={index}><div className="activity-bar-wrap"><i style={{ height: `${Math.max(10, value * 18)}%` }} className={index === 6 ? 'today' : ''} /></div><span>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index]}</span></div>)}</div></article>
      </section>

      <section className="progress-dashboard-grid lower-grid">
        <article className="analytics-card topic-card"><div className="analytics-heading"><div><span>TOPICS</span><h2>Pattern mastery</h2></div><BrainCircuit size={20} /></div><div className="topic-list">{topTopics.map(([topic, value]) => { const percent = value.total ? Math.round(value.solved / value.total * 100) : 0; return <div className="topic-progress" key={topic}><div><strong>{topic}</strong><span>{value.solved}/{value.total}</span></div><div className="topic-track"><i style={{ width: `${percent}%` }} /></div></div> })}</div></article>
        <article className="analytics-card streak-panel"><div className="analytics-heading"><div><span>CONSISTENCY</span><h2>Practice streak</h2></div><Flame size={20} /></div><div className="streak-highlight"><div><Flame size={29} fill="currentColor" /></div><p><strong>3 day streak</strong><span>Your best is 7 days. Practice tomorrow to keep it alive.</span></p></div><div className="week-checks">{['M','T','W','T','F','S','S'].map((day, index) => <div key={`${day}-${index}`}><span className={index < 3 ? 'checked' : index === 3 ? 'current' : ''}>{index < 3 ? <Check size={13} /> : day}</span><small>{index === 3 ? 'Today' : ''}</small></div>)}</div><div className="streak-tip"><Sparkles size={15} /><span>One problem a day is enough to build an unstoppable habit.</span></div></article>
      </section>

      <section className="sheet-progress-section"><div className="section-heading"><div><span className="section-kicker">ROADMAP PROGRESS</span><h2>Progress by sheet</h2><p>Continue exactly where you left off.</p></div></div><div className="progress-sheet-grid">{sheets.map((sheet) => { const count = sheet.problems.filter(p => progress.completed.includes(p.id)).length; const percent = sheet.problems.length ? Math.round(count / sheet.problems.length * 100) : 0; const Icon = iconMap[sheet.icon as keyof typeof iconMap] || Code2; return <button className={`progress-sheet-item accent-${sheet.accent}`} key={sheet.slug} onClick={() => onOpen(sheet)}><span className="progress-sheet-icon"><Icon size={19} /></span><span className="progress-sheet-copy"><strong>{sheet.title}</strong><small>{count} of {sheet.problems.length} completed</small><span className="progress-sheet-track"><i style={{ width: `${percent}%` }} /></span></span><span className="sheet-percent">{percent}%</span><ArrowRight size={17} /></button> })}</div></section>
    </main>
  )
}

function ProblemRow({ problem, index, completed, bookmarked, frequency, toggleComplete, toggleBookmark }: { problem: Problem; index: number; completed: boolean; bookmarked: boolean; frequency?: number; toggleComplete: () => void; toggleBookmark: () => void }) {
  return (
    <div className={`problem-row ${completed ? 'solved' : ''}`}>
      <button className="check-button" onClick={toggleComplete} aria-pressed={completed} aria-label={completed ? 'Mark incomplete' : 'Mark complete'}>{completed ? <Check size={15} strokeWidth={3} /> : null}</button>
      <span className="problem-index">{String(index + 1).padStart(2, '0')}</span>
      <div className="problem-name"><strong>{problem.title}{frequency && frequency >= 3 ? <span className="hot-pill" title={`On ${frequency} study sheets`}><Flame size={9} fill="currentColor" />{frequency}</span> : null}</strong><span>{completed && <i className="completed-dot" />} {completed ? 'Completed · ' : ''}{problem.company}</span></div>
      <span className="pattern-pill">{problem.pattern}</span>
      <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
      <button className={`bookmark-button ${bookmarked ? 'active' : ''}`} onClick={toggleBookmark} aria-label="Bookmark problem"><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button>
      <a className="solve-button" href={problem.url} target="_blank" rel="noreferrer">{completed ? 'Review' : 'Solve'} <ArrowRight size={15} /></a>
    </div>
  )
}

function SheetView({ sheet, progress, toggle, onBack }: { sheet: Sheet; progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void; onBack: () => void }) {
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
            {problems.map((problem) => <ProblemRow key={problem.id} problem={problem} index={sheet.problems.indexOf(problem)} completed={progress.completed.includes(problem.id)} bookmarked={progress.bookmarked.includes(problem.id)} toggleComplete={() => toggle('completed', problem.id)} toggleBookmark={() => toggle('bookmarked', problem.id)} />)}
          </section>
        ))}
        {!Object.keys(grouped).length && <div className="empty-state"><Search size={28} /><h3>No problems found</h3><p>Try changing your search or difficulty filter.</p></div>}
      </div>
    </main>
  )
}

function BookmarksView({ progress, toggle }: { progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void }) {
  const bookmarked = sheets.flatMap(s => s.problems).filter(p => progress.bookmarked.includes(p.id))
  return <main className="main-content sheet-view"><div className="simple-page-head"><span className="section-kicker">YOUR COLLECTION</span><h1>Bookmarked problems</h1><p>Everything you saved for another focused practice session.</p></div><div className="problem-list standalone">{bookmarked.map((p, i) => <ProblemRow key={p.id} problem={p} index={i} completed={progress.completed.includes(p.id)} bookmarked toggleComplete={() => toggle('completed', p.id)} toggleBookmark={() => toggle('bookmarked', p.id)} />)}{!bookmarked.length && <div className="empty-state"><Bookmark size={29} /><h3>No bookmarks yet</h3><p>Save problems from any sheet and they’ll appear here.</p></div>}</div></main>
}

function AllProblemsView({ progress, toggle }: { progress: ProgressState; toggle: (key: keyof ProgressState, id: string) => void }) {
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
        {filtered.map((problem, index) => <ProblemRow key={problem.id} problem={problem} index={index} completed={progress.completed.includes(problem.id)} bookmarked={progress.bookmarked.includes(problem.id)} frequency={popularity.get(problem.id) ?? 0} toggleComplete={() => toggle('completed', problem.id)} toggleBookmark={() => toggle('bookmarked', problem.id)} />)}
        {!filtered.length && <div className="empty-state"><Search size={28} /><h3>No problems match</h3><p>Try clearing a filter or two.</p></div>}
      </div>
    </main>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('algovault-theme') || 'light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<View>('home')
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null)
  const { state: progress, toggle } = useProgress()

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('algovault-theme', theme) }, [theme])
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
      {view === 'sheet' && activeSheet && <SheetView sheet={activeSheet} progress={progress} toggle={toggle} onBack={() => changeView('home')} />}
      {view === 'bookmarks' && <BookmarksView progress={progress} toggle={toggle} />}
      {view === 'all' && <AllProblemsView progress={progress} toggle={toggle} />}
      {view === 'progress' && <ProgressView progress={progress} onOpen={openSheet} />}
      <footer><Logo /><p>Build consistency. Learn patterns. Get the offer.</p><span>© 2026 DSA Grind</span></footer>
    </div>
  )
}
