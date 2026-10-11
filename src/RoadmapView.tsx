import React, { useMemo, useState } from 'react'
import {
  ArrowRight, BrainCircuit, Check, CheckCircle2,
  ChevronDown, ChevronUp, Circle, Clock3, Code2, FileText, Flag,
  Flame, Layers3, PlaySquare, RotateCcw, Save, Sparkles,
  Target, Trophy, Zap
} from 'lucide-react'
import type { Problem, ProgressState } from './types'
import {
  buildRoadmapDays,
  DAILY_STUDY_ROUTINE,
} from './lib/roadmapData'

interface RoadmapViewProps {
  allProblems: Problem[]
  progress: ProgressState
  toggleComplete: (id: string) => void
  toggleIndependent: (id: string) => void
  toggleMistake: (id: string) => void
  toggleDay7Task: (taskId: string) => void
  resetProblemStatus: (id: string) => void
  saveNote: (id: string, text: string) => void
}

const routineIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BrainCircuit,
  Code2,
  Flame,
  Clock3,
}

export function RoadmapView({
  allProblems,
  progress,
  toggleComplete,
  toggleIndependent,
  toggleMistake,
  toggleDay7Task,
  resetProblemStatus,
  saveNote,
}: RoadmapViewProps) {
  const days = useMemo(() => buildRoadmapDays(allProblems), [allProblems])

  // Extract all 49 coding problems
  const roadmapCodingProblems = useMemo(() => {
    return days.slice(0, 6).flatMap((d) => d.problems || [])
  }, [days])

  // State for expanded days (default: open active day or day 1)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>(() => ({
    1: true,
  }))
  const [mistakesExpanded, setMistakesExpanded] = useState(true)

  // Progress Calculations according to exact prompt specifications:
  // Total coding problems: 49
  // Total revision tasks: 7
  // Total tracked milestones: 56
  const completedProblems = useMemo(() => {
    return roadmapCodingProblems.filter((p) => progress.completed?.includes(p.id))
  }, [roadmapCodingProblems, progress.completed])

  const solvedIndependentlyProblems = useMemo(() => {
    return roadmapCodingProblems.filter((p) => progress.solvedIndependently?.includes(p.id))
  }, [roadmapCodingProblems, progress.solvedIndependently])

  const mistakeProblems = useMemo(() => {
    return roadmapCodingProblems.filter((p) => progress.mistakes?.includes(p.id))
  }, [roadmapCodingProblems, progress.mistakes])

  const day7TasksCompleted = useMemo(() => progress.day7RevisionTasks || [], [progress.day7RevisionTasks])

  const completedProblemsCount = completedProblems.length // out of 49
  const completedTasksCount = Math.min(day7TasksCompleted.length, 7) // out of 7

  // Formula: Overall progress = (completed coding problems + completed revision tasks) / 56 * 100
  const overallProgressPercentage = Math.round(((completedProblemsCount + completedTasksCount) / 56) * 100)

  // Day-wise completion calculations:
  // "Mark a day complete only when all its required coding problems or revision tasks are complete."
  const dayStats = useMemo(() => {
    return days.map((day) => {
      if (day.day === 7) {
        const completedCount = day7TasksCompleted.length
        const total = 7
        const isComplete = completedCount >= total
        const percentage = Math.round((completedCount / total) * 100)
        return {
          day: 7,
          total,
          completedCount,
          isComplete,
          percentage,
          remaining: total - completedCount,
        }
      }
      const total = day.problems?.length || 0
      const completedCount = (day.problems || []).filter((p) => progress.completed?.includes(p.id)).length
      const isComplete = total > 0 && completedCount >= total
      const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0
      return {
        day: day.day,
        total,
        completedCount,
        isComplete,
        percentage,
        remaining: total - completedCount,
      }
    })
  }, [days, progress.completed, day7TasksCompleted])

  const completedDaysCount = dayStats.filter((d) => d.isComplete).length

  // Current active day: first day that is not yet complete (1..7), fallback to 7 if all done
  const activeDayNumber = useMemo(() => {
    const nextIncomplete = dayStats.find((d) => !d.isComplete)
    return nextIncomplete ? nextIncomplete.day : 7
  }, [dayStats])

  const activeDay = days.find((d) => d.day === activeDayNumber) || days[0]
  const activeDayRemainingTasks = dayStats.find((d) => d.day === activeDayNumber)?.remaining ?? 0

  const toggleDayExpansion = (dayNum: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayNum]: !prev[dayNum],
    }))
  }

  const expandAll = () => {
    const allExpanded: Record<number, boolean> = {}
    days.forEach((d) => {
      allExpanded[d.day] = true
    })
    setExpandedDays(allExpanded)
  }

  const collapseAll = () => {
    setExpandedDays({})
  }

  const scrollToDay = (dayNum: number) => {
    setExpandedDays((prev) => ({ ...prev, [dayNum]: true }))
    setTimeout(() => {
      const el = document.getElementById(`roadmap-day-${dayNum}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  return (
    <main className="main-content roadmap-page">
      {/* 1. HERO / DASHBOARD HEADER */}
      <section className="roadmap-hero">
        <div className="roadmap-hero-content">
          <div className="roadmap-badge-row">
            <span className="roadmap-kicker">
              <Zap size={14} fill="currentColor" /> 7-Day Intensive Prep
            </span>
            <span className="roadmap-pill-tag">
              <Clock3 size={12} /> 7 Days Total
            </span>
            <span className="roadmap-pill-tag">
              <Target size={12} /> 49 Unique Problems
            </span>
            <span className="roadmap-pill-tag">
              <Layers3 size={12} /> 7 Revision Tasks
            </span>
          </div>

          <h1 className="roadmap-title">
            7-Day DSA Pattern <span>Mastery</span>
          </h1>
          <p className="roadmap-subtitle">
            Master essential DSA patterns in one focused week.
          </p>

          <div className="roadmap-hero-actions">
            <button
              className="hero-cta primary"
              onClick={() => scrollToDay(activeDayNumber)}
              id="roadmap-resume-btn"
            >
              {completedProblemsCount === 0 && completedTasksCount === 0 ? (
                <>
                  Start Roadmap (Day 1) <ArrowRight size={16} />
                </>
              ) : completedDaysCount === 7 ? (
                <>
                  Roadmap Completed! Review Day 7 <Trophy size={16} />
                </>
              ) : (
                <>
                  Continue Day {activeDayNumber} ({activeDayRemainingTasks} remaining) <ArrowRight size={16} />
                </>
              )}
            </button>
            {mistakeProblems.length > 0 && (
              <button
                className="hero-cta ghost"
                onClick={() => {
                  setMistakesExpanded(true)
                  document.getElementById('roadmap-mistakes-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Flame size={15} fill="currentColor" style={{ color: '#ff6b4a' }} />
                Review Mistakes ({mistakeProblems.length})
              </button>
            )}
          </div>
        </div>

        {/* Hero Progress Gauge */}
        <div className="roadmap-progress-gauge-card">
          <div className="gauge-header">
            <span>OVERALL COMPLETION</span>
            <strong>{overallProgressPercentage}%</strong>
          </div>

          <div className="gauge-track-wrap">
            <div
              className="gauge-track-fill"
              style={{ width: `${overallProgressPercentage}%` }}
              role="progressbar"
              aria-valuenow={overallProgressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="gauge-stats-grid">
            <div className="gauge-stat-item">
              <span>Coding Problems</span>
              <strong>
                {completedProblemsCount} <sub>/ 49</sub>
              </strong>
            </div>
            <div className="gauge-stat-item">
              <span>Day 7 Tasks</span>
              <strong>
                {completedTasksCount} <sub>/ 7</sub>
              </strong>
            </div>
            <div className="gauge-stat-item">
              <span>Solved Independently</span>
              <strong>
                {solvedIndependentlyProblems.length} <sub>/ 49</sub>
              </strong>
            </div>
            <div className="gauge-stat-item">
              <span>Days Completed</span>
              <strong>
                {completedDaysCount} <sub>/ 7</sub>
              </strong>
            </div>
          </div>

          <div className="gauge-current-day-strip">
            <span className="current-dot" />
            <div>
              <strong>Current: Day {activeDayNumber}</strong> — {activeDay.title}
              <small> ({activeDayRemainingTasks} remaining tasks)</small>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DAILY STUDY SCHEDULE */}
      <section className="roadmap-routine-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">DAILY STUDY SCHEDULE</span>
            <h2>Recommended Daily Routine</h2>
            <p>Spend 6–7 hours daily following this structured high-yield interview schedule.</p>
          </div>
        </div>

        <div className="roadmap-routine-grid">
          {DAILY_STUDY_ROUTINE.map((item, idx) => {
            const Icon = routineIcons[item.icon] || BrainCircuit
            return (
              <div className={`routine-card step-${idx + 1}`} key={item.id}>
                <div className="routine-card-glow" />
                <div className="routine-card-header">
                  <span className="routine-step-num">Step {idx + 1}</span>
                  <span className="routine-duration">
                    <Clock3 size={13} /> {item.duration}
                  </span>
                </div>
                <div className="routine-icon-wrap">
                  <Icon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. RE-SOLVE MISTAKES QUEUE SECTION */}
      <section
        className={`roadmap-mistakes-section ${mistakesExpanded ? 'expanded' : 'collapsed'}`}
        id="roadmap-mistakes-section"
      >
        <div
          className="mistakes-section-header"
          onClick={() => setMistakesExpanded(!mistakesExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setMistakesExpanded(!mistakesExpanded)
            }
          }}
        >
          <div className="mistakes-title-wrap">
            <div className="flame-icon-ring">
              <Flame size={19} fill="currentColor" />
            </div>
            <div>
              <div className="mistakes-heading-row">
                <h2>Re-solve Mistakes & Revision Queue</h2>
                <span className="mistake-count-badge">
                  {mistakeProblems.length} queued
                </span>
              </div>
              <p>
                Problems you could not solve independently. Reattempt them without looking at solutions during your 1-hour mistake session.
              </p>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label={mistakesExpanded ? 'Collapse mistakes' : 'Expand mistakes'}
            onClick={(e) => {
              e.stopPropagation()
              setMistakesExpanded(!mistakesExpanded)
            }}
          >
            {mistakesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {mistakesExpanded && (
          <div className="mistakes-content">
            {mistakeProblems.length === 0 ? (
              <div className="empty-state mistakes-empty">
                <Sparkles size={28} style={{ color: 'var(--violet)' }} />
                <h3>No mistakes currently queued</h3>
                <p>
                  When you attempt a question and get stuck, click the <strong>Needs Revision</strong> flag on that question to queue it here. Once you re-solve it independently, unflag it!
                </p>
              </div>
            ) : (
              <div className="problem-list standalone">
                {mistakeProblems.map((problem, idx) => (
                  <RoadmapProblemRow
                    key={`mistake-${problem.id}`}
                    problem={problem}
                    index={idx}
                    completed={progress.completed?.includes(problem.id) || false}
                    solvedIndependently={progress.solvedIndependently?.includes(problem.id) || false}
                    needsRevision={true}
                    note={progress.notes?.[problem.id]}
                    onToggleComplete={() => toggleComplete(problem.id)}
                    onToggleIndependent={() => toggleIndependent(problem.id)}
                    onToggleMistake={() => toggleMistake(problem.id)}
                    onResetStatus={() => resetProblemStatus(problem.id)}
                    onSaveNote={(text) => saveNote(problem.id, text)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. EXACT SEVEN-DAY ROADMAP TIMELINE */}
      <section className="roadmap-schedule-section">
        <div className="schedule-toolbar">
          <div className="toolbar-left">
            <span className="section-kicker">7-DAY TIMELINE</span>
            <h2>Exact Seven-Day Schedule</h2>
          </div>
          <div className="toolbar-controls">
            <button className="roadmap-btn ghost-sm" onClick={expandAll}>
              Expand All
            </button>
            <button className="roadmap-btn ghost-sm" onClick={collapseAll}>
              Collapse All
            </button>
          </div>
        </div>

        <div className="roadmap-days-list">
          {days.map((day) => {
            const stats = dayStats.find((s) => s.day === day.day)!
            const isExpanded = Boolean(expandedDays[day.day])
            const isCurrentActive = activeDayNumber === day.day

            return (
              <article
                className={`roadmap-day-card ${stats.isComplete ? 'day-complete' : ''} ${
                  isCurrentActive ? 'day-active' : ''
                }`}
                key={`roadmap-day-${day.day}`}
                id={`roadmap-day-${day.day}`}
              >
                {/* Day Header */}
                <div
                  className="day-card-header"
                  onClick={() => toggleDayExpansion(day.day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleDayExpansion(day.day)
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="day-header-left">
                    <span className="day-number-pill">DAY {day.day}</span>
                    {day.priority && (
                      <span className="priority-pill">
                        <Flame size={12} fill="currentColor" /> {day.priority} Priority
                      </span>
                    )}
                    <h3 className="day-title">{day.title}</h3>
                  </div>

                  <div className="day-header-right">
                    <div className="day-progress-summary">
                      <div className="day-progress-bar-wrap">
                        <div
                          className="day-progress-bar-fill"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <span className="day-progress-text">
                        {stats.completedCount} / {stats.total} (
                        {stats.percentage}%)
                      </span>
                    </div>

                    {stats.isComplete ? (
                      <span className="day-status-pill complete">
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    ) : isCurrentActive ? (
                      <span className="day-status-pill in-progress">
                        <Circle size={10} fill="currentColor" /> In Progress
                      </span>
                    ) : (
                      <span className="day-status-pill upcoming">
                        {stats.remaining} remaining
                      </span>
                    )}

                    <button
                      className="icon-button"
                      aria-label={isExpanded ? 'Collapse day' : 'Expand day'}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleDayExpansion(day.day)
                      }}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Day Body */}
                {isExpanded && (
                  <div className="day-card-body">
                    {/* Revision Target Callout */}
                    <div className="revision-target-box">
                      <div className="target-label">
                        <Target size={15} /> Revision Target
                      </div>
                      <p className="target-text">{day.revisionTarget}</p>
                    </div>

                    {/* Pattern Tags */}
                    <div className="day-patterns-wrap">
                      <span className="patterns-label">Patterns Covered:</span>
                      <div className="pattern-tags-row">
                        {day.patterns.map((pat) => (
                          <span className="roadmap-pattern-chip" key={pat}>
                            {pat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Content: Coding problems for Days 1-6, Checklist for Day 7 */}
                    {day.day === 7 ? (
                      <div className="day7-checklist-section">
                        <div className="checklist-subhead">
                          <h4>Day 7 Assessment & Revision Tasks (7 of 7)</h4>
                          <span className="checklist-count">
                            {day7TasksCompleted.length} of 7 tasks completed
                          </span>
                        </div>
                        <p className="checklist-desc">
                          Complete these checklist tasks in order to cement all templates, state complexities aloud, and simulate timed mock conditions.
                        </p>
                        <div className="day7-tasks-list">
                          {(day.revisionTasks || []).map((t, idx) => {
                            const isChecked = day7TasksCompleted.includes(t.id)
                            return (
                              <div
                                className={`day7-task-row ${isChecked ? 'task-checked' : ''}`}
                                key={t.id}
                                onClick={() => toggleDay7Task(t.id)}
                                role="checkbox"
                                aria-checked={isChecked}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    toggleDay7Task(t.id)
                                  }
                                }}
                              >
                                <button
                                  className={`check-button ${isChecked ? 'done' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleDay7Task(t.id)
                                  }}
                                  aria-label={isChecked ? 'Mark incomplete' : 'Mark task complete'}
                                >
                                  {isChecked ? <Check size={14} strokeWidth={3} /> : null}
                                </button>
                                <span className="task-index">#{idx + 1}</span>
                                <span className="task-label">{t.task}</span>
                                <span className="task-status-tag">
                                  {isChecked ? 'Completed' : 'Pending'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="day-problem-list">
                        <div className="problem-list standalone">
                          {(day.problems || []).map((problem, idx) => {
                            const isSolved = progress.completed?.includes(problem.id) || false
                            const isIndependent = progress.solvedIndependently?.includes(problem.id) || false
                            const isMistake = progress.mistakes?.includes(problem.id) || false

                            return (
                              <RoadmapProblemRow
                                key={problem.id}
                                problem={problem}
                                index={idx}
                                completed={isSolved}
                                solvedIndependently={isIndependent}
                                needsRevision={isMistake}
                                note={progress.notes?.[problem.id]}
                                onToggleComplete={() => toggleComplete(problem.id)}
                                onToggleIndependent={() => toggleIndependent(problem.id)}
                                onToggleMistake={() => toggleMistake(problem.id)}
                                onResetStatus={() => resetProblemStatus(problem.id)}
                                onSaveNote={(text) => saveNote(problem.id, text)}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

/**
 * Polished, fully functional problem row tailored for the 7-day roadmap with
 * independent solved tracking, mistake revision flagging, and status reset controls.
 */
function RoadmapProblemRow({
  problem,
  index,
  completed,
  solvedIndependently,
  needsRevision,
  note,
  onToggleComplete,
  onToggleIndependent,
  onToggleMistake,
  onResetStatus,
  onSaveNote,
}: {
  problem: Problem
  index: number
  completed: boolean
  solvedIndependently: boolean
  needsRevision: boolean
  note?: string
  onToggleComplete: () => void
  onToggleIndependent: () => void
  onToggleMistake: () => void
  onResetStatus: () => void
  onSaveNote: (text: string) => void
}) {
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState(note || '')

  const handleSave = () => {
    onSaveNote(noteText)
    setEditingNote(false)
  }

  return (
    <>
      <div
        className={`problem-row roadmap-problem-row ${completed ? 'solved' : ''} ${
          needsRevision ? 'flagged-mistake' : ''
        }`}
      >
        {/* Checkbox: Mark as Solved */}
        <button
          className="check-button"
          onClick={onToggleComplete}
          aria-pressed={completed}
          title={completed ? 'Mark unsolved' : 'Mark as Solved'}
          aria-label={completed ? 'Mark unsolved' : 'Mark as Solved'}
        >
          {completed ? <Check size={15} strokeWidth={3} /> : null}
        </button>

        {/* Index */}
        <span className="problem-index">{String(index + 1).padStart(2, '0')}</span>

        {/* Problem Title & Meta */}
        <div className="problem-name">
          <div className="problem-title-row">
            <strong className="problem-title-text">
              <a
                href={problem.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
                title="Open problem on LeetCode"
              >
                {problem.title}
              </a>
            </strong>
            <div className="problem-badge-cluster">
              {solvedIndependently && (
                <span className="independent-pill" title="Solved independently without hints">
                  <Sparkles size={10} /> Independent
                </span>
              )}
              {needsRevision && (
                <span className="mistake-pill" title="Flagged for revision in mistake queue">
                  <Flame size={10} fill="currentColor" /> Needs Revision
                </span>
              )}
            </div>
          </div>
          <span>
            {completed && <i className="completed-dot" />}
            {completed ? 'Solved · ' : ''}
            {problem.company}
          </span>
        </div>

        {/* Pattern & Topic Tags */}
        <span className="pattern-pill" title={problem.pattern}>
          {problem.pattern}
        </span>

        {/* Difficulty Badge */}
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
          {problem.difficulty}
        </span>

        {/* Action: Mark as Solved Independently */}
        <button
          className={`roadmap-action-btn ${solvedIndependently ? 'active-independent' : ''}`}
          onClick={onToggleIndependent}
          title={solvedIndependently ? 'Remove independent solve mark' : 'Mark as Solved Independently'}
          aria-label="Toggle Solved Independently"
        >
          <Sparkles size={16} />
        </button>

        {/* Action: Flag as Mistake / Needs Revision */}
        <button
          className={`roadmap-action-btn ${needsRevision ? 'active-mistake' : ''}`}
          onClick={onToggleMistake}
          title={needsRevision ? 'Remove mistake flag' : 'Mark as Needs Revision / Flag Mistake'}
          aria-label="Toggle Needs Revision"
        >
          <Flag size={16} fill={needsRevision ? 'currentColor' : 'none'} />
        </button>

        {/* Action: Reset Status */}
        <button
          className="roadmap-action-btn"
          onClick={onResetStatus}
          title="Reset problem status (unsolve and clear flags)"
          aria-label="Reset problem status"
        >
          <RotateCcw size={15} />
        </button>

        {/* Video Solution */}
        <a
          className="bookmark-button"
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
            problem.title + ' leetcode solution neetcode'
          )}`}
          target="_blank"
          rel="noreferrer"
          title="Watch video explanation"
          aria-label="Watch video explanation"
        >
          <PlaySquare size={17} />
        </a>

        {/* Notes */}
        <button
          className={`bookmark-button ${note ? 'has-note' : ''}`}
          onClick={() => setEditingNote(!editingNote)}
          aria-label="Toggle notes"
          title="Take revision notes"
        >
          <FileText size={17} fill={note ? 'currentColor' : 'none'} />
        </button>

        {/* Solve Problem Action Link */}
        <a
          className="solve-button"
          href={problem.url}
          target="_blank"
          rel="noreferrer"
          title="Solve on LeetCode (opens in new tab)"
        >
          {completed ? 'Review' : 'Solve'} <ArrowRight size={14} />
        </a>
      </div>

      {/* Note editor drawer */}
      {editingNote && (
        <div className="problem-note-editor">
          <textarea
            placeholder="Write down your pattern recognition clue, key edge cases, and time/space complexity..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <div className="note-actions">
            <button className="ghost-button" onClick={() => setEditingNote(false)}>
              Cancel
            </button>
            <button className="primary-button" onClick={handleSave}>
              <Save size={15} /> Save Note
            </button>
          </div>
        </div>
      )}
    </>
  )
}
