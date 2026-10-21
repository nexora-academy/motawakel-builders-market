import { createClient } from "@supabase/supabase-js";

/**
 * عميل للقراءة العامة يُستخدم داخل handlers الدوال السيرفرية فقط.
 * مفتاح النشر فقط — بلا جلسات، والصلاحيات تديرها سياسات RLS.
 */
export function makePublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (
          key.startsWith("sb_") &&
          headers.get("Authorization") === `Bearer ${key}`
        ) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
