import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";

export const metadata = {
  title: "Register — JobTrack",
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session) {
    redirect("/applications");
  }

  return (
    <div className="relative flex min-h-[calc(100vh-7.5rem)] items-center justify-center p-4 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative z-10 w-full">
        <RegisterForm />
      </div>
    </div>
  );
}
