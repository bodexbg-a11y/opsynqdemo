import { redirect } from "next/navigation";
import { HardHat } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { loginAction } from "@/lib/actions-auth";
import { inputClass } from "@/components/ui/form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <HardHat className="w-5 h-5 text-white" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-wide text-white">OPSYNQ</p>
            <p className="text-[10.5px] text-ink-400 tracking-wider -mt-0.5">CONSTRUCTION OS</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <h1 className="text-[17px] font-semibold text-ink-900 mb-1">Sign in</h1>
          <p className="text-[13px] text-ink-500 mb-6">Access your OPSYNQ workspace.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-danger-100 text-danger-500 text-[12.5px] px-3 py-2.5">
              Incorrect email or password.
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-ink-600 mb-1.5">Email</label>
              <input type="email" name="email" required autoFocus placeholder="you@company.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink-600 mb-1.5">Password</label>
              <input type="password" name="password" required placeholder="••••••••" className={inputClass} />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[13.5px] font-medium py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
