import { env } from "@/lib/env";

export const SITE = {
  name: "Biluxr",
  tagline: "One relationship for an exceptional life.",
  description:
    "Biluxr is a private membership for people whose lives move quickly. One relationship coordinates travel, stays, tables, access and the details between — remembered, and handled.",
};

export function siteUrl(path = "/"): string {
  const base = env.siteUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
