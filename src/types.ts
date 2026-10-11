export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Problem {
  id: string
  title: string
  difficulty: Difficulty
  url: string
  pattern: string
  company: string
  companies: string[]
  category: string
  topic: string
}

export interface Sheet {
  slug: string
  title: string
  description: string
  author: string
  icon: string
  accent: string
  estimated: string
  featured: boolean
  problems: Problem[]
}

export interface ProgressState {
  completed: string[]
  bookmarked: string[]
  notes: Record<string, string>
  completionDates?: Record<string, string>
  leetcodeUsername?: string
  solvedIndependently?: string[]
  mistakes?: string[]
  day7RevisionTasks?: string[]
}

export interface RoadmapRevisionTask {
  id: string
  task: string
  completed?: boolean
}

export interface RoadmapDayConfig {
  day: number
  title: string
  priority?: string
  patterns: string[]
  revisionTarget: string
  problemSlugs?: string[]
  problems?: Problem[]
  revisionTasks?: RoadmapRevisionTask[]
}
