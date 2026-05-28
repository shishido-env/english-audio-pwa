"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";

type Props = {
  onImport: (filename: string, content: string) => Promise<void>;
  children: (open: () => void) => React.ReactNode;
};

export function CsvFileInput({ onImport, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = async (file: File) => {
    try {
      const content = await file.text();
      await onImport(file.name, content);
      toast.success("デッキを追加しました", { description: file.name });
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
      {/* eslint-disable-next-line react-hooks/refs -- render-prop: openPicker is a stable event handler that triggers ref.click() lazily on user interaction, not during render */}
      {children(openPicker)}
    </>
  );
}
