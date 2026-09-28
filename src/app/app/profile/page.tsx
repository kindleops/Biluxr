import { removePersonAction, removePreferenceAction } from "@/app/app/actions";
import {
  AddPerson,
  AddPreference,
  DOMAIN_LABEL,
  ProfileDetailsForm,
} from "@/components/member/profile-forms";
import { MemberContainer, MemberPageHeader, SectionHeading } from "@/components/member/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireMember } from "@/lib/auth/session";
import { memberRepository } from "@/lib/data";
import { PREFERENCE_DOMAINS } from "@/lib/domain/types";
import { formatDateLong } from "@/lib/format";

export const metadata = { title: "Profile" };

function RemoveButton({
  id,
  action,
  label,
}: {
  id: string;
  action: (form: FormData) => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-caption text-bone-600 transition-colors hover:text-status-clay"
        aria-label={label}
      >
        Remove
      </button>
    </form>
  );
}

export default async function ProfilePage() {
  const identity = await requireMember();
  const repo = await memberRepository(identity);
  const { profile, preferences, people } = await repo.profile();
  const grouped = PREFERENCE_DOMAINS.map((d) => ({
    domain: d,
    items: preferences.filter((p) => p.domain === d),
  })).filter((g) => g.items.length);

  return (
    <MemberContainer>
      <MemberPageHeader eyebrow="Profile" title="Your world, remembered." />

      <section
        aria-labelledby="details"
        className="rounded-card bg-ink-900 p-6 shadow-[inset_0_0_0_1px_var(--line-subtle)] sm:p-8"
      >
        <h2 id="details" className="text-label mb-6 text-bone-400">
          Details
        </h2>
        <ProfileDetailsForm profile={profile} />
      </section>

      <section className="mt-14" aria-labelledby="preferences">
        <SectionHeading action={<AddPreference />}>
          <span id="preferences">Preferences</span>
        </SectionHeading>
        <p className="mb-5 text-body-sm text-bone-400">
          Everything your concierge knows about how you like things. Yours to see, change or remove.
        </p>
        {grouped.length === 0 ? (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState
              compact
              title="Nothing recorded yet."
              body="Tell us once — seats, rooms, tables, allergies — and we will carry it forward."
            />
          </div>
        ) : (
          <div className="grid gap-8">
            {grouped.map((g) => (
              <div key={g.domain}>
                <h3 className="mb-2 text-caption text-bone-500">{DOMAIN_LABEL[g.domain]}</h3>
                <ul className="grid gap-px overflow-hidden rounded-card bg-white/[0.05]">
                  {g.items.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start justify-between gap-6 bg-ink-900 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-body-sm text-bone-100">{p.label}</p>
                        <p className="mt-0.5 text-body-sm text-bone-400">{p.value}</p>
                        {p.source === "concierge" && (
                          <p className="mt-1.5 text-caption text-bone-600">
                            Noted by your concierge
                          </p>
                        )}
                      </div>
                      <RemoveButton
                        id={p.id}
                        action={removePreferenceAction}
                        label={`Remove ${p.label}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14" aria-labelledby="people">
        <SectionHeading action={<AddPerson />}>
          <span id="people">Your people</span>
        </SectionHeading>
        {people.length === 0 ? (
          <div className="rounded-card shadow-[inset_0_0_0_1px_var(--line-subtle)]">
            <EmptyState
              compact
              title="No one added yet."
              body="Family, assistants, the people you travel with — so we never have to ask twice."
            />
          </div>
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-card bg-white/[0.05]">
            {people.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-6 bg-ink-900 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-body-sm text-bone-100">
                    {p.name} <span className="text-bone-500">· {p.relationship}</span>
                  </p>
                  {p.notes && <p className="mt-0.5 text-body-sm text-bone-400">{p.notes}</p>}
                  {p.birthday && (
                    <p className="mt-1 text-caption text-bone-500">
                      Birthday {formatDateLong(p.birthday)}
                    </p>
                  )}
                </div>
                <RemoveButton id={p.id} action={removePersonAction} label={`Remove ${p.name}`} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 flex items-center justify-between border-t border-white/[0.06] pt-8 lg:hidden">
        <p className="text-body-sm text-bone-400">Signed in as {profile.email}</p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-body-sm text-bone-200 underline decoration-white/25 underline-offset-4"
          >
            Sign out
          </button>
        </form>
      </section>
    </MemberContainer>
  );
}
