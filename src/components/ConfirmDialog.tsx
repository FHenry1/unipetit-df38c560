import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Diálogo de confirmação próprio do app.
 *
 * Substitui o window.confirm(), que é bloqueado silenciosamente
 * dentro do preview do Lovable (iframe) e em alguns navegadores
 * de celular — fazendo os botões parecerem "mortos".
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  destructive = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** true = botão vermelho (excluir); false = botão na cor da marca */
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="uppercase tracking-wide">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-200 hover:bg-neutral-800 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              destructive
                ? "bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-500"
                : "bg-[#5d0a1a] text-xs font-bold uppercase tracking-wide text-white hover:bg-[#7a1022]"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
