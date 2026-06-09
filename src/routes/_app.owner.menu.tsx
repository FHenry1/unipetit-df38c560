import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, GripVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth, type MenuItem } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/menu")({
  component: OwnerMenu,
});

type ItemDraft = { name: string; description: string; price: string; category: string; image_url: string };
const emptyDraft: ItemDraft = { name: "", description: "", price: "", category: "", image_url: "" };

function OwnerMenu() {
  const {
    mySnackbar,
    updateMySnackbar,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    toggleMenuItemActive,
    reorderMenuItems,
    duplicateMenuItem,
    addCategory,
    renameCategory,
    deleteCategory,
  } = useAuth();
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoDraft, setInfoDraft] = useState(mySnackbar);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("__all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!mySnackbar) return [] as string[];
    return [...mySnackbar.snackbar_categories]
      .sort((a, b) => a.position - b.position)
      .map((c) => c.name);
  }, [mySnackbar]);

  const filtered = useMemo(() => {
    if (!mySnackbar) return [];
    const q = search.trim().toLowerCase();
    let list = mySnackbar.menu_items;
    if (activeCategory !== "__all") {
      list = list.filter((m) => (m.category ?? "") === activeCategory);
    }
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q),
    );
  }, [mySnackbar, search, activeCategory]);

  if (!mySnackbar) {
    return (
      <div className="px-5 pt-10 text-sm text-neutral-400">
        Crie sua lanchonete primeiro.
      </div>
    );
  }

  const openAdd = () => {
    setItemDraft(emptyDraft);
    setModalItemId(null);
    setModalMode("add");
  };

  const openEdit = (m: MenuItem) => {
    setItemDraft({
      name: m.name,
      description: m.description ?? "",
      price: m.price.toFixed(2).replace(".", ","),
      category: m.category ?? "",
      image_url: m.image_url ?? "",
    });
    setModalItemId(m.id);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setModalItemId(null);
    setItemDraft(emptyDraft);
  };

  const submitItem = async () => {
    if (!itemDraft.name.trim()) return;
    const payload = {
      name: itemDraft.name.trim(),
      description: itemDraft.description.trim(),
      price: parseFloat(itemDraft.price.replace(",", ".")) || 0,
      category: itemDraft.category.trim() || null,
      image_url: itemDraft.image_url.trim() || null,
    };
    setSaving(true);
    try {
      if (modalMode === "add") await addMenuItem(payload);
      else if (modalMode === "edit" && modalItemId) await updateMenuItem(modalItemId, payload);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await removeMenuItem(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ordered = [...mySnackbar.menu_items];
    const from = ordered.findIndex((m) => m.id === dragId);
    const to = ordered.findIndex((m) => m.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = ordered.splice(from, 1);
    ordered.splice(to, 0, moved);
    setDragId(null);
    setOverId(null);
    await reorderMenuItems(ordered.map((m) => m.id));
  };

  const activeCount = mySnackbar.menu_items.filter((m) => m.is_active).length;

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
                setInfoDraft(mySnackbar);
                setEditingInfo((v) => !v);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[#e85d75]"
            >
              <Pencil size={12} /> {editingInfo ? "Cancelar" : "Editar"}
            </button>
          </div>

          {!editingInfo ? (
            <dl className="mt-3 space-y-2 text-sm text-neutral-300">
              <Field label="Nome" value={mySnackbar.name} />
              <Field label="Descrição" value={mySnackbar.description} />
              <Field label="Endereço" value={mySnackbar.location} />
            </dl>
          ) : (
            <div className="mt-3 space-y-3">
              <Input
                label="Nome"
                value={infoDraft?.name ?? ""}
                onChange={(v) => setInfoDraft((d) => d && { ...d, name: v })}
              />
              <Input
                label="Descrição"
                value={infoDraft?.description ?? ""}
                onChange={(v) => setInfoDraft((d) => d && { ...d, description: v })}
              />
              <Input
                label="Endereço"
                value={infoDraft?.location ?? ""}
                onChange={(v) => setInfoDraft((d) => d && { ...d, location: v })}
              />
              <button
                onClick={async () => {
                  if (infoDraft) await updateMySnackbar(infoDraft);
                  setEditingInfo(false);
                }}
                className="w-full rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Salvar alterações
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Itens do menu</h2>
              <p className="text-[11px] text-neutral-500">
                {mySnackbar.menu_items.length} total · {activeCount} ativos · arraste para reordenar
              </p>
            </div>
            <button
              onClick={openAdd}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#5d0a1a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6e0e22]"
            >
              <Plus size={12} /> Novo
            </button>
          </div>

          <label className="mt-3 flex items-center gap-2 rounded-lg bg-neutral-950 border border-neutral-800 px-3 py-2 focus-within:border-[#e85d75]">
            <Search size={14} className="text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item…"
              className="w-full bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-neutral-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </label>

          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <CategoryChip active={activeCategory === "__all"} label="Todos" onClick={() => setActiveCategory("__all")} />
              {categories.map((c) => (
                <CategoryChip key={c} active={activeCategory === c} label={c} onClick={() => setActiveCategory(c)} />
              ))}
            </div>
          )}

          <ul className="mt-3 space-y-2">
            {mySnackbar.menu_items.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
                Nenhum item ainda. Comece adicionando o primeiro.
              </li>
            )}
            {mySnackbar.menu_items.length > 0 && filtered.length === 0 && (
              <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
                Nenhum item corresponde a "{search}".
              </li>
            )}
            {filtered.map((m) => (
              <li
                key={m.id}
                draggable={!search}
                onDragStart={() => setDragId(m.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== m.id) setOverId(m.id);
                }}
                onDragLeave={() => {
                  if (overId === m.id) setOverId(null);
                }}
                onDrop={() => handleDrop(m.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`flex items-start gap-2 rounded-xl border bg-neutral-950 p-3 transition ${
                  dragId === m.id ? "opacity-40" : ""
                } ${
                  overId === m.id && dragId !== m.id
                    ? "border-[#e85d75]"
                    : "border-neutral-800"
                } ${!m.is_active ? "opacity-60" : ""}`}
              >
                <span
                  className={`mt-0.5 grid h-7 w-5 shrink-0 place-items-center text-neutral-600 ${
                    search ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing hover:text-neutral-300"
                  }`}
                  title={search ? "Limpe a busca para reordenar" : "Arraste"}
                >
                  <GripVertical size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">{m.name}</p>
                    {!m.is_active && (
                      <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                        Inativo
                      </span>
                    )}
                  </div>
                  {m.description && (
                    <p className="truncate text-xs text-neutral-400">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs font-bold text-[#e85d75]">
                    R$ {m.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Switch
                    active={m.is_active}
                    onClick={() => toggleMenuItemActive(m.id)}
                  />
                  <button
                    onClick={() => openEdit(m)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    aria-label="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    aria-label="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {modalMode && (
        <Modal
          title={modalMode === "add" ? "Novo item" : "Editar item"}
          onClose={closeModal}
        >
          <div className="space-y-3">
            <Input
              label="Nome"
              value={itemDraft.name}
              onChange={(v) => setItemDraft({ ...itemDraft, name: v })}
            />
            <Input
              label="Descrição"
              value={itemDraft.description}
              onChange={(v) => setItemDraft({ ...itemDraft, description: v })}
            />
            <Input
              label="Preço (R$)"
              value={itemDraft.price}
              onChange={(v) => setItemDraft({ ...itemDraft, price: v })}
            />
            <Input
              label="Categoria (ex: Hambúrgueres, Bebidas)"
              value={itemDraft.category}
              onChange={(v) => setItemDraft({ ...itemDraft, category: v })}
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                onClick={submitItem}
                disabled={saving || !itemDraft.name.trim()}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check size={14} />
                {modalMode === "add" ? "Adicionar" : "Salvar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Remover item" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-neutral-300">
            Tem certeza que deseja remover{" "}
            <strong className="text-white">"{deleteTarget.name}"</strong> do
            cardápio? Esta ação não pode ser desfeita.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-semibold text-neutral-300"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Trash2 size={14} /> Remover
            </button>
          </div>
        </Modal>
      )}
    </div>
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
      className="fixed inset-0 z-50 grid place-items-end bg-black/60 sm:place-items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-neutral-900 border border-neutral-800 p-5 sm:rounded-3xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Switch({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      title={active ? "Desativar item" : "Ativar item"}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        active ? "bg-[#5d0a1a]" : "bg-neutral-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          active ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
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

function CategoryChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
        active
          ? "bg-[#5d0a1a] text-white"
          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}
