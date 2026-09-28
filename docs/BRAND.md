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

- **The world, as points of light**: a dotted map generated from Natural Earth
  land polygons (`scripts/gen-world-dots.mjs` → `public/geo/world-dots.svg`, one
  cacheable asset). Routes are drawn as lifted arcs that write themselves in;
  the member's home glows. Used for the hero horizon band, the journeys
  showcase and every journey's route header. It describes the member's world,
  never a claim about where Biluxr operates.

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

## Art direction & photography

Photograph _access_, not wealth cosplay: architecture, material, shadow,
movement, travel details, aerial geometry, transport interiors, night city
texture, quiet human moments. Never: champagne, supercars, jet-stair poses,
watches on steering wheels, staged penthouses, stock "success".

**Treatment.** Black and white only, deep blacks, soft highlights, visible
grain. On the page every photograph is darkened (`brightness ≈ 0.6`) and sits
under an ink gradient so type always reads.

**Library** (`public/images/`, generated for Biluxr with Runway, converted to
grayscale JPEG; illustrative, noted in the site footer):

| File          | Subject                                          | Used for                             |
| ------------- | ------------------------------------------------ | ------------------------------------ |
| `terrace.jpg` | Concrete villa terrace over the sea, blue hour   | Home hero                            |
| `window.jpg`  | Aircraft wing above cloud from a window seat     | Chapters (In transit), sign-in       |
| `suite.jpg`   | Hotel suite at first light, moving linen curtain | Chapters (Stays), Membership intro   |
| `table.jpg`   | A hand placing a name card by candlelight        | Chapters (Tables), Concierge intro   |
| `paris.jpg`   | Paris street after rain, one figure, umbrella    | Chapters (Evenings), Partners, Paris |
| `chalet.jpg`  | Snow-covered chalet at dusk, windows lit         | Chapters (Seasons), Aspen journeys   |

No legible real-world brands or signage: the Paris frame was cropped to remove
a shopfront name. Destination images are mapped by market slug in
`src/lib/design/destinations.ts` and are mood only — never a venue or booking.

## Motion & material

**Liquid layer** (`components/motion/`):

- **`ShaderCanvas`** — one WebGL fragment shader per canvas. Renders only while
  on screen and the tab is visible, caps DPR and frame rate, freezes time under
  reduced motion, handles context loss, and shows a CSS fallback until (or
  instead of) the first frame.
- **`LiquidSilk`** — dark cloth folding under a single lamp that leans toward
  the pointer (domain-warped fbm, lit via finite-difference normals). Tints:
  `sable` (warm), `pearl`, `tide` (blue hour). Half resolution, 30fps.
- **`BiluxrOrb`** — a pearl of slow liquid colour: breathes while idle, gathers
  and swirls as a member types (`activity`), turns faster while sending
  (`thinking`), and releases one ring when a request has gone (`sent`,
  `announce`). Always `aria-hidden`; it never implies someone is present.
  `OrbGlyph` is the CSS-only version for small sizes and fallback.
- **Liquid glass** (`.liquid-glass`, `.liquid-glass-strong`) — backdrop blur +
  saturation, a specular top edge, a gradient hairline rim, and a highlight
  that follows the mouse (`GlassPointer`, one document listener).

**Scroll** — `SmoothScroll` (Lenis) gives inertial wheel scrolling on the
public site only; touch, keyboard and reduced motion stay native. One shared
scroll driver (`useScrollProgress` / `ScrollScene`) writes `--progress` for:
the hero sinking and dimming beneath the page, `CinematicImage` wipes and
parallax, and the pinned **Chapters** sequence (five photographs crossfading
and settling as you scroll). `SplitLines` reveals headlines line by line out
of masks. Public-site navigations crossfade with React `<ViewTransition>`
(`page-swap`).

- **Reveal** (`components/motion/reveal.tsx`): sections rise 28px out of a soft
  blur as they enter the viewport. Content is visible without JavaScript (the
  hidden state is gated on an `html.js` class set before paint) and under
  reduced motion.
- **Light**: a slow specular shine crosses the hero's italic line once; the
  member greeting carries the same treatment. Member home has an ambient wash
  keyed to the member's local hour.
- **Tilt** (`components/motion/tilt.tsx`): the membership credential tilts under
  the pointer with a moving highlight — GPU transforms only, inert for touch and
  reduced motion.
- **Routes** draw in over 2.4s; the home marker pulses slowly. Floating product
  details drift on 9–12s cycles.
- Hover states nudge, never bounce. Reduced motion collapses all of it.

## Interaction

- **⌘K / Ctrl+K palette** everywhere signed in (`components/ui/command-palette.tsx`):
  Command searches open requests, members, applications and providers and
  lists actions; members jump to requests, journeys and sections. Combobox +
  active-descendant listbox; fully keyboard- and screen-reader-operable.
- **Command shortcuts**: `g` then `q m a p c n s` to jump between sections;
  `j`/`k` to move through queue rows, `Enter` to open.

## Sound

None. No autoplay, ever. See `docs/ARCHITECTURE.md` for the opt-in extension
point.
