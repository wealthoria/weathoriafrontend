/* global window */
/* =========================================================================
   Wealthoria Student Portal — mock data
   Stands in for backend course catalog + a seeded demo student. In production
   this comes from your API (GET /courses, GET /me, GET /me/courses).
   ========================================================================= */

const COURSES = [
  {
    id: "stock-fundamentals",
    title: "Stock market fundamentals",
    category: "Markets",
    icon: "pie",
    level: "Beginner",
    lessons: 8,
    hours: 6,
    instructor: "Wealthoria faculty",
    price: 1999,
    was: 2999,
    blurb: "How shares, indices and the market really work, explained from zero.",
    lessonList: ["What is a share?", "How exchanges work", "Reading a stock quote", "Indices explained", "Orders and brokers", "Risk basics", "Building a watchlist", "Your first analysis"],
  },
  {
    id: "mutual-funds",
    title: "Mutual funds & SIPs",
    category: "Markets",
    icon: "layers",
    level: "Beginner",
    lessons: 6,
    hours: 4,
    instructor: "Wealthoria faculty",
    price: 1499,
    was: 2499,
    blurb: "Build wealth steadily through diversified funds and disciplined SIPs.",
    lessonList: ["Funds vs stocks", "Types of mutual funds", "What is an SIP?", "Reading a fund factsheet", "Direct vs regular plans", "Starting your SIP"],
  },
  {
    id: "personal-finance",
    title: "Personal finance",
    category: "Foundations",
    icon: "wallet",
    level: "Beginner",
    lessons: 7,
    hours: 5,
    instructor: "Wealthoria faculty",
    price: 999,
    was: 1799,
    blurb: "Budgeting, saving, debt and emergency funds, your financial foundation.",
    lessonList: ["Money mindset", "Budgeting that works", "Saving habits", "Good vs bad debt", "Emergency fund", "Insurance basics", "Your money system"],
  },
  {
    id: "financial-planning",
    title: "Financial planning",
    category: "Foundations",
    icon: "target",
    level: "Intermediate",
    lessons: 5,
    hours: 4,
    instructor: "Wealthoria faculty",
    price: 1799,
    was: 2799,
    blurb: "Set goals, plan for life events, and map money to the life you want.",
    lessonList: ["Goal setting", "Life-stage planning", "Tax basics", "Retirement maths", "Building your plan"],
  },
  {
    id: "investor-psychology",
    title: "Investor psychology",
    category: "Mindset",
    icon: "brain",
    level: "Intermediate",
    lessons: 4,
    hours: 3,
    instructor: "Wealthoria faculty",
    price: 1299,
    was: 1999,
    blurb: "Master the emotions (fear, greed, patience) that decide real returns.",
    lessonList: ["Fear and greed", "Behavioural biases", "Patience and discipline", "Building conviction"],
  },
  {
    id: "asset-allocation",
    title: "Asset allocation",
    category: "Mindset",
    icon: "scale",
    level: "Advanced",
    lessons: 5,
    hours: 4,
    instructor: "Wealthoria faculty",
    price: 2299,
    was: 3299,
    blurb: "Balance risk across equity, debt and gold to match your goals.",
    lessonList: ["Why allocation matters", "Equity vs debt", "Gold and alternatives", "Rebalancing", "Your model portfolio"],
  },
  {
    id: "tax-saving",
    title: "Tax saving essentials",
    category: "Foundations",
    icon: "file",
    level: "Beginner",
    lessons: 5,
    hours: 3,
    instructor: "Wealthoria faculty",
    price: 1199,
    was: 1899,
    blurb: "Understand 80C, deductions and tax-smart investing the simple way.",
    lessonList: ["How income tax works", "Section 80C", "ELSS funds", "Other deductions", "Filing basics"],
  },
  {
    id: "reading-charts",
    title: "Reading market charts",
    category: "Markets",
    icon: "trending",
    level: "Intermediate",
    lessons: 6,
    hours: 5,
    instructor: "Wealthoria faculty",
    price: 1699,
    was: 2599,
    blurb: "A calm, jargon-free intro to charts, trends and what they really show.",
    lessonList: ["Price and time", "Trends and ranges", "Support and resistance", "Volume basics", "Common patterns", "Avoiding traps"],
  },
];

/* The seeded demo student. Password is intentionally simple for the prototype. */
const DEMO_USER = {
  id: "stu_001",
  name: "Priya Rao",
  email: "priya@student.in",
  password: "wealth123",
  city: "Bengaluru",
  joined: "Jan 2026",
};

/* Seed: which courses the demo student already owns, and their progress.
   progress 0-100; lastLessonIndex marks where "Continue learning" resumes. */
const SEED_ENROLLMENTS = {
  "personal-finance": { progress: 100, lastLessonIndex: 6 },
  "stock-fundamentals": { progress: 45, lastLessonIndex: 3 },
  "mutual-funds": { progress: 12, lastLessonIndex: 0 },
};

/* The single most-recently-accessed course, for the Continue banner. */
const SEED_LAST_ACCESSED = "stock-fundamentals";

const CATEGORIES = ["All", "Foundations", "Markets", "Mindset"];

window.STUDENT_DATA = { COURSES, DEMO_USER, SEED_ENROLLMENTS, SEED_LAST_ACCESSED, CATEGORIES };
