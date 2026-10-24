import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Boxes,
  Facebook,
  FileText,
  Instagram,
  MessageCircle,
  Truck,
} from "lucide-react";
import { settingsQueryOptions } from "@/lib/queries";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { SOCIAL_LINKS } from "@/lib/social";
import { LogoMark } from "@/components/brand-logo";
import { Tilt } from "@/components/tilt";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "من نحن | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content:
          "مؤسسة المتوكل للتجارة متخصصة في تجارة مواد البناء والعوازل: الهوردي بكل الضغوط، رولات العزل، أدوات اللياسة وأدوات البناء الأساسية.",
      },
      { property: "og:title", content: "من نحن | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "تعرف على مؤسسة المتوكل للتجارة — مواد بناء وعوازل بجودة تُبنى عليها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const VALUES = [
  {
    icon: Boxes,
    title: "تشكيلة كاملة",
    text: "الهوردي بكل الضغوط والمقاسات، رولات العزل، أدوات اللياسة وأدوات البناء الأساسية في مكان واحد.",
  },
  {
    icon: BadgeCheck,
    title: "جودة تُبنى عليها",
    text: "بنختار موادنا بعناية عشان مشروعك يتسلم بأمان وثبات.",
  },
  {
    icon: FileText,
    title: "فاتورة باسم شركتك",
    text: "فاتورة واضحة بالرقم الضريبي والعنوان الوطني، تقدر تحفظها PDF.",
  },
  {
    icon: Truck,
    title: "خدمة سريعة",
    text: "طلبك بيوصل للمبيعات فورًا ويتم تجهيزه وتوصيله لموقعك.",
  },
];

function AboutPage() {
  const { data: settings } = useQuery(settingsQueryOptions);
  const salesWa = settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP;

  return (
    <div>
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-16 text-center">
          <LogoMark className="h-24 drop-shadow-2xl" />
          <p dir="ltr" className="font-display text-sm font-extrabold tracking-[0.45em] opacity-70">
            ALMOTAWAKEL
          </p>
          <h1 className="font-display text-4xl font-extrabold">من نحن</h1>
          <p className="max-w-2xl text-lg opacity-90">
            مؤسسة المتوكل للتجارة متخصصة في تجارة مواد البناء والعوازل. بنوفر للمقاولين
            وأصحاب المشاريع كل اللي محتاجينه من السقف للحيطة بأسعار واضحة وخدمة سريعة.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <Tilt key={v.title} className="rounded-2xl border bg-card p-5">
              <span className="pop-out flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <v.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold">{v.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </Tilt>
          ))}
        </div>

        <div className="mt-12 grid gap-6 rounded-2xl border bg-block p-6 shadow-3d md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold">تابعنا وكلمنا</h2>
            <p className="mt-1 text-muted-foreground">
              شوف أحدث المنتجات والعروض على صفحاتنا، أو ابعت طلب عرض سعر على واتساب.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={whatsappLink(salesWa, "السلام عليكم، محتاج عرض سعر من مؤسسة المتوكل")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                عرض سعر على واتساب
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer">
                <Facebook className="h-4 w-4" />
                فيسبوك
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">
                <Instagram className="h-4 w-4" />
                إنستجرام
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="secondary">
            <Link to="/">ابدأ التسوق</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
