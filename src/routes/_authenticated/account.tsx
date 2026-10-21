import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  formatSAR,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "طلباتي | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "تابع طلباتك وفواتيرك من مؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "طلباتي | مؤسسة المتوكل للتجارة" },
      { property: "og:description", content: "تابع طلباتك وفواتيرك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

function AccountPage() {
  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderSummary[];
    },
  });

  const orders = ordersQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">طلباتي</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        كل طلباتك وفواتيرها في مكان واحد
      </p>

      {ordersQuery.isLoading && (
        <p className="mt-10 text-center text-muted-foreground">جارٍ التحميل…</p>
      )}

      {!ordersQuery.isLoading && orders.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <PackageOpen className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">مفيش طلبات لسه</p>
          <Button asChild className="mt-4">
            <Link to="/">ابدأ التسوق</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-display font-bold">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <Badge className={ORDER_STATUS_STYLES[o.status] ?? ""} variant="secondary">
                {ORDER_STATUS_LABELS[o.status] ?? o.status}
              </Badge>
              <span className="font-display font-bold">{formatSAR(o.total)}</span>
              <Button asChild variant="outline" size="sm">
                <Link to="/invoice/$orderId" params={{ orderId: o.id }}>
                  عرض الفاتورة
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
