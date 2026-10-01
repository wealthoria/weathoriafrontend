/* global window */
/* =========================================================================
   Wealthoria Member Portal — mock data
   Stands in for backend collections. Two member accounts (Editor + Admin),
   a content library, uploaded assets, the student roster (admin), and courses.
   ========================================================================= */

const MEMBERS = [
  { id: "mem_admin", name: "Anita Desai", email: "admin@wealthoria.in", password: "admin123", role: "Admin", title: "Head of content" },
  { id: "mem_editor", name: "Rohan Mehta", email: "editor@wealthoria.in", password: "editor123", role: "Editor", title: "Course educator" },
];

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const CONTENT = [
  { id: "c1", title: "What is a mutual fund?", type: "video", status: "published", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(2) },
  { id: "c2", title: "SIP starter checklist", type: "pdf", status: "published", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(5) },
  { id: "c3", title: "Risk tolerance quiz", type: "quiz", status: "draft", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(1) },
  { id: "c4", title: "Reading a stock quote", type: "video", status: "published", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(8) },
  { id: "c5", title: "Tax saving guide 2026", type: "pdf", status: "draft", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(0) },
  { id: "c6", title: "Budgeting basics", type: "video", status: "archived", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(34) },
  { id: "c7", title: "Asset allocation explained", type: "video", status: "published", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(12) },
  { id: "c8", title: "Investor psychology workbook", type: "pdf", status: "draft", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(3) },
  { id: "c9", title: "Compound interest quiz", type: "quiz", status: "published", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(18) },
  { id: "c10", title: "Emergency fund explainer", type: "video", status: "archived", authorId: "mem_editor", author: "Rohan Mehta", modified: daysAgo(45) },
  { id: "c11", title: "Index funds vs active", type: "video", status: "published", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(22) },
  { id: "c12", title: "Goal planning template", type: "pdf", status: "draft", authorId: "mem_admin", author: "Anita Desai", modified: daysAgo(6) },
];

const UPLOADS = [
  { id: "u1", name: "mutual-fund-intro.mp4", type: "video", size: "184 MB", category: "Markets", tags: ["mutual funds", "beginner"], uploaded: daysAgo(2), ownerId: "mem_editor" },
  { id: "u2", name: "sip-checklist.pdf", type: "pdf", size: "1.2 MB", category: "Foundations", tags: ["sip", "checklist"], uploaded: daysAgo(5), ownerId: "mem_editor" },
  { id: "u3", name: "risk-quiz-bank.json", type: "quiz", size: "84 KB", category: "Mindset", tags: ["risk", "quiz"], uploaded: daysAgo(1), ownerId: "mem_editor" },
  { id: "u4", name: "stock-quote-walkthrough.mp4", type: "video", size: "211 MB", category: "Markets", tags: ["stocks"], uploaded: daysAgo(8), ownerId: "mem_admin" },
  { id: "u5", name: "tax-guide-2026.pdf", type: "pdf", size: "3.4 MB", category: "Foundations", tags: ["tax", "guide"], uploaded: daysAgo(0), ownerId: "mem_admin" },
  { id: "u6", name: "allocation-slides.pdf", type: "pdf", size: "5.1 MB", category: "Mindset", tags: ["allocation"], uploaded: daysAgo(12), ownerId: "mem_admin" },
  { id: "u7", name: "budgeting-basics.mp4", type: "video", size: "142 MB", category: "Foundations", tags: ["budget", "beginner"], uploaded: daysAgo(34), ownerId: "mem_editor" },
];

const STUDENTS = [
  { id: "s1", name: "Priya Rao", email: "priya@student.in", enrolled: 4, joined: daysAgo(120), status: "active" },
  { id: "s2", name: "Manjunath S.", email: "manjunath@student.in", enrolled: 2, joined: daysAgo(96), status: "active" },
  { id: "s3", name: "Anita Kumar", email: "anita.k@student.in", enrolled: 1, joined: daysAgo(64), status: "active" },
  { id: "s4", name: "Rahul Desai", email: "rahul.d@student.in", enrolled: 3, joined: daysAgo(40), status: "suspended" },
  { id: "s5", name: "Sahana B.", email: "sahana@student.in", enrolled: 5, joined: daysAgo(220), status: "active" },
  { id: "s6", name: "Vikram N.", email: "vikram@student.in", enrolled: 0, joined: daysAgo(12), status: "active" },
  { id: "s7", name: "Deepa R.", email: "deepa@student.in", enrolled: 2, joined: daysAgo(8), status: "active" },
  { id: "s8", name: "Karthik M.", email: "karthik@student.in", enrolled: 1, joined: daysAgo(200), status: "suspended" },
  { id: "s9", name: "Lakshmi P.", email: "lakshmi@student.in", enrolled: 6, joined: daysAgo(310), status: "active" },
  { id: "s10", name: "Arjun V.", email: "arjun@student.in", enrolled: 3, joined: daysAgo(28), status: "active" },
];

const COURSES = [
  {
    id: "course1", title: "Stock market fundamentals", status: "published", price: 1999, category: "Markets",
    sections: [
      { id: "sec1", title: "Getting started", lessons: [{ id: "l1", title: "What is a share?", type: "video" }, { id: "l2", title: "How exchanges work", type: "video" }] },
      { id: "sec2", title: "Reading the market", lessons: [{ id: "l3", title: "Reading a stock quote", type: "video" }, { id: "l4", title: "Indices explained", type: "video" }] },
    ],
  },
  {
    id: "course2", title: "Mutual funds & SIPs", status: "draft", price: 1499, category: "Markets",
    sections: [
      { id: "sec3", title: "Fund basics", lessons: [{ id: "l5", title: "Funds vs stocks", type: "video" }] },
    ],
  },
  {
    id: "course3", title: "Personal finance", status: "published", price: 999, category: "Foundations",
    sections: [
      { id: "sec4", title: "Money foundations", lessons: [{ id: "l6", title: "Money mindset", type: "video" }, { id: "l7", title: "Budgeting that works", type: "video" }] },
    ],
  },
];

const CATEGORIES = ["Foundations", "Markets", "Mindset"];

window.MEMBER_DATA = { MEMBERS, CONTENT, UPLOADS, STUDENTS, COURSES, CATEGORIES };
