/* global React, window */
/* =========================================================================
   MemberDataContext — content / uploads / courses / students with mutators.
   Persists to localStorage so edits survive refresh. Mirrors a backend REST
   layer (list/create/update/delete + bulk).
   ========================================================================= */
const { createContext, useContext, useReducer, useEffect, useCallback } = React;
const MD = window.MEMBER_DATA;
const STORE_KEY = "wl-member-store";

function memberStoreLoad() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ }
  return { content: MD.CONTENT, uploads: MD.UPLOADS, students: MD.STUDENTS, courses: MD.COURSES };
}

function memberStoreReducer(state, a) {
  switch (a.type) {
    case "SET_CONTENT": return { ...state, content: a.value };
    case "SET_UPLOADS": return { ...state, uploads: a.value };
    case "SET_STUDENTS": return { ...state, students: a.value };
    case "SET_COURSES": return { ...state, courses: a.value };
    case "RESET": return memberStoreLoad();
    default: return state;
  }
}

const MemberDataContext = createContext(null);
function useMemberData() { return useContext(MemberDataContext); }

function MemberDataProvider({ children }) {
  const [state, dispatch] = useReducer(memberStoreReducer, null, memberStoreLoad);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }, [state]);

  /* ---- content ---- */
  const setContentStatus = useCallback((ids, status) => {
    dispatch({ type: "SET_CONTENT", value: state.content.map((c) => ids.includes(c.id) ? { ...c, status, modified: new Date().toISOString().slice(0, 10) } : c) });
  }, [state.content]);
  const deleteContent = useCallback((ids) => {
    dispatch({ type: "SET_CONTENT", value: state.content.filter((c) => !ids.includes(c.id)) });
  }, [state.content]);
  const updateContent = useCallback((id, patch) => {
    dispatch({ type: "SET_CONTENT", value: state.content.map((c) => c.id === id ? { ...c, ...patch, modified: new Date().toISOString().slice(0, 10) } : c) });
  }, [state.content]);
  const addContent = useCallback((item) => {
    dispatch({ type: "SET_CONTENT", value: [item, ...state.content] });
  }, [state.content]);

  /* ---- uploads ---- */
  const addUpload = useCallback((asset) => {
    dispatch({ type: "SET_UPLOADS", value: [asset, ...state.uploads] });
  }, [state.uploads]);
  const deleteUpload = useCallback((id) => {
    dispatch({ type: "SET_UPLOADS", value: state.uploads.filter((u) => u.id !== id) });
  }, [state.uploads]);

  /* ---- students (admin) ---- */
  const setStudentStatus = useCallback((id, status) => {
    dispatch({ type: "SET_STUDENTS", value: state.students.map((s) => s.id === id ? { ...s, status } : s) });
  }, [state.students]);
  const deleteStudent = useCallback((id) => {
    dispatch({ type: "SET_STUDENTS", value: state.students.filter((s) => s.id !== id) });
  }, [state.students]);

  /* ---- courses ---- */
  const saveCourse = useCallback((course) => {
    const exists = state.courses.some((c) => c.id === course.id);
    dispatch({ type: "SET_COURSES", value: exists ? state.courses.map((c) => c.id === course.id ? course : c) : [course, ...state.courses] });
  }, [state.courses]);
  const deleteCourse = useCallback((id) => {
    dispatch({ type: "SET_COURSES", value: state.courses.filter((c) => c.id !== id) });
  }, [state.courses]);

  const resetAll = useCallback(() => { localStorage.removeItem(STORE_KEY); dispatch({ type: "RESET" }); }, []);
  const value = {
    ...state,
    setContentStatus, deleteContent, updateContent, addContent,
    addUpload, deleteUpload,
    setStudentStatus, deleteStudent,
    saveCourse, deleteCourse, resetAll,
  };
  return <MemberDataContext.Provider value={value}>{children}</MemberDataContext.Provider>;
}

Object.assign(window, { MemberDataContext, useMemberData, MemberDataProvider });
