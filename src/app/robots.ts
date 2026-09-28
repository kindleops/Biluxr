import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/command", "/login", "/auth"] }],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
