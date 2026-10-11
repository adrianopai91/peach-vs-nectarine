/* ==========================================================================
   cardReveal.js — scroll "page turn" and "card flip" reveal
   --------------------------------------------------------------------------
   While the poster is scrolled, every section block tilts back around its top
   edge and settles flat (a page turn), and the cards inside it swing in around
   their vertical axis one after another (a card flip). Each group reveals once,
   the first time it reaches the viewport, and never hides again.

   Safety rules — content is never allowed to disappear because of this module:

     1. Nothing is hidden before IntersectionObserver has been confirmed to
        exist. The check happens first, so a browser without support (or a
        failed script) keeps the fully visible static poster.
     2. prefers-reduced-motion: reduce returns early without touching a class,
        and base.css section 13.3 forces everything visible as well.
     3. Printing cannot be caught mid-reveal: the animation lives inside
        `@media screen` in base.css, and print.css resets the same properties.

   Why the module adds the classes itself: the reveal classes stay out of the
   markup, so the HTML is identical whether or not this file ever runs. The
   same two class names also let the CSS scope the whole effect to `html.js`.

   Interaction with the click-to-flip fact cards: the reveal animates the
   individual `rotate` property while the click flip animates `transform`. The
   two compose, so neither overwrites the other. Once an element has finished
   animating its classes are removed again, which hands the cards back to the
   flip-card rules untouched (600 ms transform, no rotation).
   ========================================================================== */

/** Class put on a group before it is hidden. */
const WILL_REVEAL = 'will-reveal';
/** Class put on a group while it animates into view. */
const IS_REVEALED = 'is-revealed';
/** Card-specific pair of the same two names. */
const WILL_REVEAL_CARD = 'will-reveal-card';
const IS_REVEALED_CARD = 'is-revealed-card';

/** Delay added per card, in ms. */
const STAGGER_MS = 120;

/** Length of the card turn, in ms (kept in sync with base.css 13.2). */
const CARD_MS = 650;

/** Length of the page turn, in ms (kept in sync with base.css 13.1). */
const SECTION_MS = 700;

/** How much of a group must be visible before it reveals. */
const THRESHOLD = 0.25;

/**
 * The elements that flip in card by card. Kept in one place so the markup can
 * stay free of presentation details: the nutrition bars and the timeline keep
 * their own animations and are not part of this list.
 */
const CARD_SELECTOR = '.benefit, .cook-card, .fact-card, .compare, .bars__group';

/** True when the user asked for less motion. */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Initialises the scroll reveal.
 *
 * @returns {{groups: HTMLElement[], reveal: (group: HTMLElement) => void}|null}
 *   null when the reveal cannot run safely, which leaves the poster untouched.
 */
export function initCardReveal() {
  // 1. Support and preferences are checked before anything is hidden.
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    return null;
  }

  const groups = Array.from(document.querySelectorAll('.poster .section'));

  if (groups.length === 0) {
    return null;
  }

  /**
   * Reveals one group: the block settles flat, then its cards flip in with a
   * 120 ms stagger. Each element cleans up after itself once the animation is
   * over, so no transition-delay is left behind to delay the click-to-flip.
   * @param {HTMLElement} group
   */
  function reveal(group) {
    if (group.dataset.revealed === 'true') {
      return;
    }

    group.dataset.revealed = 'true';

    const cards = Array.from(group.querySelectorAll(`.${WILL_REVEAL_CARD}`));

    group.classList.add(IS_REVEALED);

    cards.forEach((card, index) => {
      const delay = index * STAGGER_MS;

      // The delay must be in place *before* the class flips, because the
      // transition picks its timing up from the new computed value.
      card.style.transitionDelay = `${delay}ms`;
      card.classList.add(IS_REVEALED_CARD);

      window.setTimeout(() => {
        card.style.transitionDelay = '';
        card.classList.remove(WILL_REVEAL_CARD, IS_REVEALED_CARD);
      }, delay + CARD_MS);
    });

    window.setTimeout(() => {
      group.classList.remove(WILL_REVEAL, IS_REVEALED);
    }, SECTION_MS);
  }

  // 2. Only now is anything hidden.
  for (const group of groups) {
    group.classList.add(WILL_REVEAL);

    for (const card of group.querySelectorAll(CARD_SELECTOR)) {
      card.classList.add(WILL_REVEAL_CARD);
    }
  }

  // 3. Anything already on screen at load reveals straight away, without
  //    waiting for a scroll event that may never come.
  for (const group of groups) {
    const box = group.getBoundingClientRect();

    if (box.top < window.innerHeight && box.bottom > 0) {
      reveal(group);
    }
  }

  // 4. The rest reveals the first time the group reaches the viewport. The
  //    negative bottom margin means "reveal a little later than the edge".
  const observer = new IntersectionObserver(
    (entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        self.unobserve(entry.target);
        reveal(entry.target);
      }
    },
    { threshold: THRESHOLD, rootMargin: '0px 0px -8% 0px' },
  );

  for (const group of groups) {
    if (group.dataset.revealed !== 'true') {
      observer.observe(group);
    }
  }

  return { groups, reveal };
}