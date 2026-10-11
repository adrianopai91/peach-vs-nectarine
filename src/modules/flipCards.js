/* ==========================================================================
   flipCards.js — 3D flip cards for #fun-facts
   --------------------------------------------------------------------------
   Without JavaScript each card simply stacks its front and back and shows
   both. With JavaScript every card becomes a button-like flip card that shows
   one face at a time and rotates 180° on click, Enter or Space.

   Accessibility notes
     - role="button", tabindex="0" and aria-pressed are added here rather than
       in the markup: a card is only announced as a button when it really
       behaves like one.
     - The hidden face is never display:none (that would break the 3D flip),
       so aria-hidden is toggled instead. Screen reader users therefore always
       read exactly one face, and both faces stay reachable by flipping.
     - The card keeps a min-height taken from its taller face, so all cards in
       the row stay the same height whichever face is showing.
   ========================================================================== */

/** Kept in sync with the transition duration in base.css (12.2). */
const RESIZE_DEBOUNCE_MS = 150;

/**
 * Trailing-edge debounce, used for the resize listener.
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Sets the CSS variable that gives every card the height of its taller face.
 *
 * Measurement needs the static (stacked) layout, so a temporary
 * `is-measuring` class puts both faces back into normal flow. All cards are
 * measured in one batch to avoid a layout thrash per card.
 * @param {HTMLElement[]} cards
 */
function syncCardHeights(cards) {
  for (const card of cards) {
    card.classList.add('is-measuring');
  }

  // One read pass, then one write pass: no interleaved layout work.
  const heights = cards.map((card) => card.getBoundingClientRect().height);

  cards.forEach((card, index) => {
    card.style.setProperty('--flip-min-height', `${heights[index]}px`);
    card.classList.remove('is-measuring');
  });
}

/**
 * Initialises the flip cards.
 * @returns {{cards: HTMLElement[], flip: (card: HTMLElement) => void}|null}
 */
export function initFlipCards() {
  const cards = Array.from(document.querySelectorAll('#fun-facts .fact-card'));

  if (cards.length === 0) {
    return null;
  }

  /**
   * Turns a card over and keeps its accessibility state in sync.
   * @param {HTMLElement} card
   * @param {boolean} flipped
   */
  function setFlipped(card, flipped) {
    const front = card.querySelector('.fact-card__front');
    const back = card.querySelector('.fact-card__back');

    card.classList.toggle('is-flipped', flipped);
    card.setAttribute('aria-pressed', String(flipped));

    // Only one face at a time in the accessibility tree.
    front?.setAttribute('aria-hidden', String(flipped));
    back?.setAttribute('aria-hidden', String(!flipped));
  }

  /**
   * Flips a card to the opposite side.
   * @param {HTMLElement} card
   */
  function flip(card) {
    setFlipped(card, !card.classList.contains('is-flipped'));
  }

  for (const card of cards) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');
  }

  for (const card of cards) {
    card.addEventListener('click', () => flip(card));

    card.addEventListener('keydown', (event) => {
      // Enter and Space activate a button; Space must not scroll the poster.
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        flip(card);
      }
    });
  }

  // Start every card on its front face.
  for (const card of cards) {
    setFlipped(card, false);
  }

  syncCardHeights(cards);

  // Re-measure when the column width changes (the taller face changes with it)
  // and once the web fonts are ready, since they alter text wrapping.
  window.addEventListener('resize', debounce(() => syncCardHeights(cards), RESIZE_DEBOUNCE_MS));

  document.fonts?.ready.then(() => syncCardHeights(cards));

  return { cards, flip };
}