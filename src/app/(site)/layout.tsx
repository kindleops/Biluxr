import { ViewTransition } from "react";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SmoothScroll />
      <SiteHeader />
      <ViewTransition update="page-swap" default="none">
        <main id="main">{children}</main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}
