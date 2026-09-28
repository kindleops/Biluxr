import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { Founding, Premise, ServiceIndex } from "@/components/home/sections";
import {
  CommandShowcase,
  CredentialShowcase,
  JourneysShowcase,
  ProductShowcase,
} from "@/components/home/showcase";
import { SITE, siteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: siteUrl(),
    description: SITE.description,
    slogan: SITE.tagline,
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Premise />
      <ProductShowcase />
      <JourneysShowcase />
      <ServiceIndex />
      <CredentialShowcase />
      <CommandShowcase />
      <Founding />
    </>
  );
}
