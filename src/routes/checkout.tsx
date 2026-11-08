import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  beforeLoad: () => {
    throw redirect({ to: "/cart" });
  },
  component: () => null,
  head: () => ({
    meta: [
      { title: "التواصل مع المبيعات | مؤسسة المتوكل للتجارة" },
      { name: "description", content: "الطلب ومعرفة السعر من خلال واتساب مؤسسة المتوكل للتجارة." },
      { property: "og:title", content: "التواصل مع المبيعات | مؤسسة المتوكل للتجارة" },
      { property: "og:description", content: "كلم مسؤول المبيعات على واتساب لمعرفة السعر والطلب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
