import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { HORDI_PRESSURES, parseSize, productsForPressure } from "@/lib/hordi";
import { HORDI_IMAGE } from "@/lib/product-images";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { HordiTabs } from "@/components/hordi-tabs";
import { Tilt } from "@/components/tilt";

export const Route = createFileRoute("/hordi/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: HordiIndexPage,
  head: () => ({
    meta: [
      { title: "الهوردي بكل الضغوط | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content:
          "هوردي بضغط 8 و10 و12 و14 و16 و18 ومقاسات متعددة — اختار الضغط واطلب عرض سعر على واتساب.",
      },
      { property: "og:title", content: "الهوردي بكل الضغوط | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "اختار ضغط الهوردي وشوف المقاسات وكلم المبيعات على واتساب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function HordiIndexPage() {
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);
  const hordiCat = catalog.categories.find((c) => c.slug === "hordi");
  const hordi = catalog.products.filter((p) => p.category_id === hordiCat?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        الرئيسية
      </Link>

      <div className="mt-4 grid items-center gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">الهوردي</h1>
        </div>
        <Tilt className="overflow-hidden rounded-2xl border bg-card">
          <img
            src={HORDI_IMAGE}
            alt="بلوك هوردي"
            width={515}
            height={343}
            className="w-full object-contain"
          />
        </Tilt>
      </div>

      <HordiTabs />

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {HORDI_PRESSURES.map((p) => {
          const items = productsForPressure(hordi, p);
          return (
            <Tilt key={p} className="rounded-2xl border bg-block">
              <Link
                to="/hordi/$pressure"
                params={{ pressure: String(p) }}
                className="group flex h-full flex-col p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="pop-out">
                    <p className="text-sm text-muted-foreground">ضغط</p>
                    <p className="font-display text-6xl font-extrabold leading-none">{p}</p>
                  </div>
                  <img
                    src={HORDI_IMAGE}
                    alt=""
                    aria-hidden
                    width={515}
                    height={343}
                    loading="lazy"
                    className="w-32 drop-shadow-xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {items.map((it) => (
                    <span
                      key={it.id}
                      dir="ltr"
                      className="rounded-md bg-card px-2 py-1 text-xs font-bold"
                    >
                      {parseSize(it.name_ar) ?? it.name_ar}
                    </span>
                  ))}
                  {items.length === 0 && (
                    <span className="text-xs text-muted-foreground">اطلبه على واتساب</span>
                  )}
                </div>
                <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                  <span className="text-muted-foreground">{items.length} مقاسات</span>
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </div>
              </Link>
            </Tilt>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
        محتاج مقاس أو ضغط مش موجود؟{" "}
        <a
          href={whatsappLink(
            settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP,
            "السلام عليكم، محتاج هوردي بمقاس مخصص",
          )}
          target="_blank"
          rel="noreferrer"
          className="font-bold underline"
        >
          اطلبه على واتساب
        </a>
      </div>
    </div>
  );
}
