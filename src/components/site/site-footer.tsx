import Link from "next/link";
import { BiluxrWordmark } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Biluxr",
    links: [
      { href: "/membership", label: "Membership" },
      { href: "/concierge", label: "Concierge" },
      { href: "/partners", label: "Partners" },
      { href: "/apply", label: "Apply" },
    ],
  },
  {
    title: "Members",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/legal/privacy", label: "Privacy" },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/security", label: "Security" },
      { href: "/legal/membership-terms", label: "Membership terms" },
      { href: "/legal/payment-authorization", label: "Payment authorization" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-bone-300">
      <div className="page-gutter content-max pt-24 pb-10 sm:pt-32">
        <div className="grid gap-16 md:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <p className="font-display text-headline font-light text-bone-100">Consider it handled.</p>
            <p className="mt-4 text-body-sm text-bone-400">
              A private membership, by application. Opening first in Miami &amp; South Florida.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <p className="text-label text-bone-500">{col.title}</p>
                <ul className="mt-5 grid gap-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-body-sm text-bone-300 transition-colors hover:text-bone-50">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-24 sm:mt-32" aria-hidden>
          <BiluxrWordmark weight="whisper" className="h-auto w-full text-bone-100/[0.14]" />
        </div>
        <div className="mt-10 flex flex-col gap-3 text-caption text-bone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Biluxr. All rights reserved.</p>
          <p>Services are arranged with independent providers under their own terms.</p>
        </div>
      </div>
    </footer>
  );
}
