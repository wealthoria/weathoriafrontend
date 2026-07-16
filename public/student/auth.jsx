/* global React, window */
/* =========================================================================
   AuthContext — useReducer auth state for the student portal.
   Shape: { user, token, isAuthenticated, loading }
   Methods: login(email, password, remember), logout(), refreshToken()
   Persistence: localStorage (prototype). In production swap the token store
   for httpOnly cookies + a real /auth/login, /auth/refresh, /auth/me API.
   ========================================================================= */
const { createContext, useContext, useReducer, useEffect, useCallback, useRef } = React;
const { DEMO_USER } = window.STUDENT_DATA;

const STORAGE_KEY = "wl-student-auth";

const initialState = { user: null, token: null, isAuthenticated: false, loading: true };

function authReducer(state, action) {
  switch (action.type) {
    case "RESTORE":
      return action.payload
        ? { user: action.payload.user, token: action.payload.token, isAuthenticated: true, loading: false }
        : { ...initialState, loading: false };
    case "LOGIN_START":
      return { ...state, loading: false  };
    case "LOGIN_SUCCESS":
      return { user: action.payload.user, token: action.payload.token, isAuthenticated: true, loading: false };
    case "LOGIN_ERROR":
      return { ...state, loading: false };
    case "REFRESH":
      return { ...state, token: action.payload.token };
    case "LOGOUT":
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

/* fake a signed token so the prototype "feels" real (header.payload.signature) */
function makeToken(user, remember) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const ttl = remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 8; // 30d vs 8h

const payload = btoa(JSON.stringify({
  sub: user.id,
  name: user.full_name || user.name,
  email: user.email,
  exp: Date.now() + ttl
}));

  const sig = btoa(`${user.id}.${Date.now()}`).slice(0, 24);
  return `${header}.${payload}.${sig}`;
}

function tokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp && payload.exp > Date.now();
  } catch (e) { return false; }
}

const AuthContext = createContext(null);
function useAuth() { return useContext(AuthContext); }

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshTimer = useRef(null);

  /* restore session on mount (across refreshes) */
  useEffect(() => {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.token && tokenValid(parsed.token)) saved = parsed;
        else { localStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(STORAGE_KEY); }
      }
    } catch (e) { /* ignore */ }
    // brief delay so the loading splash reads as a real session check
    const t = setTimeout(() => dispatch({ type: "RESTORE", payload: saved }), 350);
    return () => clearTimeout(t);
  }, []);

  const persist = useCallback((data, remember) => {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    other.removeItem(STORAGE_KEY);
  }, []);

  /* login: validates against the seeded demo user (any-other-email also works
     in the prototype so reviewers can explore, but the demo creds are shown). */
 const login = async (email, password, remember) => {
  dispatch({ type: "LOGIN_START" });

  try {
    const response = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    console.log("LOGIN RESPONSE:", response.status, data);

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    const user = data.user;

    const token = makeToken(user, remember);

    const authData = {
      user: user,
      token: token
    };

    persist(authData, remember);

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: authData
    });

    return user;

  } catch (error) {
    dispatch({
      type: "LOGIN_ERROR"
    });

    throw error;
  }
};

  const loginWithGoogle = useCallback((remember) => {
    dispatch({ type: "LOGIN_START" });
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = { id: DEMO_USER.id, name: DEMO_USER.name, email: DEMO_USER.email, city: DEMO_USER.city, joined: DEMO_USER.joined };
        const token = makeToken(user, remember);
        const data = { user, token };
        persist(data, remember);
        dispatch({ type: "LOGIN_SUCCESS", payload: data });
        resolve(user);
      }, 800);
    });
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "LOGOUT" });
  }, []);

  /* refreshToken: re-mint and re-persist before expiry (prototype stand-in for
     POST /auth/refresh with the httpOnly refresh cookie). */
  const refreshToken = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return Promise.reject(new Error("No session"));
    const parsed = JSON.parse(raw);
    const remember = !!localStorage.getItem(STORAGE_KEY);
    const token = makeToken(parsed.user, remember);
    const data = { user: parsed.user, token };
    persist(data, remember);
    dispatch({ type: "REFRESH", payload: { token } });
    return Promise.resolve(token);
  }, [persist]);

  /* auto-refresh on an interval while authenticated */
  useEffect(() => {
    if (!state.isAuthenticated) return;
    refreshTimer.current = setInterval(() => { refreshToken().catch(() => {}); }, 1000 * 60 * 7);
    return () => clearInterval(refreshTimer.current);
  }, [state.isAuthenticated, refreshToken]);

  const value = { ...state, login, loginWithGoogle, logout, refreshToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function niceName(email) {
  const local = email.split("@")[0].replace(/[._]+/g, " ");
  return local.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Student";
}

Object.assign(window, { AuthContext, useAuth, AuthProvider });
