import { FileUp, Headphones, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onPickFile: () => void;
};

export function EmptyState({ onPickFile }: Props) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-12 pb-24 text-center sm:px-6 md:pt-20">
      <div className="relative">
        <div className="absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-2xl" />
        <div className="flex size-20 items-center justify-center rounded-2xl border bg-card text-primary shadow-sm">
          <Headphones className="size-9" aria-hidden />
        </div>
      </div>
      <h2 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        歩きながら、耳で覚える。
      </h2>
      <p className="mt-3 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
        日本語と英語の2列CSVを読み込むと、自動で「日→英→次」と読み上げます。
      </p>
      <Button size="lg" className="mt-8 h-12 px-6" onClick={onPickFile}>
        <FileUp className="size-5" />
        最初のデッキを読み込む
      </Button>

      <div className="mt-12 grid w-full max-w-md gap-3 text-left sm:grid-cols-2">
        <Feature
          icon={<Sparkles className="size-4" />}
          title="ブラウザ内蔵TTS"
          body="サーバ送信なし。オフラインでも再生できます。"
        />
        <Feature
          icon={<FileUp className="size-4" />}
          title="シンプルなCSV"
          body="1列目に日本語、2列目に英語。それだけ。"
        />
      </div>

      <details className="mt-8 w-full max-w-md text-left">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          CSVのフォーマットを見る
        </summary>
        <pre className="mt-3 rounded-md border bg-card p-3 text-xs text-card-foreground">
{`おはよう,Good morning
ありがとう,Thank you
いただきます,Let's eat`}
        </pre>
      </details>
    </section>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
