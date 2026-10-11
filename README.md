# Peach vs. Nectarine

An interactive digital poster that compares peaches and nectarines, built as a
single-page static site. School assignment.

A single-page poster with **progressive enhancement**: the full content, the
photographs and the print layout work with JavaScript switched off, and the
interactions below are layered on top only when a script is running.

## Stack

- [Vite](https://vite.dev) as the build/dev server
- Vanilla JavaScript (ES modules) — no frameworks
- Plain CSS with custom properties (design tokens)
- Google Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) for
  headings, [Nunito](https://fonts.google.com/specimen/Nunito) for body

## Project structure

```text
peach-vs-nectarine/
├── index.html               # Semantic markup for all 7 poster sections
├── vite.config.js           # base: './' so dist/ works on GitHub Pages
├── public/
│   └── images/              # The four images (web reference + one AI-generated)
└── src/
    ├── main.js              # Entry point: adds html.js, renders credits, starts modules
    ├── credits.js           # Image credits data (file, author, licence, URL)
    ├── modules/
    │   ├── fruitSwitch.js   # Peach / Nectarine / Both segmented control
    │   ├── flipCards.js     # 3D flip cards in #fun-facts
    │   ├── nutritionBars.js # Count-up bars revealed on scroll
    │   └── timelineReveal.js# Staggered reveal of the #origin journey
    └── styles/
        ├── tokens.css       # Design tokens: colour, type, space, radius, shadow
        ├── base.css         # Reset + layout + components + interactive layer
        └── print.css        # A3 portrait print rules
```

## Poster sections

Each section is a card with a numbered badge and its own `id`, so it can be
linked to directly (`index.html#nutrition`) or targeted from JavaScript.

| # | `id`        | Heading                  |
|---|-------------|--------------------------|
| 1 | `hero`      | Peach vs. Nectarine      |
| 2 | `origin`    | Origin                   |
| 3 | `comparison`| Head to Head Comparison  |
| 4 | `nutrition` | Nutrition                |
| 5 | `cooking`   | In the Kitchen           |
| 6 | `fun-facts` | Fun Facts                |
| 7 | `sources`   | Sources                  |

## Getting started

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Vite prints the local address in the terminal — by default
<http://localhost:5173>.

### Other scripts

```bash
npm run build    # production build into dist/
npm run preview  # serve the built dist/ locally
```

## Printing

`src/styles/print.css` targets A3 portrait with zero page margin and forces
background colours to print, so the poster looks the same on paper as on
screen. Sections never split across pages, and anything with the `no-print`
class is excluded from the printout.

To print: open the page and use the browser's print dialog, choosing A3,
portrait orientation and margins set to *None*.

## Interactions

All behaviour is vanilla JavaScript in `src/modules/`, one module per feature,
each exporting a single `init…()` function. Every module returns quietly when
its markup is missing, and none of them are required to read the poster.

`main.js` adds the class `js` to `<html>` as its first job. **Every interactive
style in `base.css` is scoped under `html.js`**, so switching JavaScript off
leaves the static poster untouched: both faces of each fact card visible, all
bars at full width with their final numbers, and no controls on screen.

| Module | Section | What it does |
|---|---|---|
| `fruitSwitch.js` | `#comparison` | Three-button segmented control (Peach / Nectarine / Both). Highlights the chosen column of the comparison table and dims the other one, dims the other fruit's bars in `#nutrition`, and updates a caption in an `aria-live="polite"` region. State lives in one attribute: `data-fruit` on `<html>`. |
| `flipCards.js` | `#fun-facts` | Turns each card into a flip card: `role="button"`, `tabindex="0"`, `aria-pressed`, click / Enter / Space to flip, 600 ms `rotateY`. The hidden face uses `backface-visibility` plus `aria-hidden`, never `display: none`, and each card is sized to its taller face so the row stays even. |
| `nutritionBars.js` | `#nutrition` | On first scroll into view (`IntersectionObserver`, threshold 0.3, once): bars grow from 0 to `data-value / data-max` over 900 ms ease-out while the number counts up, staggered 100 ms per bar. `beforeprint` forces the final state. |
| `timelineReveal.js` | `#origin` | The four journey stops fade and slide in 150 ms apart when the section first appears. The animation targets each step's *children*, so the vertical guide line stays unbroken. |

### Accessibility and motion

- Controls are real `<button>` elements; cards get button semantics only once
  their behaviour is wired up, so nothing is announced as interactive when it
  is not.
- `:focus-visible` draws a focus ring in the existing `--color-focus-ring` token.
- `prefers-reduced-motion: reduce` swaps card faces instantly, drops the
  transitions, and shows the bars, counters and timeline in their final state.
- `print.css` resets every enhanced state, so the printed A3 sheet is always
  the static, fully readable poster.

## Deploying to GitHub Pages

`vite.config.js` sets `base: './'`, so the build uses relative asset paths and
works from a project subdirectory.

```bash
npm run build
```

Then push the contents of `dist/` to the `gh-pages` branch (or publish the folder
through GitHub Actions) and enable Pages for that branch.

## Notes

- Images are credited on the poster itself; see `src/credits.js` for authors
  and licences. The three fruit photographs are web images used for educational
  purposes, and the cooking scene is AI-generated.
- `index.html#origin` still holds an empty illustration placeholder frame.
- Tested with Vite 7, Chrome and Firefox; no runtime dependencies.
