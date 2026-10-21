import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeNextPath } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { HardHat, Loader2 } from "lucide-react";

const authSearchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "سجل دخولك أو أنشئ حساب جديد لمتابعة طلباتك في مؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "تسجيل الدخول | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "سجل دخولك أو أنشئ حساب جديد لمتابعة طلباتك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  const destination = sanitizeNextPath(next);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!identifier || !password) {
      toast.error("اكتب بيانات الدخول كاملة");
      return;
    }
    setLoading(true);
    try {
      // حسابات مُدارة برقم الجوال (مثل حساب الإدارة) تتسجل بإيميل داخلي
      const email = /^[^@\s]+@[^@\s]+$/.test(identifier)
        ? identifier
        : `${identifier}@mutawakkil.store`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error("بيانات الدخول غير صحيحة");
        return;
      }
      toast.success("تم تسجيل الدخول");
      await navigate({ to: destination });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (fullName.length < 2 || !email || password.length < 6) {
      toast.error("أكمل البيانات (كلمة السر 6 أحرف على الأقل)");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(
          error.message.includes("already")
            ? "هذا البريد مسجل بالفعل — سجل دخول"
            : "تعذر إنشاء الحساب، تأكد من البريد وكلمة السر",
        );
        return;
      }
      if (!data.session) {
        setSignupSent(true);
        toast.info("تم إنشاء الحساب — فعّله من رسالة التأكيد على بريدك");
        return;
      }
      toast.success("تم إنشاء حسابك");
      await navigate({ to: destination });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <HardHat className="h-7 w-7" />
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold">
          مؤسسة المتوكل للتجارة
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سجل دخولك لمتابعة طلباتك، أو أنشئ حساب جديد
        </p>
      </div>

      {signupSent && (
        <Card className="mb-4 border-accent/50 bg-accent/10">
          <CardContent className="pt-4 text-sm">
            تم إنشاء الحساب بنجاح. افتح بريدك واضغط رابط التأكيد، وبعدها سجل
            دخولك من هنا.
          </CardContent>
        </Card>
      )}

      <Card>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">حساب جديد</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <CardHeader>
              <CardTitle className="font-display">تسجيل الدخول</CardTitle>
              <CardDescription>
                بالبريد الإلكتروني أو برقم الحساب الخاص بالإدارة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSignIn}>
                <div className="grid gap-2">
                  <Label htmlFor="identifier">البريد أو رقم الحساب</Label>
                  <Input
                    id="identifier"
                    name="identifier"
                    autoComplete="username"
                    placeholder="name@example.com"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">كلمة السر</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  دخول
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardHeader>
              <CardTitle className="font-display">حساب جديد</CardTitle>
              <CardDescription>
                هتوصلك رسالة تأكيد على بريدك قبل تفعيل الحساب
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSignUp}>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">الاسم</Label>
                  <Input id="fullName" name="fullName" maxLength={80} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" name="email" type="email" dir="ltr" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
                  <Input id="phone" name="phone" inputMode="tel" dir="ltr" maxLength={16} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password2">كلمة السر</Label>
                  <Input
                    id="password2"
                    name="password"
                    type="password"
                    dir="ltr"
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  إنشاء الحساب
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
