import { BookOpen, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onPickFile: () => void;
};

export function EmptyState({ onPickFile }: Props) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-16 text-center sm:px-6">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <BookOpen className="size-7" aria-hidden />
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">
        デッキがありません
      </h2>
      <p className="mt-2 max-w-sm text-base text-muted-foreground leading-relaxed">
        2列のCSV（1列目: 日本語、2列目: 英語）を読み込んで始めましょう。
      </p>
      <Button size="lg" className="mt-8 h-12 px-6" onClick={onPickFile}>
        <FileUp className="size-5" />
        CSVを読み込む
      </Button>
      <div className="mt-10 w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          フォーマット例
        </p>
        <pre className="mt-2 rounded-md border bg-card p-3 text-left text-xs text-card-foreground">
{`おはよう,Good morning
ありがとう,Thank you
いただきます,Let's eat`}
        </pre>
      </div>
    </section>
  );
}
