import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "サインアップ - English Audio PWA",
};

export default function SignUpPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignUp />
    </main>
  );
}
