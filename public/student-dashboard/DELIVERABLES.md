# Student Dashboard mockup — deliverables

A production-grade Student Dashboard UI mockup, committed to the **binding Wealthoria
brand** (the brief's "match the existing site precisely" instruction overrides its generic
amber/teal suggestion). Warm **coral** accent, **Manrope** (heavy display) + **Inter** body,
off-white/sage surfaces, 24px radius, hairline borders, no shadow system.

## Files
| File | Purpose |
|---|---|
| `Student Dashboard.html` | Entry; loads React + fonts + the dashboard. |
| `student-dashboard/studentDashboard.css` | All styling: `:root` tokens, sidebar, cards, grids, responsive. |
| `student-dashboard/data.jsx` | Mock data (user, courses, stats, reviews) — shapes below. |
| `student-dashboard/components.jsx` | Reusable components (props below). |
| `student-dashboard/StudentDashboard.jsx` | All four screens + app shell + mount. |

## Screens (stacked, navigable in one file)
1. **Overview** — greeting + date, 3 stat cards, dark "Continue learning" banner with progress + Resume, "Recommended for you" horizontal scroll row.
2. **My courses** — filter tabs (All / In progress / Completed / Bookmarked), search, sort; responsive course grid; empty state.
3. **Course detail** — hero banner with title overlay + badges, curriculum accordion (sections → lessons with duration + completion check), sticky info sidebar, instructor card, Overview/Reviews/Q&A tabs.
4. **Purchase flow** — modal: course summary, payment-method selector (Card/UPI/Wallet), order summary with GST line items, Pay now → animated success checkmark + receipt + "Go to course".

## Reusable components (with prop types)
- **`Avatar`** `{ name: string, initials?: string, src?: string, size?: "xs"|"sm"|"md"|"lg" }` — initials fallback.
- **`StatCard`** `{ icon: string, label: string, value: string|number, trend?: string }`.
- **`ProgressBar`** `{ percent: number, size?: "sm"|"md"|"lg", color?: string, onDark?: bool, showPct?: bool }` — animates width on mount via CSS.
- **`CourseCard`** `{ course: Course, onOpen?: (course)=>void, variant?: "grid"|"row"|"recommend" }`.
- **`NavItem`** `{ icon: string, label: string, active?: bool, onClick?: ()=>void }` — left-border active state.
- **`Stars`** `{ rating: number, count?: number }`.
- **`Icon`** `{ name: string, size?: number, stroke?: number }`.

## Mock data shapes (match future API responses)
```
User    { id, name, role, initials, joinedYear }
Course  { id, title, category, instructor:{name,initials}, rating, ratingCount,
          students, price, isEnrolled, progress, lastChapter, durationHrs,
          lessonsCount, updated, thumb, bookmarked,
          status: "in-progress"|"completed"|"not-started",
          curriculum: [ { id, title, lessons:[ { id, title, duration, done } ] } ] }
Stat    { id, icon, label, value, trend }
Review  { id, name, initials, rating, text }
```

## Interactions & states (all implemented)
Sidebar active link (left-border + tint) · course-card hover lift + border transition ·
progress bars animate width on mount · button hover-darken + active scale(.97) ·
`:focus-visible` ring on all interactive elements · modal focus-trap + Escape + restore ·
focus moves to each screen's heading on mount · chart/region aria-labels.

## Responsive
- **≥1024px:** full 240px sidebar + 3-column course grid.
- **768–1023px:** icon-only collapsed sidebar + 2-column grid.
- **<768px:** hamburger menu (slide-in sidebar + scrim) + 1-column stack.

## Note
No new npm dependencies — pure React + CSS, no external UI/chart libraries, per the brief.
Payment is simulated. For the production wiring (auth, real payments, API), see
`DEVELOPER-REQUIREMENTS.md`.
