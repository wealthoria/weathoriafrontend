/* global React, window */
/* =========================================================================
   CourseStore — purchased courses + progress, cached in context.
   In production this mirrors GET/POST /me/courses; here it persists per-user
   to localStorage so a refresh keeps purchases.
   ========================================================================= */
const { createContext, useContext, useReducer, useEffect, useCallback } = React;
const { SEED_ENROLLMENTS, SEED_LAST_ACCESSED, COURSES, DEMO_USER } = window.STUDENT_DATA;

function keyFor(userId) { return `wl-student-courses:${userId}`; }

function storeReducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return action.payload;
    case "ENROLL": {
      if (state.enrollments[action.id]) return state;
      return {
        ...state,
        enrollments: { ...state.enrollments, [action.id]: { progress: 0, lastLessonIndex: 0 } },
        lastAccessed: action.id,
      };
    }
    case "PROGRESS": {
      const cur = state.enrollments[action.id];
      if (!cur) return state;
      return {
        ...state,
        enrollments: { ...state.enrollments, [action.id]: { ...cur, progress: action.progress, lastLessonIndex: action.lessonIndex ?? cur.lastLessonIndex } },
        lastAccessed: action.id,
      };
    }
    case "RESET":
      return { enrollments: {}, lastAccessed: null };
    default:
      return state;
  }
}

const CourseContext = createContext(null);
function useCourses() { return useContext(CourseContext); }

function CourseProvider({ user, children }) {
  const [state, dispatch] = useReducer(storeReducer, { enrollments: {}, lastAccessed: null });

  /* load this user's purchases (seed the demo user the first time) */
  useEffect(() => {
    if (!user) { dispatch({ type: "RESET" }); return; }
    const key = keyFor(user.id);
    let data = null;
    try { const raw = localStorage.getItem(key); if (raw) data = JSON.parse(raw); } catch (e) { /* ignore */ }
    if (!data) {
      data = user.id === DEMO_USER.id
        ? { enrollments: { ...SEED_ENROLLMENTS }, lastAccessed: SEED_LAST_ACCESSED }
        : { enrollments: {}, lastAccessed: null };
    }
    dispatch({ type: "LOAD", payload: data });
  }, [user]);

  /* persist on change */
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(keyFor(user.id), JSON.stringify(state));
  }, [user, state]);

  const enroll = useCallback((id) => dispatch({ type: "ENROLL", id }), []);
  const setProgress = useCallback((id, progress, lessonIndex) => dispatch({ type: "PROGRESS", id, progress, lessonIndex }), []);

  const isEnrolled = useCallback((id) => !!state.enrollments[id], [state]);
  const getProgress = useCallback((id) => state.enrollments[id]?.progress ?? 0, [state]);

  const purchased = COURSES.filter((c) => state.enrollments[c.id]);
  const browse = COURSES.filter((c) => !state.enrollments[c.id]);
  const lastCourse = state.lastAccessed ? COURSES.find((c) => c.id === state.lastAccessed) : null;

  const value = { enrollments: state.enrollments, enroll, setProgress, isEnrolled, getProgress, purchased, browse, lastCourse, lastAccessed: state.lastAccessed };
  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>;
}

Object.assign(window, { CourseContext, useCourses, CourseProvider });
