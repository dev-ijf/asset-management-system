"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error?: string;
  email?: string;
};

function getRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = getRedirectPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email dan password wajib diisi.", email };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid.", email };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true },
  });

  const passwordValid = user ? await bcrypt.compare(password, user.password) : false;

  if (!user || !passwordValid) {
    return { error: "Email atau password salah.", email };
  }

  await createSession(user);
  redirect(nextPath);
}
