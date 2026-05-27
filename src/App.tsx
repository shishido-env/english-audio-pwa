import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center gap-2 bg-background text-foreground">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </div>
  );
}
