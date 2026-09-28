import type { Difficulty, Problem, Sheet } from '../types'

const frontmatter = (source: string) => {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  const meta: Record<string, string> = {}
  if (match) {
    match[1].split('\n').forEach((line) => {
      const separator = line.indexOf(':')
      if (separator > -1) {
        meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      }
    })
  }
  return { meta, body: match ? source.slice(match[0].length) : source }
}

const cleanCell = (cell: string) => cell.trim().replace(/^`|`$/g, '')

// Identity of a problem is the question itself, not the sheet it lives in — so
// solving it in one sheet marks it solved everywhere. Prefer the LeetCode
// problem slug from the URL; fall back to a slug of the title.
export const problemKey = (title: string, url: string) => {
  const match = url.match(/\/problems\/([a-z0-9-]+)/i)
  if (match) return `lc:${match[1].toLowerCase()}`
  return `t:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
}

const parseCompanies = (raw: string) =>
  raw.split(/[,/]/).map((name) => name.trim()).filter(Boolean)

// Sheets label the same topic differently ("Arrays" / "Arrays & Hashing" /
// "Array"), and some use roadmap groupings ("Week 1 — Foundations"). Fold them
// into one clean, ordered topic list for the All Problems category filter.
const TOPIC_RULES: [RegExp, string][] = [
  [/hash|map|set/, 'Hashing'],
  [/two[\s-]?pointer/, 'Two Pointers'],
  [/sliding/, 'Sliding Window'],
  [/stack|queue|monotonic/, 'Stacks & Queues'],
  [/linked[\s-]?list/, 'Linked List'],
  [/(binary\s+search\s+tree|bst)/, 'Trees'],
  [/binary\s+search/, 'Binary Search'],
  [/trie/, 'Tries'],
  [/tree/, 'Trees'],
  [/heap|priority/, 'Heap'],
  [/graph/, 'Graphs'],
  [/(dynamic|dp|memo)/, 'Dynamic Programming'],
  [/greedy/, 'Greedy'],
  [/backtrack|recursion|permutation|combination|subset/, 'Backtracking'],
  [/bit/, 'Bit Manipulation'],
  [/interval/, 'Intervals'],
  [/matrix/, 'Matrix'],
  [/divide/, 'Divide & Conquer'],
  [/string/, 'Strings'],
  [/array/, 'Arrays'],
]

export const TOPIC_ORDER = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window', 'Stacks & Queues',
  'Linked List', 'Binary Search', 'Trees', 'Tries', 'Heap', 'Graphs',
  'Dynamic Programming', 'Greedy', 'Backtracking', 'Bit Manipulation', 'Intervals',
  'Matrix', 'Divide & Conquer', 'Other',
]

export const normalizeTopic = (category: string, pattern: string) => {
  const haystack = `${category} ${pattern}`.toLowerCase()
  for (const [pattern, topic] of TOPIC_RULES) if (pattern.test(haystack)) return topic
  return 'Other'
}

export function parseSheet(source: string, fallbackSlug: string): Sheet {
  const { meta, body } = frontmatter(source)
  const problems: Problem[] = []
  let category = 'General'

  body.split('\n').forEach((line) => {
    const heading = line.match(/^##\s+(.+)/)
    if (heading) category = heading[1].trim()
    if (!line.trim().startsWith('|') || /^\|\s*[-:]+/.test(line)) return

    const cells = line.split('|').slice(1, -1).map(cleanCell)
    if (cells.length < 5 || cells[0].toLowerCase() === 'problem') return
    const [title, difficulty, url, pattern, company] = cells
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return
    problems.push({
      id: problemKey(title, url),
      title,
      difficulty: difficulty as Difficulty,
      url,
      pattern,
      company,
      companies: parseCompanies(company),
      category,
      topic: normalizeTopic(category, pattern),
    })
  })

  return {
    slug: meta.slug || fallbackSlug,
    title: meta.title || fallbackSlug,
    description: meta.description || '',
    author: meta.author || 'DSA Grind',
    icon: meta.icon || 'code',
    accent: meta.accent || 'violet',
    estimated: meta.estimated || `${problems.length * 30} min`,
    featured: meta.featured === 'true',
    problems,
  }
}

export function loadSheets(): Sheet[] {
  const modules = import.meta.glob('../../content/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  return Object.entries(modules)
    .map(([path, source]) => parseSheet(source, path.split('/').pop()?.replace('.md', '') || 'sheet'))
    .sort((a, b) => Number(b.featured) - Number(a.featured))
}
