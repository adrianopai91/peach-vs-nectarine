/* ==========================================================================
   nutritionBars.js — animated nutrition bars for #nutrition
   --------------------------------------------------------------------------
   The bars are static in the markup: every .bar__fill already carries its
   target width in an inline --bar-width custom property plus data-value /
   data-max for the number. With JavaScript, the section animates once when it
   scrolls into view:

     - each fill grows from 0 to value/max * 100 % over 900 ms (ease-out)
     - the number counts up over the same 900 ms
     - the eight bars are staggered by 100 ms

   Progressive enhancement guarantees
     - The counter text is only rewritten when the animation starts, so a page
       that is printed (or never scrolled) keeps the final values in the DOM.
     - window.onbeforeprint forces every bar to its final state, which covers
       printing in the middle of the animation.
     - With prefers-reduced-motion the bars and counters jump straight to
       their final values.
   ========================================================================== */

/** Duration of one bar animation, in ms (kept in sync with base.css 12.3). */
const DURATION_MS = 900;

/** Delay added per bar, in ms. */
const STAGGER_MS = 100;

/** Matches "39 kcal", "6.6 mg", "1.5 g" -> number, decimals and unit. */
const VALUE_PATTERN = /^(\d+(?:[.,]\d+)?)(\D*)$/;

/** True when the user asked for less motion. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Initialises the nutrition bars.
 * @returns {{bars: HTMLElement[], showAll: () => void}|null}
 */
export function initNutritionBars() {
  const bars = Array.from(document.querySelectorAll('#nutrition .bar'));

  if (bars.length === 0) {
    return null;
  }

  /**
   * Target width of a fill, as a percentage, taken from data-value / data-max.
   * @param {HTMLElement} fill
   * @returns {number}
   */
  function targetPercent(fill) {
    const value = Number.parseFloat(fill.dataset.value);
    const max = Number.parseFloat(fill.dataset.max);

    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
      return 0;
    }

    return (value / max) * 100;
  }

  /**
   * Reads the visible label ("6.6 mg") and splits it into the number, how many
   * decimals it shows and its unit, so the counter can reproduce it exactly.
   * @param {string} text
   * @returns {{number: number, decimals: number, unit: string}|null}
   */
  function parseValue(text) {
    const match = VALUE_PATTERN.exec(text.trim());

    if (!match) {
      return null;
    }

    const [, digits, unit] = match;
    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;

    return { number: Number.parseFloat(digits), decimals, unit };
  }

  /**
   * Puts one bar in its final state: full width and final number.
   * @param {HTMLElement} bar
   */
  function showFinal(bar) {
    const fill = bar.querySelector('.bar__fill');
    const value = bar.querySelector('.bar__value');

    if (fill) {
      fill.style.width = `${targetPercent(fill)}%`;
    }

    // Restore the exact original text captured on init.
    if (value && value.dataset.finalText) {
      value.textContent = value.dataset.finalText;
    }
  }

  /** Puts every bar in its final state. */
  function showAll() {
    for (const bar of bars) {
      showFinal(bar);
    }
  }

  /**
   * Animates one bar: width grows while the number counts up.
   * @param {HTMLElement} bar
   * @param {number} index position in the list, used for the stagger
   */
  function animateBar(bar, index) {
    const fill = bar.querySelector('.bar__fill');
    const value = bar.querySelector('.bar__value');

    if (!fill) {
      return;
    }

    const percent = targetPercent(fill);
    const finalText = value?.dataset.finalText ?? '';
    const parsed = parseValue(finalText);

    // Width transition is CSS; only the delay is set from here.
    fill.style.transitionDelay = `${index * STAGGER_MS}ms`;

    if (!value || !parsed) {
      // Nothing to count up to: let CSS animate the width alone.
      fill.style.width = `${percent}%`;
      return;
    }

    const start = performance.now() + index * STAGGER_MS;

    /** Draws one frame of the count-up. */
    function frame(now) {
      const progress = (now - start) / DURATION_MS;

      // Still waiting for this bar's stagger delay.
      if (progress < 0) {
        requestAnimationFrame(frame);
        return;
      }

      const clamped = Math.min(progress, 1);
      // ease-out cubic, matching the CSS ease-out on the width
      const eased = 1 - (1 - clamped) ** 3;

      fill.style.width = `${percent * eased}%`;
      value.textContent = `${(parsed.number * eased).toFixed(parsed.decimals)}${parsed.unit}`;

      if (clamped < 1) {
        requestAnimationFrame(frame);
        return;
      }

      // Land exactly on the final values (no rounding drift).
      fill.style.width = `${percent}%`;
      value.textContent = finalText;
    }

    requestAnimationFrame(frame);
  }

  // Remember the exact label of every bar before touching it.
  for (const bar of bars) {
    const value = bar.querySelector('.bar__value');

    if (value) {
      value.dataset.finalText = value.textContent.trim();
    }
  }

  // No animation support, or the user prefers less motion: final state only.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    showAll();
    return { bars, showAll };
  }

  // Animate once, the first time the nutrition section is a third visible.
  const section = document.getElementById('nutrition');

  if (!section) {
    showAll();
    return { bars, showAll };
  }

  const observer = new IntersectionObserver(
    (entries, self) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      self.disconnect();
      bars.forEach(animateBar);
    },
    { threshold: 0.3 },
  );

  observer.observe(section);

  // Printing mid-animation (or without ever scrolling) must show final values.
  window.addEventListener('beforeprint', showAll);

  return { bars, showAll };
}