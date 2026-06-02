import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, LogOut, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { user, mySnackbar, logout, updateMySnackbar, addMenuItem, removeMenuItem } =
    useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => mySnackbar);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });

  if (!user || user.role !== "user" && !mySnackbar) {
    // Not an owner — bounce
  }

  if (!mySnackbar) {
    return (
      <div className="px-5 pt-8 text-sm text-muted-foreground">
        Você ainda não é dono. <Link to="/profile" className="text-brand">Tornar-se dono</Link>
      </div>
    );
  }

  const onSave = () => {
    if (draft) updateMySnackbar(draft);
    setEditing(false);
  };

  const onAdd = () => {
    if (!newItem.name) return;
    addMenuItem({
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price) || 0,
    });
    setNewItem({ name: "", description: "", price: "" });
    setAdding(false);
  };

  return (
    <div className="px-5 pt-8 pb-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand">Painel do dono</p>
          <h1 className="text-xl font-bold">{mySnackbar.name}</h1>
        </div>
        <button
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-surface-foreground shadow-card"
          aria-label="Sair"
        >
          <LogOut size={16} />
        </button>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Metric icon={<MessageSquare size={16} />} value="12" label="Avaliações" />
        <Metric icon={<Eye size={16} />} value="324" label="Visualizações" />
      </section>

      <section className="mt-6 rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Informações da lanchonete</h2>
          <button
            onClick={() => {
              setDraft(mySnackbar);
              setEditing((v) => !v);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-brand"
          >
            <Pencil size={12} /> {editing ? "Cancelar" : "Editar"}
          </button>
        </div>

        {!editing ? (
          <dl className="mt-3 space-y-2 text-sm">
            <Field label="Nome" value={mySnackbar.name} />
            <Field label="Descrição" value={mySnackbar.description} />
            <Field label="Endereço" value={mySnackbar.location} />
          </dl>
        ) : (
          <div className="mt-3 space-y-3 text-sm">
            <Input
              label="Nome"
              value={draft?.name ?? ""}
              onChange={(v) => setDraft((d) => d && { ...d, name: v })}
            />
            <Input
              label="Descrição"
              value={draft?.description ?? ""}
              onChange={(v) => setDraft((d) => d && { ...d, description: v })}
            />
            <Input
              label="Endereço"
              value={draft?.location ?? ""}
              onChange={(v) => setDraft((d) => d && { ...d, location: v })}
            />
            <button
              onClick={onSave}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Salvar alterações
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Menu ({mySnackbar.menu_items.length})</h2>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-primary-foreground"
          >
            <Plus size={12} /> Adicionar
          </button>
        </div>

        <ul className="mt-3 space-y-2">
          {mySnackbar.menu_items.length === 0 && (
            <li className="text-xs text-muted-foreground">Nenhum item ainda.</li>
          )}
          {mySnackbar.menu_items.map((m) => (
            <li
              key={m.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.description}
                </p>
                <p className="mt-1 text-xs font-bold text-brand">
                  R$ {m.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeMenuItem(m.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Link
        to="/snackbar/$id"
        params={{ id: mySnackbar.id }}
        className="mt-6 block rounded-xl border border-border py-3 text-center text-sm font-semibold"
      >
        Ver página pública
      </Link>

      {adding && (
        <Modal onClose={() => setAdding(false)} title="Novo item do menu">
          <div className="space-y-3">
            <Input
              label="Nome"
              value={newItem.name}
              onChange={(v) => setNewItem({ ...newItem, name: v })}
            />
            <Input
              label="Descrição"
              value={newItem.description}
              onChange={(v) => setNewItem({ ...newItem, description: v })}
            />
            <Input
              label="Preço (R$)"
              value={newItem.price}
              onChange={(v) => setNewItem({ ...newItem, price: v })}
            />
            <button
              onClick={onAdd}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Adicionar ao menu
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
      <div className="flex items-center justify-between text-brand">
        {icon}
        <span className="text-2xl font-extrabold text-surface-foreground">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-2">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-input/40 px-3 py-2 text-sm text-surface-foreground focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 text-surface-foreground shadow-card sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-xs text-muted-foreground">
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
