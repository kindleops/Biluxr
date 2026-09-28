import { BiluxrMark, BiluxrWordmark } from "@/components/brand/logo";
import { PLACES, WorldMap } from "@/components/geo/world-map";
import { PhoneFrame, ScreenFrame } from "@/components/motion/device";
import { Reveal } from "@/components/motion/reveal";
import { TiltSurface } from "@/components/motion/tilt";
import { EditorialHeading } from "@/components/ui/typography";

/**
 * Homepage product narrative. Every screen shown here is an illustration built
 * from the product's own design language; people and details are fictional.
 */

function Dot({ tone }: { tone: "amber" | "moss" | "tide" | "bone" }) {
  const c = {
    amber: "bg-status-amber",
    moss: "bg-status-moss",
    tide: "bg-status-tide",
    bone: "bg-bone-300",
  }[tone];
  return <span className={`inline-block size-1.5 rounded-full ${c}`} />;
}

/* -------------------------------------------------------------------------- */
/* The member app                                                              */
/* -------------------------------------------------------------------------- */

function PhoneHome() {
  return (
    <div className="flex h-full flex-col text-[10px] leading-snug">
      <div className="flex items-center justify-between px-6 pt-3.5 pb-2 font-medium text-bone-100">
        <span>9:41</span>
        <span className="flex items-center gap-1" aria-hidden>
          <span className="h-2 w-3.5 rounded-[2px] border border-bone-300/70" />
        </span>
      </div>
      <div className="flex items-center justify-between px-5 pt-4">
        <BiluxrMark decorative className="size-6 text-bone-100" />
        <span className="text-[9px] text-bone-400">Membership</span>
      </div>
      <div className="px-5 pt-6">
        <p className="text-[7.5px] tracking-[0.16em] text-bone-500 uppercase">
          Thursday, October 8
        </p>
        <p className="mt-2 font-display text-[26px] leading-[1.02] font-light text-bone-50">
          Good evening, <em className="text-bone-300">Elena.</em>
        </p>
      </div>
      <div className="mx-4 mt-5 rounded-[14px] bg-ink-850 p-3.5 shadow-[inset_0_0_0_1px_var(--line)]">
        <p className="text-[7px] tracking-[0.16em] text-bone-500 uppercase">What can we arrange?</p>
        <p className="mt-2 font-display text-[14px] leading-snug font-light text-bone-500">
          Paris next Thursday, four nights…
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
          <span className="text-[8px] text-bone-500">Time-sensitive</span>
          <span className="rounded-[5px] bg-bone-100 px-2 py-1 text-[8px] font-medium text-ink-950">
            Send
          </span>
        </div>
      </div>
      <p className="mt-5 px-5 text-[7px] tracking-[0.16em] text-bone-400 uppercase">Awaiting you</p>
      <div className="mx-4 mt-2 rounded-[12px] bg-ink-900 p-3 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
        <p className="flex items-center gap-1.5 text-[8px] font-medium text-status-amber">
          <Dot tone="amber" /> Options ready
        </p>
        <p className="mt-2 font-display text-[13px] text-bone-50">
          Dinner for six, guests from Zurich
        </p>
        <p className="mt-1 text-[8.5px] text-bone-400">2 options to review · held until noon</p>
      </div>
      <p className="mt-5 px-5 text-[7px] tracking-[0.16em] text-bone-400 uppercase">Ahead</p>
      <div className="relative mx-4 mt-2 overflow-hidden rounded-[12px] bg-ink-900 p-3 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
        <p className="text-[7px] tracking-[0.14em] text-bone-500 uppercase">October 15–19</p>
        <p className="mt-2.5 font-display text-[15px] text-bone-50">Paris, autumn</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[8px] text-status-moss">
          <Dot tone="moss" /> Confirmed
        </p>
      </div>
      <div className="mt-auto grid grid-cols-5 border-t border-white/[0.06] bg-ink-900/80 px-2 pt-2.5 pb-5 text-center text-[7px] text-bone-500">
        {["Home", "Concierge", "Journeys", "Access", "Profile"].map((l, i) => (
          <span key={l} className={i === 0 ? "text-bone-50" : undefined}>
            <span className="mx-auto mb-1 block size-3.5 rounded-[4px] border border-current opacity-80" />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section id="product" className="relative scroll-mt-(--nav-height) overflow-hidden bg-ink-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_75%_55%,rgb(143_160_182/0.08),transparent_70%)]"
      />
      <div className="page-gutter content-max relative grid gap-20 py-28 sm:py-40 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10">
        <div>
          <Reveal>
            <p className="text-label text-bone-500">The member app</p>
          </Reveal>
          <Reveal delay={80}>
            <EditorialHeading as="h2" size="display" className="mt-7 max-w-[13ch] text-bone-50">
              Your whole life, in one quiet place.
            </EditorialHeading>
          </Reveal>
          <ol className="mt-14 grid max-w-md gap-8">
            {[
              [
                "Say it once.",
                "Write the way you would to someone who knows you. A sentence is enough; we ask only what matters.",
              ],
              [
                "Choose, don't search.",
                "Two or three considered options, each with a reason, held while you decide.",
              ],
              [
                "Consider it handled.",
                "We confirm, coordinate and follow through — and remember how you like it.",
              ],
            ].map(([t, d], i) => (
              <Reveal
                as="li"
                key={t}
                delay={160 + i * 90}
                className="grid grid-cols-[2.5rem_1fr] border-t border-white/[0.08] pt-5"
              >
                <span className="font-display text-body text-bone-500 italic">
                  {["I", "II", "III"][i]}
                </span>
                <div>
                  <h3 className="font-display text-title font-light text-bone-100">{t}</h3>
                  <p className="mt-2 text-body-sm text-bone-400">{d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal className="relative mx-auto w-full max-w-[34rem]" distance={48}>
          <figure
            aria-label="Illustration of the Biluxr member app"
            className="relative flex justify-center py-6"
          >
            <div
              aria-hidden
              className="absolute top-1/2 left-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.06)]"
            />
            <div
              aria-hidden
              className="absolute top-1/2 left-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_1px_rgb(243_239_232/0.05)]"
            />
            <div aria-hidden>
              <PhoneFrame className="relative z-[2] w-[17rem] sm:w-[19rem]">
                <PhoneHome />
              </PhoneFrame>
            </div>

            <div
              aria-hidden
              className="float-slow absolute top-[47%] -left-2 z-[3] w-52 rounded-lg bg-ink-800/90 p-3.5 shadow-[inset_0_0_0_1px_var(--line),var(--shadow-float)] backdrop-blur-md max-sm:hidden sm:-left-12"
            >
              <p className="text-[9px] tracking-[0.16em] text-bone-500 uppercase">Option 1 of 2</p>
              <p className="mt-2 font-display text-[15px] leading-snug text-bone-50">
                The private salon
              </p>
              <p className="mt-1 text-[10px] text-bone-400">
                Walled room for six · Burgundy-deep cellar
              </p>
              <div className="mt-3 flex gap-1.5">
                <span className="rounded-[4px] bg-bone-100 px-2 py-1 text-[9px] font-medium text-ink-950">
                  Choose this
                </span>
                <span className="rounded-[4px] px-2 py-1 text-[9px] text-bone-300 shadow-[inset_0_0_0_1px_var(--line-strong)]">
                  Not this one
                </span>
              </div>
            </div>

            <div
              aria-hidden
              className="float-slower absolute right-0 bottom-[13%] z-[3] w-56 rounded-lg bg-ink-800/90 p-3.5 shadow-[inset_0_0_0_1px_var(--line),var(--shadow-float)] backdrop-blur-md sm:-right-8"
            >
              <p className="flex items-center gap-1.5 text-[10px] text-status-moss">
                <Dot tone="moss" /> Remembered
              </p>
              <p className="mt-2 text-[11px] leading-snug text-bone-200">
                Shellfish — severe. Always flag to the kitchen in advance.
              </p>
            </div>

            <div
              aria-hidden
              className="float-slower absolute top-[15%] -right-2 z-[3] hidden rounded-full bg-ink-800/80 px-3 py-1.5 text-[10px] text-bone-300 shadow-[inset_0_0_0_1px_var(--line)] backdrop-blur-md sm:block"
            >
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-status-tide align-middle" />
              Car at 5:15am · driver details tonight
            </div>
            <figcaption className="sr-only">
              A phone showing a member&apos;s home screen with a request composer, a dinner awaiting
              their choice, and an upcoming trip to Paris. Illustrative; fictional details.
            </figcaption>
          </figure>
          <p className="mt-6 text-center text-caption text-bone-600">
            Illustrative. Fictional member and details.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Journeys                                                                    */
/* -------------------------------------------------------------------------- */

const ITINERARY: [string, string, string, string][] = [
  ["Thu", "7:30 PM", "Flight", "MIA → CDG · seats 2A / 2F"],
  ["Fri", "9:40 AM", "Transfer", "Met at arrivals, name card"],
  ["Fri", "10:15 AM", "Stay", "Courtyard suite, high floor"],
  ["Sat", "7:30 PM", "Event", "Gallery opening · guest list"],
  ["Sat", "9:30 PM", "Dining", "Table for four, Le Marais"],
];

export function JourneysShowcase() {
  return (
    <section id="journeys" className="relative scroll-mt-(--nav-height) overflow-hidden bg-ink-900">
      <div className="page-gutter content-max relative py-28 sm:py-40">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <p className="text-label text-bone-500">Journeys</p>
            <EditorialHeading as="h2" size="display" className="mt-7 max-w-[12ch] text-bone-50">
              Every leg, held together.
            </EditorialHeading>
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-md text-lede text-bone-400 lg:ml-auto">
              Flights, cars, rooms, tables and the evening itself — gathered into one living
              itinerary, in the time zone where each moment happens.
            </p>
          </Reveal>
        </div>

        <Reveal className="relative mt-16 sm:mt-24" distance={40}>
          <div className="relative h-[36rem] overflow-hidden rounded-xl bg-ink-950 shadow-[inset_0_0_0_1px_var(--line-subtle)] md:h-[38rem]">
            <div
              aria-hidden
              className="pointer-events-none origin-[36%_18%] scale-[2.5] opacity-90 max-sm:mt-14 sm:origin-[30%_32%] sm:scale-[1.55]"
            >
              <WorldMap
                label="Route from Miami to Paris"
                routes={[[PLACES.miami, PLACES.paris]]}
                markers={[
                  { ...PLACES.miami, emphasis: false },
                  { ...PLACES.paris, emphasis: true },
                ]}
                dotOpacity={0.12}
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_40%,var(--color-ink-950)_85%)] max-md:bg-[linear-gradient(to_top,var(--color-ink-950)_40%,transparent_70%)]" />
            <div className="absolute right-4 bottom-4 left-4 md:top-6 md:right-6 md:bottom-auto md:left-auto md:w-[24rem]">
              <div className="glass h-full rounded-lg p-5 md:p-6">
                <div className="flex items-baseline justify-between">
                  <p className="text-label text-bone-500">October 15–19</p>
                  <p className="flex items-center gap-1.5 text-caption text-status-moss">
                    <Dot tone="moss" /> Confirmed
                  </p>
                </div>
                <p className="mt-3 font-display text-headline font-light text-bone-50">
                  Paris, autumn
                </p>
                <ol className="mt-5 grid gap-3 max-md:[&>li:nth-child(n+4)]:hidden">
                  {ITINERARY.map(([d, t, k, v]) => (
                    <li
                      key={t + v}
                      className="grid grid-cols-[2rem_4.5rem_1fr] gap-2 border-t border-white/[0.06] pt-3 text-body-sm"
                    >
                      <span className="text-bone-500">{d}</span>
                      <span className="font-mono text-caption text-bone-300 tabular-nums">{t}</span>
                      <span className="min-w-0">
                        <span className="block text-[0.625rem] tracking-[0.14em] text-bone-500 uppercase">
                          {k}
                        </span>
                        <span className="block truncate text-bone-100">{v}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <p className="mt-4 text-caption text-bone-600">
            Illustrative itinerary. Fictional details.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* The credential                                                              */
/* -------------------------------------------------------------------------- */

export function CredentialShowcase() {
  return (
    <section
      id="credential"
      className="grain relative scroll-mt-(--nav-height) overflow-hidden bg-ink-950"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 z-[1] size-[64rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(194_171_130/0.08),transparent)]"
      />
      <div className="page-gutter content-max relative z-[2] grid gap-16 py-28 sm:py-40 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <Reveal>
            <p className="text-label text-bone-500">Membership</p>
          </Reveal>
          <Reveal delay={80}>
            <EditorialHeading as="h2" size="display" className="mt-7 max-w-[12ch] text-bone-50">
              Numbered. Personal. <em className="text-bone-400">Yours.</em>
            </EditorialHeading>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-8 max-w-md text-lede text-bone-400">
              Every membership is numbered and held by a single person, with a single relationship
              behind it. Membership is by application, and deliberately small.
            </p>
          </Reveal>
        </div>
        <Reveal distance={40} className="mx-auto w-full max-w-xl">
          <TiltSurface className="w-full">
            <div className="grain relative aspect-[1.586] w-full overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#26262c_0%,#0e0e11_42%,#16161a_70%,#0b0b0d_100%)] p-7 text-bone-100 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1),inset_0_0_0_1px_rgb(255_255_255/0.07),0_60px_120px_-40px_rgb(0_0_0/0.95),0_30px_50px_-30px_rgb(0_0_0/0.9)] sm:p-9">
              <svg
                aria-hidden
                viewBox="0 0 400 252"
                className="pointer-events-none absolute inset-0 size-full"
                preserveAspectRatio="xMidYMid slice"
              >
                {[190, 150, 110, 70].map((r, i) => (
                  <circle
                    key={r}
                    cx="330"
                    cy="30"
                    r={r}
                    fill="none"
                    stroke={`rgb(243 239 232 / ${0.08 - i * 0.015})`}
                  />
                ))}
                <path
                  d="M0 200 C 120 180, 220 240, 400 190"
                  fill="none"
                  stroke="rgb(243 239 232 / 0.04)"
                />
              </svg>
              <div className="relative z-[2] flex h-full [transform:translateZ(40px)] flex-col justify-between">
                <div className="flex items-start justify-between">
                  <BiluxrWordmark weight="hairline" className="h-3.5 sm:h-4" />
                  <BiluxrMark decorative className="size-9 text-bone-300 sm:size-11" />
                </div>
                <div>
                  <p className="font-display text-[1.7rem] leading-tight font-light tracking-[-0.01em] sm:text-[2.2rem]">
                    Elena Voss
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4 text-[0.625rem] tracking-[0.18em] text-bone-400 uppercase sm:text-[0.6875rem]">
                    <span>Founding member</span>
                    <span className="font-mono tracking-[0.22em] text-bone-200">№ 0007</span>
                  </div>
                </div>
              </div>
            </div>
          </TiltSurface>
          <p className="mt-6 text-center text-caption text-bone-600">
            Illustrative credential. Fictional member.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Command — the team behind the member                                        */
/* -------------------------------------------------------------------------- */

const QUEUE = [
  ["Charter to Nassau, Saturday", "M. Hale", "New", "clay", "Reply in 9m", true],
  ["Chef's counter for two, London", "P. Anand", "New", "bone", "Reply in 2h", false],
  [
    "Dinner for six, guests from Zurich",
    "E. Voss",
    "Options presented",
    "amber",
    "Responded",
    false,
  ],
  ["Birthday gift for Sofia", "E. Voss", "Awaiting member", "amber", "Responded", false],
  ["Chalet and ski school, Aspen", "E. Voss", "Sourcing", "tide", "Responded", false],
] as const;

export function CommandShowcase() {
  return (
    <section id="command" className="relative scroll-mt-(--nav-height) overflow-hidden bg-ink-950">
      <div className="page-gutter content-max py-28 sm:py-40">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <p className="text-label text-bone-500">Biluxr Command</p>
            <EditorialHeading as="h2" size="display" className="mt-7 max-w-[14ch] text-bone-50">
              A team that never loses the thread.
            </EditorialHeading>
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-md text-lede text-bone-400 lg:ml-auto">
              Behind every member, a concierge team working from one system: every request,
              preference and promise in view, response times watched, and intelligence that drafts —
              while people decide.
            </p>
          </Reveal>
        </div>

        <Reveal className="relative mt-16 sm:mt-24" distance={56}>
          <div
            aria-hidden
            className="absolute -inset-x-10 -top-10 bottom-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,rgb(243_239_232/0.05),transparent)]"
          />
          <ScreenFrame className="relative mx-auto max-w-6xl">
            <div aria-hidden className="grid grid-cols-[11rem_1fr] text-[11px] max-md:grid-cols-1">
              <div className="border-r border-white/[0.06] p-4 max-md:hidden">
                <div className="flex items-center gap-2 text-bone-100">
                  <BiluxrMark decorative className="size-5" />
                  <span className="text-[8px] tracking-[0.3em] text-bone-500 uppercase">
                    Command
                  </span>
                </div>
                <div className="mt-6 grid gap-0.5">
                  {[
                    "Queue",
                    "Members",
                    "Applications",
                    "Providers",
                    "Founding cohort",
                    "Analytics",
                  ].map((l, i) => (
                    <span
                      key={l}
                      className={`flex justify-between rounded-[5px] px-2.5 py-1.5 ${i === 0 ? "bg-white/[0.07] text-bone-50" : "text-bone-400"}`}
                    >
                      {l}
                      {i === 0 && <span className="font-mono text-bone-400">2</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[20px] font-light text-bone-50">Request queue</p>
                  <span className="rounded-[5px] px-2 py-1 text-[10px] text-bone-500 shadow-[inset_0_0_0_1px_var(--line)]">
                    ⌘K
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--line-subtle)]">
                  {QUEUE.map(([title, member, status, tone, sla, urgent]) => (
                    <div
                      key={title}
                      className="grid grid-cols-[3px_1.6fr_0.7fr_1fr_0.8fr] items-center gap-3 border-t border-white/[0.05] py-2.5 pr-3 first:border-t-0 max-sm:grid-cols-[3px_1fr_auto]"
                    >
                      <span className={`h-6 ${urgent ? "bg-status-clay" : ""}`} />
                      <span className="truncate text-bone-50">{title}</span>
                      <span className="text-bone-400 max-sm:hidden">{member}</span>
                      <span className="flex items-center gap-1.5 text-bone-200">
                        <Dot
                          tone={
                            tone === "clay"
                              ? "amber"
                              : tone === "bone"
                                ? "bone"
                                : (tone as "amber" | "tide")
                          }
                        />{" "}
                        {status}
                      </span>
                      <span
                        className={`font-mono text-[10px] max-sm:hidden ${urgent ? "text-status-amber" : "text-bone-500"}`}
                      >
                        {sla}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[8px] bg-ink-900 p-3 shadow-[inset_0_0_0_1px_var(--line-subtle)]">
                    <p className="text-[8px] tracking-[0.16em] text-bone-500 uppercase">
                      Biluxr AI · awaiting review
                    </p>
                    <p className="mt-2 text-bone-200">
                      Four passengers, Nassau, out Saturday morning, back Sunday evening.
                    </p>
                    <p className="mt-1.5 text-bone-500">
                      Still unknown: departure airport · luggage
                    </p>
                  </div>
                  <div className="rounded-[8px] bg-status-amber/[0.04] p-3 shadow-[inset_0_0_0_1px_rgb(207_166_106/0.25)]">
                    <p className="text-[8px] tracking-[0.16em] text-status-amber uppercase">
                      Internal note
                    </p>
                    <p className="mt-2 text-bone-200">
                      Prefers the light jet from Opa-locka. Confirm catering is nut-free.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScreenFrame>
          <p className="mt-5 text-center text-caption text-bone-600">
            Illustrative. Fictional members and requests.
          </p>
        </Reveal>

        <div className="mt-20 grid gap-10 sm:grid-cols-3">
          {[
            [
              "Every promise in view",
              "A single queue ordered by what is due, with first-response targets per priority.",
            ],
            [
              "Internal, and never shown",
              "Notes the team keeps for itself stay out of the member's conversation — enforced at the database.",
            ],
            [
              "Intelligence, reviewed",
              "Requests are read, clarified and summarised by Biluxr's intelligence. A person approves every word a member sees.",
            ],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 90} className="border-t border-white/[0.08] pt-5">
              <h3 className="font-display text-title font-light text-bone-100">{t}</h3>
              <p className="mt-2 text-body-sm text-bone-400">{d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
