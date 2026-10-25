import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  formatSAR,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ClipboardList,
  ExternalLink,
  Loader2,
  Package,
  Save,
  Settings2,
  ShieldAlert,
  ImagePlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { PRODUCT_IMAGE_BUCKET, STORAGE_IMAGE_PREFIX, productImage } from "@/lib/product-images";
import { PRODUCT_UNITS, normalizeUnit } from "@/lib/units";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "لوحة التحكم | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "إدارة الطلبات والمنتجات وإعدادات المتجر.",
      },
      { property: "og:title", content: "لوحة التحكم | مؤسسة المتوكل للتجارة" },
      { property: "og:description", content: "إدارة الطلبات والمنتجات وإعدادات المتجر." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type AdminOrderItem = {
  id: string;
  product_name_ar: string;
  specs_ar: string | null;
  unit_ar: string;
  quantity: number;
  unit_price: number;
};

type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  notes: string | null;
  total: number;
  created_at: string;
  access_code: string;
  company_name: string | null;
  vat_number: string | null;
  national_address: string | null;
  order_items: AdminOrderItem[];
};

type AdminProduct = {
  id: string;
  category_id: string;
  name_ar: string;
  specs_ar: string | null;
  unit_ar: string;
  price: number;
  in_stock: boolean;
  is_active: boolean;
  image_url: string | null;
};

type AdminCategory = { id: string; name_ar: string };

function AdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setAllowed(false);
        return;
      }
      const { data: roleData } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      setAllowed(roleData === true);
    })();
  }, []);

  if (allowed === null) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 font-display text-2xl font-bold">غير مصرح</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          هذي الصفحة مخصصة لمسؤول المؤسسة فقط.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">الرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">لوحة التحكم</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        إدارة طلبات العملاء والمنتجات وإعدادات المتجر
      </p>

      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            الطلبات
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            المنتجات
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTab() {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, customer_name, customer_phone, customer_address, notes, total, created_at, access_code, company_name, vat_number, national_address, order_items(id, product_name_ar, specs_ar, unit_ar, quantity, unit_price)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o) => ({
        ...(o as unknown as AdminOrder),
        total: Number((o as unknown as AdminOrder).total),
        order_items: (o as unknown as AdminOrder).order_items.map((it) => ({
          ...it,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      })) as AdminOrder[];
    },
  });

  async function changeStatus(orderId: string, status: string) {
    const { error } = await supabase.rpc("admin_set_order_status", {
      _order_id: orderId,
      _status: status,
    });
    if (error) {
      toast.error("تعذر تغيير حالة الطلب");
      return;
    }
    toast.success("تم تحديث حالة الطلب");
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  const orders = ordersQuery.data ?? [];

  return (
    <div className="mt-4 space-y-4">
      {ordersQuery.isLoading && (
        <p className="py-8 text-center text-muted-foreground">جارٍ التحميل…</p>
      )}
      {!ordersQuery.isLoading && orders.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">مفيش طلبات لسه</p>
      )}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} onStatusChange={changeStatus} />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  onStatusChange,
}: {
  order: AdminOrder;
  onStatusChange: (orderId: string, status: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex cursor-pointer items-center gap-3" onClick={() => setOpen(!open)}>
            <div>
              <CardTitle className="font-display text-base">
                {order.order_number}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {order.company_name ? `${order.company_name} — ` : ""}
                {order.customer_name} —{" "}
                <span dir="ltr">{order.customer_phone}</span> —{" "}
                {new Date(order.created_at).toLocaleDateString("ar-EG")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-bold">{formatSAR(order.total)}</span>
            <Select value={order.status} onValueChange={(v) => void onStatusChange(order.id, v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" size="sm">
              <Link
                to="/invoice/$orderId"
                params={{ orderId: order.id }}
                search={{ code: order.access_code }}
              >
                <ExternalLink className="h-4 w-4" />
                الفاتورة
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="border-t pt-4">
          <div className="mb-2 grid gap-1 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">الشركة: </span>
              {order.company_name || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">الرقم الضريبي: </span>
              <span dir="ltr">{order.vat_number || "—"}</span>
            </p>
            <p className="sm:col-span-2">
              <span className="text-muted-foreground">العنوان الوطني: </span>
              {order.national_address || "—"}
            </p>
          </div>
          {order.customer_address && (
            <p className="text-sm">
              <span className="text-muted-foreground">العنوان: </span>
              {order.customer_address}
            </p>
          )}
          {order.notes && (
            <p className="mt-1 text-sm">
              <span className="text-muted-foreground">ملاحظات: </span>
              {order.notes}
            </p>
          )}
          <div className="mt-3 divide-y rounded-lg border">
            {order.order_items.map((it) => (
              <OrderItemRow key={it.id} item={it} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function OrderItemRow({ item }: { item: AdminOrderItem }) {
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.unit_price));
  const [saving, setSaving] = useState(false);

  async function save() {
    const q = Number(qty);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) {
      toast.error("قيم غير صحيحة");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("admin_update_order_item", {
        _item_id: item.id,
        _quantity: q,
        _unit_price: p,
      });
      if (error) {
        toast.error("تعذر حفظ التعديل");
        return;
      }
      toast.success("تم التعديل وإعادة حساب الإجمالي");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{item.product_name_ar}</p>
        {item.specs_ar && (
          <p className="text-xs text-muted-foreground">{item.specs_ar}</p>
        )}
      </div>
      <Input
        aria-label="الكمية"
        inputMode="decimal"
        className="h-8 w-20"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <Input
        aria-label="سعر الوحدة"
        inputMode="decimal"
        className="h-8 w-24"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        dir="ltr"
      />
      <span className="w-20 text-left font-bold" dir="ltr">
        {formatSAR(Number(qty) * Number(price) || 0)}
      </span>
      <Button size="sm" variant="outline" onClick={() => void save()} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        حفظ
      </Button>
    </div>
  );
}

function ProductsTab() {
  const queryClient = useQueryClient();
  const catsQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name_ar")
        .order("sort_order");
      return (data ?? []) as AdminCategory[];
    },
  });
  const prodsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, category_id, name_ar, specs_ar, unit_ar, price, in_stock, is_active, image_url",
        )
        .order("sort_order");
      return (data ?? []).map((p) => ({
        ...(p as unknown as AdminProduct),
        price: Number((p as unknown as AdminProduct).price),
      })) as AdminProduct[];
    },
  });

  const cats = catsQuery.data ?? [];
  const prods = prodsQuery.data ?? [];
  const catName = (id: string) => cats.find((c) => c.id === id)?.name_ar ?? "—";

  return (
    <div className="mt-4 space-y-4">
      <AddProductForm categories={cats} onAdded={() => void queryClient.invalidateQueries({ queryKey: ["admin-products"] })} />
      {prods.map((p) => (
        <ProductRow
          key={`${p.id}-${p.name_ar}-${p.unit_ar}-${p.specs_ar ?? ""}-${p.category_id}`}
          product={p}
          categoryName={catName(p.category_id)}
          categories={cats}
        />
      ))}
    </div>
  );
}

function AddProductForm({
  categories,
  onAdded,
}: {
  categories: AdminCategory[];
  onAdded: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [specs, setSpecs] = useState("");
  const [unit, setUnit] = useState("قطعة");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (name.trim().length < 2 || !categoryId || !Number(price)) {
      toast.error("أكمل الاسم والقسم والسعر");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        name_ar: name.trim(),
        category_id: categoryId,
        specs_ar: specs.trim() || null,
        unit_ar: normalizeUnit(unit),
        price: Number(price),
        sort_order: 999,
      });
      if (error) {
        toast.error("تعذر إضافة المنتج");
        return;
      }
      toast.success("تمت إضافة المنتج");
      setName("");
      setSpecs("");
      setPrice("");
      await onAdded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base">إضافة منتج جديد</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Input placeholder="اسم المنتج" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="sm:col-span-1">
            <SelectValue placeholder="القسم" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="المواصفات" value={specs} onChange={(e) => setSpecs(e.target.value)} maxLength={100} />
        <UnitPicker value={unit} onChange={setUnit} />
        <div className="flex gap-2">
          <Input placeholder="السعر" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
          <Button onClick={() => void add()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "+"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const OTHER_UNIT = "__other";

function UnitPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const isPreset = (PRODUCT_UNITS as readonly string[]).includes(value);
  const [custom, setCustom] = useState(!isPreset);
  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      <Select
        value={custom ? OTHER_UNIT : value}
        onValueChange={(v) => {
          if (v === OTHER_UNIT) {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger aria-label="الوحدة" className="min-w-28">
          <SelectValue placeholder="الوحدة" />
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_UNITS.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_UNIT}>وحدة تانية…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input
          aria-label="اكتب الوحدة"
          placeholder="اكتب الوحدة"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={20}
        />
      )}
    </div>
  );
}

function ProductRow({
  product,
  categoryName,
  categories,
}: {
  product: AdminProduct;
  categoryName: string;
  categories: AdminCategory[];
}) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name_ar);
  const [specs, setSpecs] = useState(product.specs_ar ?? "");
  const [unit, setUnit] = useState(product.unit_ar);
  const [categoryId, setCategoryId] = useState(product.category_id);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    await queryClient.invalidateQueries({ queryKey: ["catalog"] });
  }

  async function update(fields: Partial<AdminProduct>) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update(fields)
        .eq("id", product.id);
      if (error) {
        toast.error("تعذر تحديث المنتج");
        return false;
      }
      toast.success("تم التحديث");
      await refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function saveDetails() {
    if (name.trim().length < 2) {
      toast.error("اسم المنتج قصير جدًا");
      return;
    }
    if (unit.trim().length === 0) {
      toast.error("اختار الوحدة أو اكتبها");
      return;
    }
    const ok = await update({
      name_ar: name.trim(),
      specs_ar: specs.trim() || null,
      unit_ar: normalizeUnit(unit),
      category_id: categoryId,
    });
    if (ok) setEditing(false);
  }

  async function remove() {
    setSaving(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) {
        toast.error("تعذر حذف الصنف");
        return;
      }
      toast.success("تم حذف الصنف");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("اختار ملف صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الصورة أكبر من 5 ميجا");
      return;
    }
    setSaving(true);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `products/${product.id}-${Date.now()}.${ext || "jpg"}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        toast.error("تعذر رفع الصورة");
        return;
      }
      await update({ image_url: `${STORAGE_IMAGE_PREFIX}${path}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-3">
        <ProductThumb imageUrl={product.image_url} />
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted">
          <ImagePlus className="h-3 w-3" />
          صورة
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadImage(f);
              e.target.value = "";
            }}
          />
        </label>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{product.name_ar}</p>
          <p className="text-xs text-muted-foreground">
            {categoryName}
            {product.specs_ar ? ` — ${product.specs_ar}` : ""} — {product.unit_ar}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Input
            aria-label="السعر"
            inputMode="decimal"
            className="h-8 w-24"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            dir="ltr"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void update({ price: Number(price) })}
            disabled={saving || Number(price) === product.price}
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
        <Button
          size="sm"
          variant={product.in_stock ? "secondary" : "outline"}
          onClick={() => void update({ in_stock: !product.in_stock })}
        >
          {product.in_stock ? "متوفر" : "غير متوفر"}
        </Button>
        <Button
          size="sm"
          variant={product.is_active ? "secondary" : "outline"}
          onClick={() => void update({ is_active: !product.is_active })}
        >
          {product.is_active ? (
            <Badge variant="secondary">معروض</Badge>
          ) : (
            "مخفي"
          )}
        </Button>
        <Button
          size="sm"
          variant={editing ? "secondary" : "outline"}
          onClick={() => setEditing(!editing)}
        >
          <Pencil className="h-3 w-3" />
          تعديل
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={saving}>
              <Trash2 className="h-3 w-3" />
              حذف
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف "{product.name_ar}"؟</AlertDialogTitle>
              <AlertDialogDescription>
                الصنف هيتشال من المتجر نهائيًا. الفواتير القديمة اللي فيها الصنف ده هتفضل زي ما هي.
                لو عايز تخفيه مؤقتًا بس، استخدم زرار "معروض/مخفي".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void remove()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                احذف الصنف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      {editing && (
        <CardContent className="grid gap-3 border-t pt-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label>اسم الصنف</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="grid gap-1">
            <Label>المواصفات</Label>
            <Input value={specs} onChange={(e) => setSpecs(e.target.value)} maxLength={100} />
          </div>
          <div className="grid gap-1">
            <Label>الوحدة (سم، لفة، كرتونة…)</Label>
            <UnitPicker value={unit} onChange={setUnit} />
          </div>
          <div className="grid gap-1">
            <Label>القسم</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button onClick={() => void saveDetails()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التعديل
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setName(product.name_ar);
                setSpecs(product.specs_ar ?? "");
                setUnit(product.unit_ar);
                setCategoryId(product.category_id);
                setEditing(false);
              }}
            >
              إلغاء
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function ProductThumb({ imageUrl }: { imageUrl: string | null }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (imageUrl?.startsWith(STORAGE_IMAGE_PREFIX)) {
      void supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .createSignedUrl(imageUrl.slice(STORAGE_IMAGE_PREFIX.length), 3600)
        .then(({ data }) => {
          if (active) setSrc(data?.signedUrl ?? null);
        });
    } else {
      setSrc(imageUrl ? productImage(imageUrl) : null);
    }
    return () => {
      active = false;
    };
  }, [imageUrl]);
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-secondary">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  );
}

function SettingsTab() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });

  const [whatsapp, setWhatsapp] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !loaded) {
      setWhatsapp(settingsQuery.data["sales_whatsapp"] ?? "");
      setStoreName(settingsQuery.data["store_name"] ?? "");
      setLoaded(true);
    }
  }, [settingsQuery.data, loaded]);

  async function save() {
    if (!/^\d{8,15}$/.test(whatsapp)) {
      toast.error("رقم واتساب لازم يكون بصيغة دولية بدون +، مثال: 9665xxxxxxxx");
      return;
    }
    setSaving(true);
    try {
      const [e1, e2] = await Promise.all([
        supabase.rpc("admin_set_setting", { _key: "sales_whatsapp", _value: whatsapp }),
        supabase.rpc("admin_set_setting", { _key: "store_name", _value: storeName.trim() || "مؤسسة المتوكل للتجارة" }),
      ]);
      if (e1.error || e2.error) {
        toast.error("تعذر حفظ الإعدادات");
        return;
      }
      toast.success("تم حفظ الإعدادات");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4 max-w-xl">
      <CardHeader>
        <CardTitle className="font-display text-base">إعدادات المتجر</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="wa">رقم واتساب المبيعات (صيغة دولية بدون +)</Label>
          <Input
            id="wa"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            dir="ltr"
            placeholder="9665xxxxxxxx"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storeName">اسم المؤسسة (يظهر على الفاتورة)</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            maxLength={100}
          />
        </div>
        <Button onClick={() => void save()} disabled={saving} className="w-fit">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ الإعدادات
        </Button>
      </CardContent>
    </Card>
  );
}
