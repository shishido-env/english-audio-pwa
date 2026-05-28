export const metadata = {
  title: "オフライン - English Audio PWA",
};

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold">オフラインです</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ネットワーク接続を確認してから、再読み込みしてください。
          既に開いていたデッキは引き続き再生できます。
        </p>
      </div>
    </main>
  );
}
