import { z } from "zod";

/** Demo personas. Safe to import from client components (no fixture data). */
export const DEMO_PERSONA_KEYS = ["member", "concierge", "admin"] as const;
export type DemoPersona = (typeof DEMO_PERSONA_KEYS)[number];
export const demoPersonaSchema = z.enum(DEMO_PERSONA_KEYS);

export const DEMO_PERSONAS: Record<
  DemoPersona,
  { id: string; label: string; name: string; description: string }
> = {
  member: {
    id: "0b7e1c2a-1f4d-4c8e-9a51-6d2f0e3a7b01",
    label: "Member",
    name: "Elena Voss",
    description: "Founding member, Miami. Four requests, two journeys.",
  },
  concierge: {
    id: "5c3a9e7d-2b6f-4a1c-8e0d-7f4b1a2c3d02",
    label: "Concierge",
    name: "Isabel Moreau",
    description: "Relationship lead. Works the request queue in Command.",
  },
  admin: {
    id: "9d1f3b5a-7c2e-4e6d-b8a0-1c3e5f7a9b03",
    label: "Administrator",
    name: "Rhea Linden",
    description: "Operations. Configuration, cohort, analytics.",
  },
};
