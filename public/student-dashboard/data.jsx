/* global window */
/* =========================================================================
   Student Dashboard — mock data shapes
   These mirror the JSON a real API would return, so screens map 1:1 later.

   User:    { id, name, role, initials, joinedYear }
   Course:  { id, title, category, instructor:{name,initials}, rating, ratingCount,
              students, price, isEnrolled, progress, lastChapter, durationHrs,
              lessonsCount, updated, thumb (css background), bookmarked,
              status: "in-progress"|"completed"|"not-started",
              curriculum: [ { id, title, lessons:[{id,title,duration,done}] } ] }
   Stat:    { id, icon, label, value, trend }
   ========================================================================= */

const USER = { id: "stu_1", name: "Priya Rao", role: "Student", initials: "P", joinedYear: 2026 };

/* warm, on-brand thumbnail fields (flat brand tints, no stock photos) */
const TINTS = {
  Markets: "linear-gradient(135deg,#ffe6d0,#f6c19a)",
  Foundations: "linear-gradient(135deg,#fde0d6,#f4b6a4)",
  Mindset: "linear-gradient(135deg,#fbe2dd,#eeb9c2)",
  Planning: "linear-gradient(135deg,#fce9d2,#f0c98f)",
};

function curr(secs) { return secs; }

const COURSES = [
  {
    id: "stock-fundamentals", title: "Stock market fundamentals", category: "Markets",
    instructor: { name: "Sandeep Kalburgi", initials: "S" }, rating: 4.8, ratingCount: 312,
    students: 1840, price: 1999, isEnrolled: true, progress: 45, lastChapter: "Indices explained",
    durationHrs: 6, lessonsCount: 8, updated: "May 2026", bookmarked: true, status: "in-progress",
    thumb: TINTS.Markets,
    curriculum: [
      { id: "s1", title: "Getting started", lessons: [
        { id: "l1", title: "What is a share?", duration: "08:12", done: true },
        { id: "l2", title: "How exchanges work", duration: "11:40", done: true },
        { id: "l3", title: "Reading a stock quote", duration: "09:05", done: true },
      ]},
      { id: "s2", title: "The market in motion", lessons: [
        { id: "l4", title: "Indices explained", duration: "10:22", done: false },
        { id: "l5", title: "Orders and brokers", duration: "12:18", done: false },
      ]},
      { id: "s3", title: "Your first analysis", lessons: [
        { id: "l6", title: "Risk basics", duration: "07:44", done: false },
        { id: "l7", title: "Building a watchlist", duration: "09:50", done: false },
        { id: "l8", title: "Your first analysis", duration: "14:02", done: false },
      ]},
    ],
  },
  {
    id: "mutual-funds", title: "Mutual funds & SIPs", category: "Markets",
    instructor: { name: "Manjunath K.", initials: "M" }, rating: 4.7, ratingCount: 268,
    students: 1520, price: 1499, isEnrolled: true, progress: 12, lastChapter: "Funds vs stocks",
    durationHrs: 4, lessonsCount: 6, updated: "Apr 2026", bookmarked: false, status: "in-progress",
    thumb: TINTS.Markets,
    curriculum: [
      { id: "s1", title: "Fund basics", lessons: [
        { id: "l1", title: "Funds vs stocks", duration: "06:30", done: true },
        { id: "l2", title: "Types of mutual funds", duration: "09:15", done: false },
        { id: "l3", title: "What is an SIP?", duration: "08:40", done: false },
      ]},
      { id: "s2", title: "Starting out", lessons: [
        { id: "l4", title: "Reading a factsheet", duration: "10:05", done: false },
        { id: "l5", title: "Direct vs regular plans", duration: "07:20", done: false },
        { id: "l6", title: "Starting your SIP", duration: "11:10", done: false },
      ]},
    ],
  },
  {
    id: "personal-finance", title: "Personal finance", category: "Foundations",
    instructor: { name: "Sandeep Kalburgi", initials: "S" }, rating: 4.9, ratingCount: 410,
    students: 2240, price: 999, isEnrolled: true, progress: 100, lastChapter: "Your money system",
    durationHrs: 5, lessonsCount: 7, updated: "Mar 2026", bookmarked: true, status: "completed",
    thumb: TINTS.Foundations,
    curriculum: [
      { id: "s1", title: "Money foundations", lessons: [
        { id: "l1", title: "Money mindset", duration: "07:00", done: true },
        { id: "l2", title: "Budgeting that works", duration: "10:30", done: true },
        { id: "l3", title: "Saving habits", duration: "08:15", done: true },
      ]},
      { id: "s2", title: "Building your system", lessons: [
        { id: "l4", title: "Good vs bad debt", duration: "09:40", done: true },
        { id: "l5", title: "Emergency fund", duration: "06:50", done: true },
        { id: "l6", title: "Insurance basics", duration: "11:25", done: true },
        { id: "l7", title: "Your money system", duration: "08:05", done: true },
      ]},
    ],
  },
  {
    id: "financial-planning", title: "Financial planning", category: "Planning",
    instructor: { name: "Manjunath K.", initials: "M" }, rating: 4.6, ratingCount: 187,
    students: 980, price: 1799, isEnrolled: false, progress: 0, lastChapter: null,
    durationHrs: 4, lessonsCount: 5, updated: "May 2026", bookmarked: false, status: "not-started",
    thumb: TINTS.Planning,
    curriculum: [
      { id: "s1", title: "Plan your future", lessons: [
        { id: "l1", title: "Goal setting", duration: "07:30", done: false },
        { id: "l2", title: "Life-stage planning", duration: "09:00", done: false },
        { id: "l3", title: "Tax basics", duration: "10:20", done: false },
      ]},
    ],
  },
  {
    id: "investor-psychology", title: "Investor psychology", category: "Mindset",
    instructor: { name: "Sandeep Kalburgi", initials: "S" }, rating: 4.8, ratingCount: 134,
    students: 760, price: 1299, isEnrolled: false, progress: 0, lastChapter: null,
    durationHrs: 3, lessonsCount: 4, updated: "Feb 2026", bookmarked: true, status: "not-started",
    thumb: TINTS.Mindset,
    curriculum: [
      { id: "s1", title: "Mastering emotion", lessons: [
        { id: "l1", title: "Fear and greed", duration: "08:00", done: false },
        { id: "l2", title: "Behavioural biases", duration: "09:30", done: false },
      ]},
    ],
  },
  {
    id: "asset-allocation", title: "Asset allocation", category: "Mindset",
    instructor: { name: "Manjunath K.", initials: "M" }, rating: 4.7, ratingCount: 98,
    students: 540, price: 2299, isEnrolled: false, progress: 0, lastChapter: null,
    durationHrs: 4, lessonsCount: 5, updated: "Jan 2026", bookmarked: false, status: "not-started",
    thumb: TINTS.Mindset,
    curriculum: [
      { id: "s1", title: "Balance your risk", lessons: [
        { id: "l1", title: "Why allocation matters", duration: "07:10", done: false },
        { id: "l2", title: "Equity vs debt", duration: "10:00", done: false },
      ]},
    ],
  },
];

const STATS = [
  { id: "enrolled", icon: "book", label: "Courses enrolled", value: "3", trend: "+1 this month" },
  { id: "hours", icon: "clock", label: "Hours learned this week", value: "6.5", trend: "+2.1 hrs" },
  { id: "certs", icon: "award", label: "Certificates earned", value: "1", trend: null },
];

const REVIEWS = [
  { id: "r1", name: "Manjunath S.", initials: "M", rating: 5, text: "Finally understood how the market works without the jargon. Calm, clear teaching." },
  { id: "r2", name: "Deepa R.", initials: "D", rating: 5, text: "The Kannada explanations made all the difference. I invest on my own now." },
  { id: "r3", name: "Vikram N.", initials: "V", rating: 4, text: "Great structure. Would love a few more worked examples in the later sections." },
];

window.SD_DATA = { USER, COURSES, STATS, REVIEWS, TINTS };
