import { useRef, useState } from "react";
import { toast } from "sonner";
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

type Props = {
  hasExistingDeck: boolean;
  onImport: (filename: string, content: string) => Promise<void>;
  children: (open: () => void) => React.ReactNode;
};

export function CsvFileInput({ hasExistingDeck, onImport, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; content: string } | null>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    try {
      const content = await file.text();
      if (hasExistingDeck) {
        setPending({ name: file.name, content });
      } else {
        await importNow(file.name, content);
      }
    } catch (e) {
      toast.error("読み込めませんでした", { description: String(e) });
    }
  };

  const importNow = async (name: string, content: string) => {
    try {
      await onImport(name, content);
      toast.success("CSVを読み込みました");
    } catch (e) {
      toast.error("読み込めませんでした", { description: String(e) });
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {children(openPicker)}
      <AlertDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>既存のデッキを上書きしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のデッキは削除され、新しいCSVに置き換わります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pending) return;
                const { name, content } = pending;
                setPending(null);
                await importNow(name, content);
              }}
            >
              上書きする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
