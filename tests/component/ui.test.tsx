// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BiluxrLogo, BiluxrMark, BiluxrWordmark } from "@/components/brand/logo";
import { MembershipCard } from "@/components/member/membership-card";
import { ConciergeAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, UnavailableState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";
import { Timeline } from "@/components/ui/timeline";
import type { Membership } from "@/lib/domain/types";

afterEach(cleanup);

describe("brand", () => {
  it("wordmark and mark are accessible images named Biluxr", () => {
    render(
      <>
        <BiluxrWordmark />
        <BiluxrMark />
      </>,
    );
    expect(screen.getAllByRole("img", { name: "Biluxr" })).toHaveLength(2);
  });

  it("lockup hides the decorative mark from assistive tech", () => {
    const { container } = render(<BiluxrLogo />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "Biluxr" })).toHaveLength(1);
  });
});

describe("Button", () => {
  it("disables and announces busy while pending", () => {
    render(
      <Button pending pendingLabel="Sending…">
        Send
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Sending…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("Field", () => {
  it("associates label, error and invalid state", () => {
    render(
      <Field label="Email" htmlFor="email" error="Please enter a valid email address.">
        <Input id="email" invalid />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email address.");
  });
});

describe("status and states", () => {
  it("renders status as text, not colour alone", () => {
    render(<StatusPill tone="attention">Options ready</StatusPill>);
    expect(screen.getByText("Options ready")).toBeVisible();
  });

  it("empty states say what will appear", () => {
    render(
      <EmptyState title="Nothing in motion." body="When you need something, Biluxr is here." />,
    );
    expect(screen.getByText("Nothing in motion.")).toBeInTheDocument();
  });

  it("unavailable states are announced", () => {
    render(<UnavailableState body="Sign-in is not configured." />);
    expect(screen.getByRole("status")).toHaveTextContent("Sign-in is not configured.");
  });

  it("avatars are decorative (names are always written out)", () => {
    const { container } = render(<ConciergeAvatar initials="IM" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("timeline renders entries in order", () => {
    render(
      <Timeline
        entries={[
          { id: "1", title: "Received" },
          { id: "2", title: "In motion", state: "current" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["Received", "In motion"]);
  });
});

describe("MembershipCard", () => {
  const membership: Membership = {
    id: "m",
    memberId: "u",
    tierId: "t",
    status: "pending_activation",
    memberNumber: "0007",
    startedAt: null,
    renewsAt: null,
    relationshipOwnerId: null,
    isFounding: true,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("shows the member number and never claims activity before activation", () => {
    render(<MembershipCard name="Elena Voss" membership={membership} tierName="Membership" />);
    expect(screen.getByText("№ 0007")).toBeInTheDocument();
    expect(screen.getByText("Awaiting activation")).toBeInTheDocument();
    expect(screen.queryByText(/Since/)).not.toBeInTheDocument();
  });
});
