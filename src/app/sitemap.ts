import type { MetadataRoute } from "next";
import { LEGAL_DOCUMENTS } from "@/content/legal";
import { siteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/membership", "/concierge", "/partners", "/apply", "/contact"];
  return [
    ...pages.map((p) => ({
      url: siteUrl(p),
      changeFrequency: "monthly" as const,
      priority: p === "/" ? 1 : 0.7,
    })),
    ...LEGAL_DOCUMENTS.map((d) => ({ url: siteUrl(`/legal/${d.slug}`), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
