import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/menu")({
  component: OwnerMenu,
});

function OwnerMenu() {
  const { mySnackbar, updateMySnackbar, addMenuItem, removeMenuItem } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mySnackbar);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "" });

  if (!mySnackbar) {
    return (
      <div className="px-5 pt-10 text-sm text-neutral-400">
        Crie sua lanchonete primeiro.
      </div>
    );
  }

  return (
    <div className="pb-6">
      <OwnerHeader title="Gerenciar Cardápio" subtitle="Modo dono" />

      <div className="px-5 -mt-6 space-y-4">
        <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Informações da lanchonete
            </h2>
            <button
              onClick={() => {
                setDraft(mySnackbar);
                setEditing((v) => !v);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#e85d75]"
            >
              <Pencil size={12} /> {editing ? "Cancelar" : "Editar"}
            </button>
          </div>

          {!editing ? (
            <dl className="mt-3 space-y-2 text-sm text-neutral-300">
              <Field label="Nome" value={mySnackbar.name} />
              <Field label="Descrição" value={mySnackbar.description} />
              <Field label="Endereço" value={mySnackbar.location} />
            </dl>
          ) : (
            <div className="mt-3 space-y-3">
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
                onClick={() => {
                  if (draft) updateMySnackbar(draft);
                  setEditing(false);
                }}
                className="w-full rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Salvar alterações
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Itens do menu ({mySnackbar.menu_items.length})
            </h2>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 rounded-full bg-[#5d0a1a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#6e0e22]"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {mySnackbar.menu_items.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
                Nenhum item ainda. Comece adicionando o primeiro.
              </li>
            )}
            {mySnackbar.menu_items.map((m) => (
              <li
                key={m.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-neutral-950 border border-neutral-800 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{m.name}</p>
                  {m.description && (
                    <p className="truncate text-xs text-neutral-400">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs font-bold text-[#e85d75]">
                    R$ {m.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <button
                  onClick={() => removeMenuItem(m.id)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  aria-label="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {adding && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center sm:p-6"
          onClick={() => setAdding(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-neutral-900 border border-neutral-800 p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Novo item</h3>
              <button
                onClick={() => setAdding(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
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
                onClick={() => {
                  if (!newItem.name) return;
                  addMenuItem({
                    name: newItem.name,
                    description: newItem.description,
                    price: parseFloat(newItem.price) || 0,
                  });
                  setNewItem({ name: "", description: "", price: "" });
                  setAdding(false);
                }}
                className="w-full rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Adicionar ao menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <dt className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="text-neutral-200">{value}</dd>
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
      <span className="text-[11px] font-medium text-neutral-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 text-sm text-white focus:border-[#e85d75] focus:outline-none"
      />
    </label>
  );
}
