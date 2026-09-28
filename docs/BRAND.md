# Biluxr — Brand & design system

> Biluxr should not look like a startup trying to convince people it is
> luxurious. It should look like Biluxr.

## Principles

1. **Composure over announcement.** The product never says "luxury",
   "exclusive" or "AI-powered". Quality is shown in spacing, type and restraint.
2. **Truth is a design material.** Status copy, empty states and unavailable
   states are written as carefully as headlines.
3. **One voice, two temperatures.** Dark ink for the product and moments of
   arrival; warm paper for editorial reading. Never a gradient hero.
4. **Hairlines, not boxes.** 1px lines at low opacity, generous negative space,
   few containers.

## Identity

- **Wordmark** (`BiluxrWordmark`): six geometric line letterforms drawn in SVG
  on a 20-unit cap height with open tracking. No font dependency; inherits
  `currentColor`. Weights: `whisper` (monumental footer use), `hairline`,
  `light` (default), `regular` (small sizes).
- **Mark** (`BiluxrMark`): the wordmark's B enclosed in one continuous circle —
  _one relationship, held_. Used for favicon (`src/app/icon.svg`), app chrome
  and empty states.
- **Lockup** (`BiluxrLogo`): mark + wordmark.
- **Signature motif**: a single hairline circle drawn in at horizon scale (home
  hero, page intros, membership credential, OG image). It is the mark's
  enclosure, enlarged — never a globe, never 3D.

## Tokens (`src/app/globals.css`)

| Group        | Tokens                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color        | `ink-950…500` (dark surfaces), `bone-50…600` (text on dark), `paper-50…400` (editorial light), `sable-300…600` (single restrained accent, used sparingly), `status-{moss,tide,amber,clay,mist}` (desaturated) |
| Type         | `font-display` Newsreader (light, optical sizing), `font-sans` Geist, `font-mono` Geist Mono; scale `micro caption body-sm body lede title headline display monument` (fluid `clamp()` for the top three)     |
| Radius       | `hair xs sm md lg xl card sheet` — restrained; pills only for dots and toggles                                                                                                                                |
| Shadow       | `hairline lift float paper`                                                                                                                                                                                   |
| Blur / glass | `--blur-glass`, `--glass-fill(-strong)`, `--glass-edge`, `.glass` utility (used only for floating chrome: sticky header, mobile nav)                                                                          |
| Border       | `--line-subtle`, `--line`, `--line-strong`, `--line-paper(-strong)`                                                                                                                                           |
| Motion       | `--duration-{instant,quick,base,slow,deliberate}`, `--ease-{considered,settle,exit}`, keyframes `rise fade sheet draw breathe`; all collapse under `prefers-reduced-motion`                                   |
| Z-index      | `base raised sticky nav overlay sheet toast banner`                                                                                                                                                           |
| Safe areas   | `--safe-{top,bottom,left,right}`, `.pb-safe`, `.pt-safe`                                                                                                                                                      |
| Layout       | `--gutter` (fluid), `--measure`, `--content-max`, `--nav-height`, `--mobile-nav-height`                                                                                                                       |
| Density      | `--density`; Command sets `data-density="compact"` and uses `dense` controls                                                                                                                                  |

`src/lib/design/tokens.ts` mirrors the JS-relevant values; a unit test keeps
them in sync with the CSS.

**Contrast.** Every text token used for readable copy meets WCAG AA (4.5:1) on
the surfaces it is used on; axe runs on every page in CI.

## Components

| Component                                                                                             | Purpose                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `BiluxrLogo`, `BiluxrMark`, `BiluxrWordmark`                                                          | Identity                                                                              |
| `Button`, `LinkButton`, `Arrow`                                                                       | `primary secondary ghost quiet danger` × `dark paper`; pending state with `aria-busy` |
| `Surface`, `GlassSurface`, `PaperSurface`                                                             | Elevation and material                                                                |
| `Modal`, `Sheet`                                                                                      | Native `<dialog>`; sheet is bottom on mobile, side on desktop                         |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `FormMessage`                                     | Labelled, error-linked controls (`aria-invalid`, `aria-describedby`); `dense` variant |
| `EditorialHeading`, `Eyebrow`, `Lede`, `Mono`                                                         | Typography                                                                            |
| `StatusPill`, `Tag`                                                                                   | Status is a dot and a word — never a filled pill, never colour alone                  |
| `Timeline`                                                                                            | Request history, journeys                                                             |
| `ConciergeAvatar`                                                                                     | Initials only; no photographs, no presence dot                                        |
| `EmptyState`, `UnavailableState`                                                                      | Honest absence                                                                        |
| `CommandComposer`                                                                                     | The member's primary instrument                                                       |
| `RequestCard`, `JourneyCard`, `OptionCard` (quote), `MembershipCard` (credential), access offer cards | Product objects                                                                       |
| `MemberRail`, `MobileNav`, `CommandNav`, `SiteHeader`                                                 | Navigation                                                                            |

## Copy system

**Voice:** short, intelligent, composed, warm. It already knows you. It does not
chase.

**Recurring lines** (used sparingly, never stacked):

- One relationship. Wherever life moves.
- Request anything. Biluxr coordinates the rest.
- Consider it handled.
- Private service, intelligently orchestrated.
- Your preferences. Your people. Your world. Remembered.

**Status vocabulary (member-facing):** Received · A question for you · In
motion · Options ready · Securing your choice · Confirmed · Underway ·
Completed · Cancelled. Staff see operational labels (New, Awaiting member,
Sourcing…).

**Empty states:** "Nothing in motion. When you need something, Biluxr is here." ·
"No journeys scheduled." · "New invitations will appear here."

**Banned in product copy:** elite, exclusive, billionaire, prestige, luxury,
revolutionary, next-generation, AI-powered, exclamation marks, emoji.

## Art direction (for future photography)

Photograph _access_, not wealth cosplay: architecture, material, shadow,
movement, travel details, aerial geometry, transport interiors, night city
texture, quiet human moments. Never: champagne, supercars, jet-stair poses,
watches on steering wheels, staged penthouses, stock "success". The current
build uses no photography by choice — type, line and space carry it.

## Motion

Entrances rise 14px and settle (`--ease-settle`, 520ms); the horizon circle
draws once over 2.6s; hover states nudge, never bounce. Nothing loops except a
slow 9s light "breath" behind the hero. Reduced motion collapses all of it.

## Sound

None. No autoplay, ever. See `docs/ARCHITECTURE.md` for the opt-in extension
point.
