/* ==========================================================================
   fruitSwitch.js — "Peach / Nectarine / Both" sliding switch
   --------------------------------------------------------------------------
   Lives in #comparison, above the comparison table. Selecting a fruit
   highlights its column in the table and dims the other one, and applies the
   same emphasis to the matching bars in #nutrition.

   How it works
     - The whole selection state lives in ONE place: the data-fruit attribute
       on <html> ("peach" | "nectarine" | "both"). All the styling is done in
       CSS through selectors such as `html.js[data-fruit='peach'] …`, so this
       module only has to flip that attribute and keep the buttons and the
       live region in sync.
     - The buttons are real <button> elements, so they are keyboard operable
       and announced correctly with no extra code.
     - The sliding thumb position is driven by the data-fruit attribute on <html>.
     - Arrow keys (Left/Right) navigate between options.
     - If the markup is missing the module returns quietly: progressive
       enhancement means a missing feature is never an error.
   ========================================================================== */

/** Caption shown in the aria-live region for each selection. */
const CAPTIONS = {
  peach: 'Peach: covered in tiny hairs, so the skin feels fuzzy.',
  nectarine: 'Nectarine: no fuzz, so the skin is smooth and shiny.',
  both: 'Same species, one small gene of difference.',
};

/** Order of fruits for arrow-key navigation. */
const FRUIT_ORDER = ['peach', 'nectarine', 'both'];

/** Fallback used when a button carries an unexpected data-fruit value. */
const DEFAULT_FRUIT = 'both';

/**
 * Tags every nutrition bar with the fruit it belongs to.
 * The fruit is taken from the existing fill modifier class
 * (.bar__fill--peach / --nectarine) instead of the visible label text, so the
 * markup does not need an extra attribute.
 * @param {HTMLElement[]} bars
 */
function labelBars(bars) {
  for (const bar of bars) {
    const fill = bar.querySelector('.bar__fill');

    if (!fill) {
      continue;
    }

    bar.dataset.fruit = fill.classList.contains('bar__fill--nectarine')
      ? 'nectarine'
      : 'peach';
  }
}

/**
 * Initialises the fruit switch.
 * @returns {{select: (fruit: string) => void}|null} null when the markup is absent
 */
export function initFruitSwitch() {
  const root = document.querySelector('#comparison .fruit-switch');

  if (!root) {
    return null;
  }

  const buttons = Array.from(root.querySelectorAll('.fruit-switch__btn'));
  const caption = root.querySelector('.fruit-switch__caption');

  if (buttons.length === 0) {
    return null;
  }

  labelBars(Array.from(document.querySelectorAll('#nutrition .bar')));

  /**
   * Applies a selection: state attribute, button states and live-region text.
   * @param {string} fruit
   */
  function select(fruit) {
    const next = Object.hasOwn(CAPTIONS, fruit) ? fruit : DEFAULT_FRUIT;

    document.documentElement.dataset.fruit = next;

    for (const button of buttons) {
      const isActive = button.dataset.fruit === next;

      button.setAttribute('aria-pressed', String(isActive))
      button.classList.toggle('is-active', isActive);
    }

    if (caption) {
      caption.textContent = CAPTIONS[next];
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      select(button.dataset.fruit);
    });

    // Arrow key navigation within the switch
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = FRUIT_ORDER.indexOf(button.dataset.fruit);
        if (currentIndex === -1) return;
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        const nextIndex = (currentIndex + direction + FRUIT_ORDER.length) % FRUIT_ORDER.length;
        select(FRUIT_ORDER[nextIndex]);
        // Focus the newly selected button
        const nextButton = buttons.find(b => b.dataset.fruit === FRUIT_ORDER[nextIndex]);
        nextButton?.focus();
      }
    });
  }

  // Apply the markup default ("Both") so state, buttons and caption agree.
  select(DEFAULT_FRUIT);

  return { select };
}
