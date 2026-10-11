import type { Problem, RoadmapDayConfig, RoadmapRevisionTask } from '../types'
import { normalizeTopic } from './parseSheets'

export interface DailyStudyRoutineItem {
  id: string
  title: string
  duration: string
  description: string
  icon: string
}

export const DAILY_STUDY_ROUTINE: DailyStudyRoutineItem[] = [
  {
    id: 'pattern-revision',
    title: 'Pattern Revision',
    duration: '1 hour',
    description: 'Review intuition, templates, recognition clues, and time and space complexity.',
    icon: 'BrainCircuit',
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    duration: '3–4 hours',
    description: 'Attempt 6–8 selected problems independently. On days with more questions, allow additional time.',
    icon: 'Code2',
  },
  {
    id: 'resolve-mistakes',
    title: 'Re-solve Mistakes',
    duration: '1 hour',
    description: 'Reattempt problems that could not be solved independently, without looking at solutions.',
    icon: 'Flame',
  },
  {
    id: 'timed-practice',
    title: 'Timed Practice',
    duration: '1 hour',
    description: 'Solve 1–2 questions under assessment conditions.',
    icon: 'Clock3',
  },
]

export const DAY_7_REVISION_TASKS: RoadmapRevisionTask[] = [
  { id: 'task-1', task: 'Revise array and hashing templates.' },
  { id: 'task-2', task: 'Revise binary search and stack.' },
  { id: 'task-3', task: 'Revise linked list and tree traversals.' },
  { id: 'task-4', task: 'Revise BFS, DFS, DSU, and topological sort.' },
  { id: 'task-5', task: 'Revise heap, greedy, and DP.' },
  { id: 'task-6', task: 'Solve 2 unseen problems in 60–90 minutes.' },
  { id: 'task-7', task: 'Review mistakes and time and space complexity of every solution.' },
]

interface RawProblemSpec {
  title: string
  slug: string
  fallback?: {
    difficulty: 'Easy' | 'Medium' | 'Hard'
    url: string
    pattern: string
    company: string
    category: string
  }
}

interface RawDaySpec {
  day: number
  title: string
  priority?: string
  patterns: string[]
  revisionTarget: string
  problems?: RawProblemSpec[]
}

const RAW_ROADMAP_SCHEDULE: RawDaySpec[] = [
  {
    day: 1,
    title: 'Arrays, Hashing and Pointers',
    priority: 'Highest',
    patterns: [
      'Arrays',
      'HashMap / HashSet',
      'Frequency Counting',
      'Prefix Sum',
      'Kadane\'s Algorithm',
      'Two Pointers',
      'Sliding Window',
      'Sorting + Greedy',
    ],
    revisionTarget: 'Know when to use a hash map, prefix sum, two pointers, or sliding window.',
    problems: [
      { title: 'Two Sum', slug: 'two-sum' },
      { title: 'Contains Duplicate', slug: 'contains-duplicate' },
      { title: 'Valid Anagram', slug: 'valid-anagram' },
      { title: 'Product of Array Except Self', slug: 'product-of-array-except-self' },
      { title: 'Maximum Subarray', slug: 'maximum-subarray' },
      { title: 'Subarray Sum Equals K', slug: 'subarray-sum-equals-k' },
      { title: 'Best Time to Buy and Sell Stock', slug: 'best-time-to-buy-and-sell-stock' },
      { title: 'Valid Palindrome', slug: 'valid-palindrome' },
      { title: 'Container With Most Water', slug: 'container-with-most-water' },
      { title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters' },
    ],
  },
  {
    day: 2,
    title: 'Strings, Binary Search and Stack',
    patterns: [
      'Binary Search',
      'Binary Search on Answer Space',
      'Stack',
      'Monotonic Stack',
      'Parentheses',
      'String Manipulation',
    ],
    revisionTarget: 'Recognize sorted search spaces, matching brackets, and next-greater-element problems.',
    problems: [
      { title: 'Binary Search', slug: 'binary-search' },
      { title: 'Search in Rotated Sorted Array', slug: 'search-in-rotated-sorted-array' },
      { title: 'Find Minimum in Rotated Sorted Array', slug: 'find-minimum-in-rotated-sorted-array' },
      { title: 'Koko Eating Bananas', slug: 'koko-eating-bananas' },
      { title: 'Valid Parentheses', slug: 'valid-parentheses' },
      { title: 'Min Stack', slug: 'min-stack' },
      { title: 'Daily Temperatures', slug: 'daily-temperatures' },
      {
        title: 'Longest Valid Parentheses',
        slug: 'longest-valid-parentheses',
        fallback: {
          difficulty: 'Hard',
          url: 'https://leetcode.com/problems/longest-valid-parentheses/',
          pattern: 'Monotonic Stack / Parentheses',
          company: 'Amazon, Meta, Google',
          category: 'Stack',
        },
      },
    ],
  },
  {
    day: 3,
    title: 'Linked Lists, Recursion and Trees',
    patterns: [
      'Fast and Slow Pointers',
      'Linked List Reversal',
      'Recursion',
      'DFS',
      'BFS',
      'Binary Search Trees',
      'Backtracking Basics',
    ],
    revisionTarget: 'Be comfortable with recursion base cases, tree traversal, and fast/slow pointers.',
    problems: [
      { title: 'Reverse Linked List', slug: 'reverse-linked-list' },
      { title: 'Linked List Cycle', slug: 'linked-list-cycle' },
      { title: 'Merge Two Sorted Lists', slug: 'merge-two-sorted-lists' },
      { title: 'Remove Nth Node From End', slug: 'remove-nth-node-from-end-of-list' },
      { title: 'Maximum Depth of Binary Tree', slug: 'maximum-depth-of-binary-tree' },
      { title: 'Binary Tree Level Order Traversal', slug: 'binary-tree-level-order-traversal' },
      { title: 'Validate Binary Search Tree', slug: 'validate-binary-search-tree' },
      { title: 'Lowest Common Ancestor of a BST', slug: 'lowest-common-ancestor-of-a-binary-search-tree' },
    ],
  },
  {
    day: 4,
    title: 'Heaps, Greedy and Intervals',
    patterns: [
      'Min Heap / Max Heap',
      'Top K Elements',
      'Scheduling',
      'Sorting + Greedy',
      'Interval Merging',
    ],
    revisionTarget: 'Use a heap when repeatedly extracting the minimum or maximum, and sort intervals before merging.',
    problems: [
      { title: 'Kth Largest Element in an Array', slug: 'kth-largest-element-in-an-array' },
      { title: 'Top K Frequent Elements', slug: 'top-k-frequent-elements' },
      { title: 'Merge Intervals', slug: 'merge-intervals' },
      { title: 'Insert Interval', slug: 'insert-interval' },
      { title: 'Assign Cookies', slug: 'assign-cookies' },
      { title: 'Task Scheduler', slug: 'task-scheduler' },
    ],
  },
  {
    day: 5,
    title: 'Graphs',
    patterns: [
      'DFS',
      'BFS',
      'Grid DFS / BFS',
      'Multi-source BFS',
      'Cycle Detection',
      'Topological Sort',
      'Disjoint Set Union (DSU)',
      'Dijkstra',
      'Minimum Spanning Tree (MST)',
      'Bipartite Coloring',
    ],
    revisionTarget: 'Understand BFS for unweighted shortest paths, Dijkstra for non-negative edge weights, topological sort for dependencies, and DSU for merging components.',
    problems: [
      { title: 'Number of Islands', slug: 'number-of-islands' },
      { title: 'Flood Fill', slug: 'flood-fill' },
      { title: 'Rotting Oranges', slug: 'rotting-oranges' },
      { title: 'Number of Provinces', slug: 'number-of-provinces' },
      { title: 'Course Schedule', slug: 'course-schedule' },
      { title: 'Is Graph Bipartite?', slug: 'is-graph-bipartite' },
      { title: 'Network Delay Time', slug: 'network-delay-time' },
      { title: 'Accounts Merge', slug: 'accounts-merge' },
      { title: 'Min Cost to Connect All Points', slug: 'min-cost-to-connect-all-points' },
    ],
  },
  {
    day: 6,
    title: 'Dynamic Programming and Backtracking',
    patterns: [
      '1D Dynamic Programming',
      'Take / Not-Take',
      'Grid DP',
      'Knapsack',
      'Subsequences',
      'Memoization',
      'Permutations and Combinations',
      'Backtracking',
    ],
    revisionTarget: 'Define the DP state, transition, base case, and final answer. For backtracking, follow choose → explore → undo.',
    problems: [
      { title: 'Climbing Stairs', slug: 'climbing-stairs' },
      { title: 'House Robber', slug: 'house-robber' },
      { title: 'Coin Change', slug: 'coin-change' },
      { title: 'Unique Paths', slug: 'unique-paths' },
      { title: 'Partition Equal Subset Sum', slug: 'partition-equal-subset-sum' },
      { title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence' },
      { title: 'Longest Common Subsequence', slug: 'longest-common-subsequence' },
      { title: 'Word Search', slug: 'word-search' },
    ],
  },
  {
    day: 7,
    title: 'Revision and Mock Assessment',
    patterns: [
      'Comprehensive Pattern Review',
      'Time & Space Complexity',
      'Mistake Re-solving',
      'Timed Mock Practice',
    ],
    revisionTarget: 'Solve without hints, explain your approach aloud, and state the time and space complexity.',
  },
]

/**
 * Builds the canonical 7-day roadmap by linking to existing problems in the database.
 * If a problem exists in `allProblems`, it reuses its ID, URL, difficulty, tags, and stats.
 * If not, it uses verified official problem details with canonical `lc:<slug>` ID.
 */
export function buildRoadmapDays(allProblems: Problem[]): RoadmapDayConfig[] {
  // Create fast lookup maps by lc-slug, canonical id, and normalized title
  const bySlug = new Map<string, Problem>()
  const byId = new Map<string, Problem>()
  const byTitle = new Map<string, Problem>()

  allProblems.forEach((p) => {
    byId.set(p.id, p)
    const match = p.url.match(/\/problems\/([a-z0-9-]+)/i)
    if (match) {
      bySlug.set(match[1].toLowerCase(), p)
    }
    const titleNorm = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '')
    if (!byTitle.has(titleNorm)) {
      byTitle.set(titleNorm, p)
    }
  })

  return RAW_ROADMAP_SCHEDULE.map((daySpec) => {
    if (daySpec.day === 7) {
      return {
        day: 7,
        title: daySpec.title,
        priority: daySpec.priority,
        patterns: daySpec.patterns,
        revisionTarget: daySpec.revisionTarget,
        problems: [],
        revisionTasks: DAY_7_REVISION_TASKS,
      }
    }

    const resolvedProblems: Problem[] = (daySpec.problems || []).map((spec) => {
      // 1. Try match by slug
      let found = bySlug.get(spec.slug)
      // 2. Try match by canonical id
      if (!found) found = byId.get(`lc:${spec.slug}`)
      // 3. Try match by normalized title
      if (!found) {
        const titleNorm = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '')
        found = byTitle.get(titleNorm)
      }

      if (found) {
        // Return existing problem while preserving requested exact display title
        return {
          ...found,
          title: spec.title, // Ensure exact title as requested in prompt
        }
      }

      // Verified fallback (e.g. Longest Valid Parentheses)
      const fallback = spec.fallback || {
        difficulty: 'Medium' as const,
        url: `https://leetcode.com/problems/${spec.slug}/`,
        pattern: daySpec.patterns[0] || 'Algorithm',
        company: 'FAANG',
        category: daySpec.title,
      }

      return {
        id: `lc:${spec.slug}`,
        title: spec.title,
        difficulty: fallback.difficulty,
        url: fallback.url,
        pattern: fallback.pattern,
        company: fallback.company,
        companies: fallback.company.split(/[,/]/).map((c) => c.trim()).filter(Boolean),
        category: fallback.category,
        topic: normalizeTopic(fallback.category, fallback.pattern),
      }
    })

    return {
      day: daySpec.day,
      title: daySpec.title,
      priority: daySpec.priority,
      patterns: daySpec.patterns,
      revisionTarget: daySpec.revisionTarget,
      problems: resolvedProblems,
      revisionTasks: undefined,
    }
  })
}
