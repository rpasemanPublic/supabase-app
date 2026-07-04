import { Logo } from "@/app/components/Logo";

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-6">
          <Logo />
        </div>
        {children}
      </div>
    </main>
  );
}
