import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "サインイン - English Audio PWA",
};

export default function SignInPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <SignIn />
    </main>
  );
}
