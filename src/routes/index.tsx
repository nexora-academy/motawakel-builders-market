import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  MessageCircle,
  MessagesSquare,
  Truck,
} from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { CATEGORY_IMAGES } from "@/lib/product-images";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { Hero3D } from "@/components/hero-3d";
import { Tilt } from "@/components/tilt";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: Index,
  head: () => ({
    meta: [
      { title: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        name: "description",
        content:
          "تصفح أدوات البناء الأساسية، رولات العزل، أدوات اللياسة، والهوردي بجميع الضغوط والمقاسات واطلب عرض سعر على واتساب.",
      },
      { property: "og:title", content: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        property: "og:description",
        content:
          "أدوات البناء، رولات العزل، أدوات اللياسة، والهوردي بجميع الضغوط — اختار طلبك وكلم المبيعات على واتساب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function categoryLink(slug: string) {
  return slug === "hordi"
    ? ({ to: "/hordi" } as const)
    : ({ to: "/category/$slug", params: { slug } } as const);
}

function Index() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);
  const salesWa = settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP;

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero relative isolate overflow-hidden text-primary-foreground">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          width={1600}
          height={800}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-12 lg:grid-cols-2 lg:py-20">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground shadow-3d">
              <BadgeCheck className="h-4 w-4" />
              جودة تُبنى عليها
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              مؤسسة المتوكل للتجارة
            </h1>
            <p
              dir="ltr"
              className="mt-1 text-right font-display text-sm font-extrabold tracking-[0.45em] opacity-60"
            >
              ALMOTAWAKEL
            </p>
            <p className="mt-4 max-w-xl text-lg opacity-90">
              كل اللي بيتك محتاجه من السقف للحيطة في مكان واحد: أدوات البناء،
              رولات العزل، أدوات اللياسة، والهوردي بكل الضغوط والمقاسات.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappLink(salesWa, "السلام عليكم، محتاج عرض سعر من مؤسسة المتوكل")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-2 rounded-xl bg-accent px-6 py-3 font-bold text-accent-foreground shadow-3d transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                اطلب عرض سعر على واتساب
              </a>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 font-bold transition-colors hover:bg-primary-foreground/10"
              >
                تصفح الأقسام
                <ArrowLeft className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="h-[320px] min-w-0 sm:h-[420px] lg:h-[480px]">
            <Hero3D />
          </div>
        </div>
      </section>

      {/* الأقسام */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">أقسامنا</h2>
        <p className="mt-1 text-muted-foreground">
          اختر القسم والصنف والكمية، واطلب السعر من المبيعات على واتساب
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.categories.map((cat) => (
            <Tilt key={cat.id} className="overflow-hidden rounded-2xl border bg-card">
              <Link {...categoryLink(cat.slug)} className="group block h-full">
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={CATEGORY_IMAGES[cat.slug] ?? heroImage}
                    alt={cat.name_ar}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="pop-out p-4">
                  <h3 className="font-display text-lg font-bold">{cat.name_ar}</h3>
                </div>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      {/* ليه نحن */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Building2, title: "خبرة في مواد البناء", text: "تنوع يغطي احتياجات موقعك كاملة" },
          { icon: MessagesSquare, title: "رد مباشر من المبيعات", text: "اعرف السعر والتوفر على واتساب" },
          { icon: Truck, title: "فاتورة باسم شركتك", text: "بالرقم الضريبي والعنوان الوطني" },
          { icon: MessageCircle, title: "عرض سعر على واتساب", text: "ابعت طلبك ويوصل للمبيعات على طول" },
        ].map((f) => (
          <div key={f.title} className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-3d">
              <f.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* خطوات الطلب */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          إزاي تطلب من الموقع؟
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "اختار القسم والأغراض اللي محتاجها",
            "حدد المقاس والكمية المناسبة",
            "اضغط زر واتساب وابعت الرسالة الجاهزة",
            "مسؤول المبيعات يرد عليك بالسعر والتوفر",
          ].map((step, i) => (
            <li key={i}>
              <Tilt className="rounded-2xl border bg-card p-5">
                <span className="pop-out flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm leading-relaxed">{step}</p>
              </Tilt>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-3d">
          <div>
            <p className="font-display text-lg font-bold">محتاج مساعدة أو عرض سعر؟</p>
            <p className="text-sm opacity-80">
              ابعت رسالتك على واتساب وتوصل لمسؤول المبيعات على طول.
            </p>
          </div>
          <a
            href={whatsappLink(salesWa, "السلام عليكم، محتاج استفسار من مؤسسة المتوكل")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            كلمنا على واتساب
          </a>
        </div>
      </section>
    </div>
  );
}
