/* global React, window */
/* =========================================================================
   MemberAuthContext — independent of the student AuthContext.
   Separate storage key (wl-member-auth) so member + student sessions never
   collide. Supports an optional MFA step (email/TOTP OTP). Role lives in the
   token payload; useRole() exposes it for UI gating.
   ========================================================================= */
const { createContext, useContext, useReducer, useEffect, useCallback } = React;
const { MEMBERS } = window.MEMBER_DATA;

const M_KEY = "wl-member-auth";
const DEMO_OTP = "123456"; // shown to the user in the prototype

const memberAuthInitial = { user: null, token: null, role: null, isAuthenticated: false, loading: true };

function memberAuthReducer(state, a) {
  switch (a.type) {
    case "RESTORE":
      return a.payload
        ? { user: a.payload.user, token: a.payload.token, role: a.payload.user.role, isAuthenticated: true, loading: false }
        : { ...memberAuthInitial, loading: false };
    case "LOGIN_SUCCESS":
      return { user: a.payload.user, token: a.payload.token, role: a.payload.user.role, isAuthenticated: true, loading: false };
    case "LOGOUT":
      return { ...memberAuthInitial, loading: false };
    default:
      return state;
  }
}

function memberMakeToken(user) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: user.id, name: user.name, email: user.email, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 8 }));
  return `${header}.${payload}.${btoa(user.id + Date.now()).slice(0, 22)}`;
}
function memberDecode(token) { try { return JSON.parse(atob(token.split(".")[1])); } catch (e) { return null; } }

const MemberAuthContext = createContext(null);
function useMemberAuth() { return useContext(MemberAuthContext); }
function useRole() {
  const { role } = useMemberAuth();
  return {
    role,
    isAdmin: role === "Admin",
    isEditor: role === "Editor",
    can: (action) => {
      // simple capability map
      const caps = {
        Admin: ["content:all", "content:own", "users:manage", "courses:all", "uploads:all"],
        Editor: ["content:own", "courses:own", "uploads:own"],
      };
      return (caps[role] || []).includes(action);
    },
  };
}

function MemberAuthProvider({ children }) {
  const [state, dispatch] = useReducer(memberAuthReducer, memberAuthInitial);

  useEffect(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(M_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        const dec = p.token && memberDecode(p.token);
        if (dec && dec.exp > Date.now()) saved = p; else localStorage.removeItem(M_KEY);
      }
    } catch (e) { /* ignore */ }
    const t = setTimeout(() => dispatch({ type: "RESTORE", payload: saved }), 300);
    return () => clearTimeout(t);
  }, []);

  /* step 1: verify credentials. Returns { mfaRequired, user } without logging
     in if MFA is on; caller then calls verifyMfa(). */
  const verifyCredentials = useCallback((email, password, mfaEnabled) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const e = (email || "").trim().toLowerCase();
        const m = MEMBERS.find((x) => x.email === e && x.password === password);
        if (!m) { reject(new Error("Invalid email or password.")); return; }
        if (mfaEnabled) { resolve({ mfaRequired: true, pending: m }); return; }
        finishLogin(m);
        resolve({ mfaRequired: false, user: m });
      }, 600);
    });
  }, []);

  const verifyMfa = useCallback((pending, code) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if ((code || "").replace(/\s/g, "") !== DEMO_OTP) { reject(new Error("Incorrect code. Use " + DEMO_OTP + " for this demo.")); return; }
        finishLogin(pending);
        resolve(pending);
      }, 500);
    });
  }, []);

  function finishLogin(m) {
    const user = { id: m.id, name: m.name, email: m.email, role: m.role, title: m.title };
    const token = memberMakeToken(user);
    localStorage.setItem(M_KEY, JSON.stringify({ user, token }));
    dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
  }

  const logout = useCallback(() => { localStorage.removeItem(M_KEY); dispatch({ type: "LOGOUT" }); }, []);

  const value = { ...state, verifyCredentials, verifyMfa, logout, DEMO_OTP, decodeToken: memberDecode };
  return <MemberAuthContext.Provider value={value}>{children}</MemberAuthContext.Provider>;
}

Object.assign(window, { MemberAuthContext, useMemberAuth, useRole, MemberAuthProvider });
