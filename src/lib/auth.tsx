import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_SNACKBARS,
  INITIAL_USERS,
  type MenuItem,
  type Role,
  type SnackBar,
  type User,
} from "./mockData";

interface AuthContextValue {
  user: User | null;
  users: User[];
  snackbars: SnackBar[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  becomeOwner: () => void;
  toggleFavorite: (snackbarId: string) => void;
  updateMySnackbar: (patch: Partial<SnackBar>) => void;
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  removeMenuItem: (itemId: string) => void;
  mySnackbar: SnackBar | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "unipetit_state_v1";

interface PersistedState {
  users: User[];
  snackbars: SnackBar[];
  currentUserId: string | null;
}

function loadState(): PersistedState {
  if (typeof window === "undefined") {
    return { users: INITIAL_USERS, snackbars: INITIAL_SNACKBARS, currentUserId: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { users: INITIAL_USERS, snackbars: INITIAL_SNACKBARS, currentUserId: null };
}

function saveState(s: PersistedState) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const user = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const mySnackbar =
    user?.role === "owner"
      ? state.snackbars.find((s) => s.owner_id === user.id) ?? null
      : null;

  const login: AuthContextValue["login"] = (email, password) => {
    const found = state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return { ok: false, error: "E-mail ou senha inválidos" };
    setState((s) => ({ ...s, currentUserId: found.id }));
    return { ok: true };
  };

  const signup: AuthContextValue["signup"] = (name, email, password) => {
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "E-mail já cadastrado" };
    }
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      role: "user",
      favorites: [],
    };
    setState((s) => ({
      ...s,
      users: [...s.users, newUser],
      currentUserId: newUser.id,
    }));
    return { ok: true };
  };

  const logout = () => setState((s) => ({ ...s, currentUserId: null }));

  const becomeOwner = () => {
    if (!user) return;
    setState((s) => {
      const users = s.users.map((u) =>
        u.id === user.id ? { ...u, role: "owner" as Role } : u,
      );
      const hasSnackbar = s.snackbars.some((sb) => sb.owner_id === user.id);
      const snackbars = hasSnackbar
        ? s.snackbars
        : [
            ...s.snackbars,
            {
              id: `s${Date.now()}`,
              owner_id: user.id,
              name: "Minha Lanchonete",
              description: "Adicione uma descrição da sua lanchonete.",
              location: "Endereço a definir",
              rating: 0,
              categories: [],
              cover:
                "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
              menu_items: [],
            },
          ];
      return { ...s, users, snackbars };
    });
  };

  const toggleFavorite = (snackbarId: string) => {
    if (!user) return;
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === user.id
          ? {
              ...u,
              favorites: u.favorites.includes(snackbarId)
                ? u.favorites.filter((f) => f !== snackbarId)
                : [...u.favorites, snackbarId],
            }
          : u,
      ),
    }));
  };

  const updateMySnackbar = (patch: Partial<SnackBar>) => {
    if (!mySnackbar) return;
    setState((s) => ({
      ...s,
      snackbars: s.snackbars.map((sb) =>
        sb.id === mySnackbar.id ? { ...sb, ...patch } : sb,
      ),
    }));
  };

  const addMenuItem = (item: Omit<MenuItem, "id">) => {
    if (!mySnackbar) return;
    setState((s) => ({
      ...s,
      snackbars: s.snackbars.map((sb) =>
        sb.id === mySnackbar.id
          ? { ...sb, menu_items: [...sb.menu_items, { ...item, id: `m${Date.now()}` }] }
          : sb,
      ),
    }));
  };

  const removeMenuItem = (itemId: string) => {
    if (!mySnackbar) return;
    setState((s) => ({
      ...s,
      snackbars: s.snackbars.map((sb) =>
        sb.id === mySnackbar.id
          ? { ...sb, menu_items: sb.menu_items.filter((m) => m.id !== itemId) }
          : sb,
      ),
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users: state.users,
        snackbars: state.snackbars,
        login,
        signup,
        logout,
        becomeOwner,
        toggleFavorite,
        updateMySnackbar,
        addMenuItem,
        removeMenuItem,
        mySnackbar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
