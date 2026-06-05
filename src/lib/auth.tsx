import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "user" | "owner";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface SnackBar {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  location: string;
  rating: number;
  categories: string[];
  cover: string;
  menu_items: MenuItem[];
}

export interface Review {
  id: string;
  snackbar_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

export interface Order {
  id: string;
  snackbar_id: string;
  customer_name: string;
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  favorites: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  snackbars: SnackBar[];
  reviews: Review[];
  orders: Order[];
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  mySnackbar: SnackBar | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  becomeOwner: () => Promise<void>;
  exitOwnerMode: () => Promise<void>;
  toggleFavorite: (snackbarId: string) => Promise<void>;
  updateMySnackbar: (patch: Partial<SnackBar>) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<void>;
  removeMenuItem: (itemId: string) => Promise<void>;
  upsertReview: (
    snackbarId: string,
    rating: number,
    comment: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteReview: (reviewId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [snackbars, setSnackbars] = useState<SnackBar[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSnackbars = useCallback(async () => {
    const { data: sbs } = await supabase
      .from("snackbars")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: items } = await supabase.from("menu_items").select("*");
    const list: SnackBar[] = (sbs ?? []).map((s) => ({
      id: s.id,
      owner_id: s.owner_id,
      name: s.name,
      description: s.description,
      location: s.location,
      rating: Number(s.rating ?? 0),
      categories: s.categories ?? [],
      cover: s.cover ?? FALLBACK_COVER,
      menu_items: (items ?? [])
        .filter((m) => m.snackbar_id === s.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          price: Number(m.price),
        })),
    }));
    setSnackbars(list);
  }, []);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, snackbar_id, user_id, rating, comment, created_at, profiles(name)")
      .order("created_at", { ascending: false });
    const list: Review[] = (data ?? []).map((r: any) => ({
      id: r.id,
      snackbar_id: r.snackbar_id,
      user_id: r.user_id,
      user_name: r.profiles?.name?.trim() || "Usuário",
      rating: Number(r.rating),
      comment: r.comment ?? "",
      created_at: r.created_at,
    }));
    setReviews(list);
  }, []);

  const loadUser = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setUser(null);
      return;
    }
    const uid = currentSession.user.id;
    const [{ data: profile }, { data: roles }, { data: favs }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("favorites").select("snackbar_id").eq("user_id", uid),
    ]);
    const isOwner = (roles ?? []).some((r) => r.role === "owner");
    setUser({
      id: uid,
      email: currentSession.user.email ?? "",
      name: profile?.name?.trim() || currentSession.user.email?.split("@")[0] || "Usuário",
      role: isOwner ? "owner" : "user",
      favorites: (favs ?? []).map((f) => f.snackbar_id),
    });
  }, []);

  // Initial bootstrap + auth state subscription
  useEffect(() => {
    // Subscribe first to avoid race
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Defer DB calls to avoid deadlock inside the callback
      setTimeout(() => {
        loadUser(newSession);
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      Promise.all([loadUser(data.session), loadSnackbars(), loadReviews()]).finally(() =>
        setLoading(false),
      );
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUser, loadSnackbars, loadReviews]);

  const mySnackbar =
    user && user.role === "owner"
      ? snackbars.find((s) => s.owner_id === user.id) ?? null
      : null;

  const refresh = useCallback(async () => {
    await Promise.all([loadUser(session), loadSnackbars(), loadReviews()]);
  }, [loadSnackbars, loadUser, loadReviews, session]);

  /* ----- auth methods ----- */

  const login: AuthContextValue["login"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const signup: AuthContextValue["signup"] = async (name, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const requestPasswordReset: AuthContextValue["requestPasswordReset"] = async (
    email,
  ) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  const updatePassword: AuthContextValue["updatePassword"] = async (newPassword) => {
    if (newPassword.length < 6)
      return { ok: false, error: "A senha deve ter ao menos 6 caracteres" };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    return { ok: true };
  };

  /* ----- owner / favorites / menu ----- */

  const becomeOwner = async () => {
    if (!user) return;
    await supabase
      .from("user_roles")
      .upsert({ user_id: user.id, role: "owner" }, { onConflict: "user_id,role" });
    // Ensure a snackbar exists for this owner
    const { data: existing } = await supabase
      .from("snackbars")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!existing) {
      await supabase.from("snackbars").insert({
        owner_id: user.id,
        name: "Minha Lanchonete",
        description: "Adicione uma descrição da sua lanchonete.",
        location: "Endereço a definir",
        cover: FALLBACK_COVER,
      });
    }
    await refresh();
  };

  const exitOwnerMode = async () => {
    if (!user) return;
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", user.id)
      .eq("role", "owner");
    await refresh();
  };

  const toggleFavorite = async (snackbarId: string) => {
    if (!user) return;
    const isFav = user.favorites.includes(snackbarId);
    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("snackbar_id", snackbarId);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, snackbar_id: snackbarId });
    }
    await loadUser(session);
  };

  const updateMySnackbar = async (patch: Partial<SnackBar>) => {
    if (!mySnackbar) return;
    const { menu_items: _omit, ...rest } = patch;
    void _omit;
    await supabase.from("snackbars").update(rest).eq("id", mySnackbar.id);
    await loadSnackbars();
  };

  const addMenuItem = async (item: Omit<MenuItem, "id">) => {
    if (!mySnackbar) return;
    await supabase.from("menu_items").insert({
      snackbar_id: mySnackbar.id,
      name: item.name,
      description: item.description,
      price: item.price,
    });
    await loadSnackbars();
  };

  const removeMenuItem = async (itemId: string) => {
    await supabase.from("menu_items").delete().eq("id", itemId);
    await loadSnackbars();
  };

  /* ----- reviews ----- */

  const upsertReview: AuthContextValue["upsertReview"] = async (
    snackbarId,
    rating,
    comment,
  ) => {
    if (!user) return { ok: false, error: "Você precisa estar logado" };
    if (rating < 1 || rating > 5) return { ok: false, error: "Nota inválida" };
    const trimmed = comment.trim().slice(0, 500);
    const { error } = await supabase
      .from("reviews")
      .upsert(
        {
          snackbar_id: snackbarId,
          user_id: user.id,
          rating,
          comment: trimmed,
        },
        { onConflict: "snackbar_id,user_id" },
      );
    if (error) return { ok: false, error: error.message };
    await Promise.all([loadReviews(), loadSnackbars()]);
    return { ok: true };
  };

  const deleteReview: AuthContextValue["deleteReview"] = async (reviewId) => {
    await supabase.from("reviews").delete().eq("id", reviewId);
    await Promise.all([loadReviews(), loadSnackbars()]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        snackbars,
        reviews,
        mySnackbar,
        login,
        signup,
        logout,
        requestPasswordReset,
        updatePassword,
        becomeOwner,
        exitOwnerMode,
        toggleFavorite,
        updateMySnackbar,
        addMenuItem,
        removeMenuItem,
        upsertReview,
        deleteReview,
        refresh,
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

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha inválidos";
  if (m.includes("user already registered")) return "E-mail já cadastrado";
  if (m.includes("password should be at least"))
    return "A senha deve ter ao menos 6 caracteres";
  if (m.includes("email not confirmed"))
    return "Confirme seu e-mail antes de entrar";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return msg;
}
