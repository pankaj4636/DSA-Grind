# Contributing to AlgoVault

Thanks for wanting to help — AlgoVault gets better every time someone fixes a link, adds a sheet, or
sharpens the learning material. **You do not need to be a React developer to contribute.** Most of the
value lives in plain Markdown.

- 🔗 **Live app:** [dsa.nextjoblist.com](https://dsa.nextjoblist.com/)
- 🐛 **Found a bug or a dead LeetCode link?** [Open an issue](https://github.com/sumitsingh4411/faang/issues/new) — that alone is a real contribution.

---

## Ways to contribute (easiest first)

| Contribution | Skill needed | Where |
| --- | --- | --- |
| Report a wrong/dead LeetCode link | none | [Issues](https://github.com/sumitsingh4411/faang/issues) |
| Fix a typo or a broken link | Markdown | `content/*.md`, `README.md` |
| Correct a difficulty, company, or pattern tag | Markdown | `content/*.md` |
| Add problems to an existing sheet | Markdown | `content/<sheet>.md` |
| Add a whole new roadmap | Markdown | new file in `content/` |
| Improve the learning guide | Markdown | `README.md` |
| Fix or build a UI feature | React + TypeScript | `src/` |

---

## Run it locally

```bash
git clone https://github.com/sumitsingh4411/faang.git
cd faang
npm install
npm run dev          # http://localhost:5173
```

Before opening a pull request:

```bash
npx tsc --noEmit     # types must pass
npm run build        # build must succeed
```

---

## Editing the problem sheets

Every sheet is a single Markdown file in [`content/`](content/) — frontmatter, then one table per
topic. Adding a problem is just adding a row:

```md
| Problem | Difficulty | LeetCode | Pattern | Companies |
| --- | --- | --- | --- | --- |
| Two Sum | Easy | https://leetcode.com/problems/two-sum/ | Hash Map | Amazon, Google |
```

**The rules that keep the app working:**

- **The LeetCode URL is the identity of a problem.** Use the exact canonical URL
  (`https://leetcode.com/problems/<slug>/`). That slug is what syncs your progress across every sheet
  and de-duplicates the library — a typo there silently creates a "new" problem.
- **`Difficulty`** must be exactly `Easy`, `Medium`, or `Hard`.
- **`Pattern`** feeds the category filter and the topic chips on each card. Use the real technique
  (`Sliding Window`, `Union Find`, `Monotonic Stack`), not a vague label — it's what makes the library
  searchable by *idea*.
- **`Companies`** is a comma-separated list. Keep names consistent (`Amazon`, not `AMZN`/`amazon`).
- **No duplicate URLs within a single sheet.** Across sheets is fine and expected — that's the whole point.

## Adding a new roadmap

Drop a new file into `content/`. The app picks it up automatically — no React changes needed.

```md
---
title: My Awesome Sheet
slug: my-awesome-sheet
description: One sentence on who this is for.
author: Original Curator
icon: code          # target | layers | code | briefcase
accent: violet      # violet | blue | green | orange
estimated: 8–10 weeks
featured: false
---

## Arrays

| Problem | Difficulty | LeetCode | Pattern | Companies |
| --- | --- | --- | --- | --- |
| Two Sum | Easy | https://leetcode.com/problems/two-sum/ | Hash Map | Amazon, Google |
```

If you're transcribing a well-known list (a YouTuber's sheet, a company list), please **credit the
original author** in the `author` field and link the source in your PR description.

---

## Pull request checklist

1. Fork the repo and branch from `main` (`git checkout -b fix/dead-links`).
2. Make your change. Keep PRs focused — one sheet or one fix per PR is easiest to review.
3. Run `npx tsc --noEmit` and `npm run build`.
4. Write a clear PR title and say what you changed and why. Link any source you transcribed from.
5. Open the PR against `main`.

Small, well-scoped PRs get merged fastest. When in doubt, open an issue first and we'll figure out the
approach together.

---

## Code style

- Match the surrounding code — the project favours compact, readable modules over ceremony.
- No new runtime dependencies without a good reason; the app is deliberately backend-free and light.
- Keep accessibility intact: visible focus states, keyboard operability, and `prefers-reduced-motion`
  are respected throughout — don't regress them.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE), and
that you will uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

Thanks for making interview prep better for the next person. ⭐
