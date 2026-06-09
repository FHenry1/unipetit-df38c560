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

export type Role = "user" | "owner" | "admin";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  position: number;
  category?: string | null;
  image_url?: string | null;
}

export interface SnackBarCategory {
  id: string;
  snackbar_id: string;
  name: string;
  position: number;
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
  lat: number | null;
  lng: number | null;
  menu_items: MenuItem[];
  view_count: number;
  opening_time: string | null;
  closing_time: string | null;
  accent_color: string;
  logo_url: string | null;
  banner_url: string | null;
  snackbar_categories: SnackBarCategory[];
}

export interface Review {
  id: string;
  snackbar_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
  owner_seen: boolean;
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
  phone: string;
  address: string;
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
  addMenuItem: (item: Pick<MenuItem, "name" | "description" | "price"> & { category?: string | null; image_url?: string | null }) => Promise<void>;
  removeMenuItem: (itemId: string) => Promise<void>;
  updateMenuItem: (itemId: string, patch: Partial<Omit<MenuItem, "id">>) => Promise<void>;
  toggleMenuItemActive: (itemId: string) => Promise<void>;
  reorderMenuItems: (orderedIds: string[]) => Promise<void>;
  duplicateMenuItem: (itemId: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, newName: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  upsertReview: (
    snackbarId: string,
    rating: number,
    comment: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteReview: (reviewId: string) => Promise<void>;
  replyToReview: (reviewId: string, reply: string) => Promise<void>;
  markOwnerReviewsSeen: () => Promise<void>;
  updateProfile: (patch: { name?: string; phone?: string; address?: string }) => Promise<{ ok: boolean; error?: string }>;
  getOrderItems: (orderId: string) => Promise<{ name: string; price: number; quantity: number }[]>;
  refresh: () => Promise<void>;
  adminDeleteSnackbar: (snackbarId: string) => Promise<void>;
  adminCreateSnackbar: (data: {
    name: string;
    description: string;
    location: string;
    owner_id: string;
    categories: string[];
    opening_time?: string | null;
    closing_time?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;

}

const AuthContext = createContext<AuthContextValue | null>(null);

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [snackbars, setSnackbars] = useState<SnackBar[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSnackbars = useCallback(async () => {
    const { data: sbs } = await supabase
      .from("snackbars")
      .select("*, snackbar_categories(id, snackbar_id, name, position)")
      .order("created_at", { ascending: false });
    const { data: items } = await supabase.from("menu_items").select("*");
    const list: SnackBar[] = (sbs ?? []).map((s: any) => ({
      id: s.id,
      owner_id: s.owner_id,
      name: s.name,
      description: s.description,
      location: s.location,
      rating: Number(s.rating ?? 0),
      categories: s.categories ?? [],
      cover: s.cover ?? FALLBACK_COVER,
      lat: s.lat != null ? Number(s.lat) : null,
      lng: s.lng != null ? Number(s.lng) : null,
      menu_items: (items ?? [])
        .filter((m) => m.snackbar_id === s.id)
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          price: Number(m.price),
          is_active: m.is_active ?? true,
          position: m.position ?? 0,
          category: m.category ?? null,
          image_url: m.image_url ?? null,
        }))
        .sort((a, b) => a.position - b.position),
      view_count: s.view_count ?? 0,
      opening_time: s.opening_time ?? null,
      closing_time: s.closing_time ?? null,
      accent_color: s.accent_color ?? "#e85d75",
      logo_url: s.logo_url ?? null,
      banner_url: s.banner_url ?? null,
      snackbar_categories: (s.snackbar_categories ?? []) as SnackBarCategory[],
    }));
    setSnackbars(list);
  }, []);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase.rpc("get_visible_reviews");
    const rows = (data ?? []) as any[];
    const userIds = Array.from(
      new Set(rows.map((r) => r.user_id).filter((id): id is string => !!id)),
    );
    const nameMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: userIds });
      (profs ?? []).forEach((p: any) => nameMap.set(p.id, (p.name ?? "").trim()));
    }

    const list: Review[] = rows.map((r: any) => ({
      id: r.id,
      snackbar_id: r.snackbar_id,
      user_id: r.user_id,
      user_name: nameMap.get(r.user_id) || "Usuário",
      rating: Number(r.rating),
      comment: r.comment ?? "",
      created_at: r.created_at,
      owner_reply: r.owner_reply ?? null,
      owner_reply_at: r.owner_reply_at ?? null,
      owner_seen: !!r.owner_seen,
    }));
    setReviews(list);
  }, []);


  const loadOrders = useCallback(async (uid: string | null) => {
    if (!uid) {
      setOrders([]);
      return;
    }
    const { data } = await supabase
      .from("orders")
      .select("id, snackbar_id, customer_name, total, status, notes, created_at")
      .order("created_at", { ascending: false });
    setOrders(
      (data ?? []).map((o: any) => ({
        id: o.id,
        snackbar_id: o.snackbar_id,
        customer_name: o.customer_name,
        total: Number(o.total),
        status: o.status as OrderStatus,
        notes: o.notes,
        created_at: o.created_at,
      })),
    );
  }, []);

  const loadUser = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setUser(null);
      return;
    }
    const uid = currentSession.user.id;
    const [{ data: profile }, { data: roles }, { data: favs }] = await Promise.all([
      supabase.from("profiles").select("name, phone, address").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("favorites").select("snackbar_id").eq("user_id", uid),
    ]);
    const roleList = (roles ?? []).map((r) => r.role);
    const role: Role = roleList.includes("admin" as any)
      ? "admin"
      : roleList.includes("owner" as any)
        ? "owner"
        : "user";
    setUser({
      id: uid,
      email: currentSession.user.email ?? "",
      name: profile?.name?.trim() || currentSession.user.email?.split("@")[0] || "Usuário",
      phone: (profile as any)?.phone ?? "",
      address: (profile as any)?.address ?? "",
      role,
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
      Promise.all([
        loadUser(data.session),
        loadSnackbars(),
        loadReviews(),
        loadOrders(data.session?.user.id ?? null),
      ]).finally(() => setLoading(false));
    });

    return () => sub.subscription.unsubscribe();
  }, [loadUser, loadSnackbars, loadReviews, loadOrders]);

  const mySnackbar =
    user && user.role === "owner"
      ? snackbars.find((s) => s.owner_id === user.id) ?? null
      : null;

  const refresh = useCallback(async () => {
    await Promise.all([
      loadUser(session),
      loadSnackbars(),
      loadReviews(),
      loadOrders(session?.user.id ?? null),
    ]);
  }, [loadSnackbars, loadUser, loadReviews, loadOrders, session]);

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
    const { error } = await supabase.rpc("become_owner");
    if (error) throw error;
    await refresh();
  };

  const exitOwnerMode = async () => {
    if (!user) return;
    const { error } = await supabase.rpc("exit_owner_mode");
    if (error) throw error;
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
    const { menu_items: _omit, snackbar_categories: _omit2, ...rest } = patch;
    void _omit;
    void _omit2;
    await supabase.from("snackbars").update(rest as any).eq("id", mySnackbar.id);
    await loadSnackbars();
  };

  const addMenuItem: AuthContextValue["addMenuItem"] = async (item) => {
    if (!mySnackbar) return;
    const nextPosition =
      mySnackbar.menu_items.reduce((max, m) => Math.max(max, m.position), -1) + 1;
    await supabase.from("menu_items").insert({
      snackbar_id: mySnackbar.id,
      name: item.name,
      description: item.description,
      price: item.price,
      is_active: true,
      position: nextPosition,
      category: item.category ?? null,
      image_url: item.image_url ?? null,
    } as any);
    await loadSnackbars();
  };

  const removeMenuItem = async (itemId: string) => {
    await supabase.from("menu_items").delete().eq("id", itemId);
    await loadSnackbars();
  };

  const updateMenuItem: AuthContextValue["updateMenuItem"] = async (itemId, patch) => {
    await supabase.from("menu_items").update(patch as any).eq("id", itemId);
    await loadSnackbars();
  };

  const duplicateMenuItem: AuthContextValue["duplicateMenuItem"] = async (itemId) => {
    if (!mySnackbar) return;
    const original = mySnackbar.menu_items.find((m) => m.id === itemId);
    if (!original) return;
    const nextPos =
      mySnackbar.menu_items.reduce((max, m) => Math.max(max, m.position), -1) + 1;
    await supabase.from("menu_items").insert({
      snackbar_id: mySnackbar.id,
      name: `${original.name} (cópia)`,
      description: original.description,
      price: original.price,
      is_active: false,
      position: nextPos,
      category: original.category ?? null,
      image_url: original.image_url ?? null,
    } as any);
    await loadSnackbars();
  };

  const addCategory: AuthContextValue["addCategory"] = async (name) => {
    if (!mySnackbar) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextPos = mySnackbar.snackbar_categories.length;
    await supabase.from("snackbar_categories").insert({
      snackbar_id: mySnackbar.id,
      name: trimmed,
      position: nextPos,
    } as any);
    await loadSnackbars();
  };

  const renameCategory: AuthContextValue["renameCategory"] = async (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const cat = mySnackbar?.snackbar_categories.find((c) => c.id === id);
    await supabase.from("snackbar_categories").update({ name: trimmed } as any).eq("id", id);
    if (cat && mySnackbar) {
      await supabase.from("menu_items").update({ category: trimmed } as any)
        .eq("snackbar_id", mySnackbar.id).eq("category", cat.name);
    }
    await loadSnackbars();
  };

  const deleteCategory: AuthContextValue["deleteCategory"] = async (id) => {
    if (!mySnackbar) return;
    const cat = mySnackbar.snackbar_categories.find((c) => c.id === id);
    if (cat) {
      await supabase.from("menu_items").update({ category: null } as any)
        .eq("snackbar_id", mySnackbar.id).eq("category", cat.name);
    }
    await supabase.from("snackbar_categories").delete().eq("id", id);
    await loadSnackbars();
  };

  const toggleMenuItemActive: AuthContextValue["toggleMenuItemActive"] = async (itemId) => {
    if (!mySnackbar) return;
    const current = mySnackbar.menu_items.find((m) => m.id === itemId);
    if (!current) return;
    await supabase
      .from("menu_items")
      .update({ is_active: !current.is_active })
      .eq("id", itemId);
    await loadSnackbars();
  };

  const reorderMenuItems: AuthContextValue["reorderMenuItems"] = async (orderedIds) => {
    if (!mySnackbar) return;
    await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from("menu_items").update({ position: index }).eq("id", id),
      ),
    );
    await loadSnackbars();
  };


  const replyToReview: AuthContextValue["replyToReview"] = async (reviewId, reply) => {
    const trimmed = reply.trim().slice(0, 500);
    await supabase
      .from("reviews")
      .update({
        owner_reply: trimmed.length ? trimmed : null,
        owner_reply_at: trimmed.length ? new Date().toISOString() : null,
      })
      .eq("id", reviewId);
    await loadReviews();
  };

  const markOwnerReviewsSeen: AuthContextValue["markOwnerReviewsSeen"] = async () => {
    if (!mySnackbar) return;
    const unseen = reviews.filter(
      (r) => r.snackbar_id === mySnackbar.id && !r.owner_seen,
    );
    if (unseen.length === 0) return;
    await supabase
      .from("reviews")
      .update({ owner_seen: true })
      .in(
        "id",
        unseen.map((r) => r.id),
      );
    await loadReviews();
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

  const updateOrderStatus: AuthContextValue["updateOrderStatus"] = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    await loadOrders(user?.id ?? null);
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (patch) => {
    if (!user) return { ok: false, error: "Você precisa estar logado" };
    const clean: { name?: string; phone?: string; address?: string } = {};
    if (patch.name !== undefined) clean.name = patch.name.trim().slice(0, 80);
    if (patch.phone !== undefined) clean.phone = patch.phone.trim().slice(0, 30);
    if (patch.address !== undefined) clean.address = patch.address.trim().slice(0, 200);
    const { error } = await supabase.from("profiles").update(clean).eq("id", user.id);
    if (error) return { ok: false, error: error.message };
    await loadUser(session);
    return { ok: true };
  };

  const getOrderItems: AuthContextValue["getOrderItems"] = async (orderId) => {
    const { data } = await supabase
      .from("order_items")
      .select("name, price, quantity")
      .eq("order_id", orderId);
    return (data ?? []).map((i: any) => ({
      name: i.name,
      price: Number(i.price),
      quantity: Number(i.quantity),
    }));
  };

  const adminDeleteSnackbar: AuthContextValue["adminDeleteSnackbar"] = async (snackbarId) => {
    const { error } = await supabase.from("snackbars").delete().eq("id", snackbarId);
    if (error) throw new Error(error.message);
    await refresh();
  };

  const adminCreateSnackbar: AuthContextValue["adminCreateSnackbar"] = async (data) => {
    const { error } = await supabase.from("snackbars").insert({
      name: data.name,
      description: data.description,
      location: data.location,
      owner_id: data.owner_id,
      categories: data.categories,
      opening_time: data.opening_time ?? null,
      closing_time: data.closing_time ?? null,
      rating: 0,
      view_count: 0,
    });
    if (error) return { ok: false, error: error.message };
    await refresh();
    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        snackbars,
        reviews,
        orders,
        updateOrderStatus,
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
        updateMenuItem,
        toggleMenuItemActive,
        reorderMenuItems,

        upsertReview,
        deleteReview,
        replyToReview,
        markOwnerReviewsSeen,
        updateProfile,
        getOrderItems,
        refresh,
        adminDeleteSnackbar,
        adminCreateSnackbar,
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
