import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Building2, MessageCircle, Truck, Wallet } from "lucide-react";
import { catalogQueryOptions } from "@/lib/queries";
import heroImage from "@/assets/hero.jpg";
import catTools from "@/assets/cat-tools.jpg";
import catInsulation from "@/assets/cat-insulation.jpg";
import catPlaster from "@/assets/cat-plaster.jpg";
import catHordi from "@/assets/cat-hordi.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  "tools-basics": catTools,
  "insulation-rolls": catInsulation,
  "plaster-tools": catPlaster,
  hordi: catHordi,
};

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: Index,
  head: () => ({
    meta: [
      { title: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        name: "description",
        content:
          "اشترِ أدوات البناء الأساسية، رولات العزل، أدوات اللياسة، والهوردي بجميع مقاساته أونلاين مع فاتورة ودفع إلكتروني.",
      },
      { property: "og:title", content: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        property: "og:description",
        content:
          "اشترِ أدوات البناء، رولات العزل، أدوات اللياسة، والهوردي أونلاين مع فاتورة ودفع إلكتروني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img
          src={heroImage}
          alt="مستودع مواد بناء"
          width={1600}
          height={800}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
            <BadgeCheck className="h-4 w-4" />
            جودة تُبنى عليها
          </span>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            مؤسسة المتوكل للتجارة
          </h1>
          <p className="mt-3 max-w-xl text-lg opacity-90">
            كل اللي بيتك منه السقف والحيطة في مكان واحد: أدوات البناء، رولات
            العزل، أدوات اللياسة، والهوردي بجميع مقاساته.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/category/$slug"
              params={{ slug: "hordi" }}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-accent-foreground transition-transform hover:scale-[1.02]"
            >
              تسوق الهوردي
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/category/$slug"
              params={{ slug: "tools-basics" }}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-foreground/30 px-6 py-3 font-bold transition-colors hover:bg-primary-foreground/10"
            >
              تصفح الأقسام
            </Link>
          </div>
        </div>
      </section>

      {/* الأقسام */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">أقسامنا</h2>
        <p className="mt-1 text-muted-foreground">
          اختر القسم وابدأ إضافة اللي محتاجه للسلة
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.categories.map((cat) => (
            <Link
              key={cat.id}
              to="/category/$slug"
              params={{ slug: cat.slug }}
              className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={CATEGORY_IMAGES[cat.slug] ?? heroImage}
                  alt={cat.name_ar}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-bold">{cat.name_ar}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {cat.description_ar}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ليه نحن */}
      <section className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, title: "خبرة في مواد البناء", text: "تنوع يغطي احتياجات موقعك كاملة" },
            { icon: Wallet, title: "دفع إلكتروني آمن", text: "ادفع بسهولة وبطاقتك البنكية" },
            { icon: Truck, title: "طلبات منظمة", text: "فاتورة واضحة بكل غرض وكميته" },
            { icon: MessageCircle, title: "عرض سعر على واتساب", text: "كلم مسؤول المبيعات فورًا" },
          ].map((f) => (
            <div key={f.title} className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* خطوات الشراء */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          إزاي تشتري من الموقع؟
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "اختار الأغراض اللي محتاجها وحدد الكمية",
            "أضفها للسلة وأكمل بيانات الشحن",
            "المسؤول يراجع الطلب ويصدر الفاتورة",
            "استلم الفاتورة PDF وادفع إلكترونيًا",
          ].map((step, i) => (
            <li key={i} className="rounded-2xl border bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="mt-3 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
