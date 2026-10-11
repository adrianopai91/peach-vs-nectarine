/* ==========================================================================
   main.js — Application entry point
   --------------------------------------------------------------------------
   Vanilla JavaScript only: no frameworks, no external libraries.
   Vite bundles this file and injects it into the page as a module.

   Responsibilities
     - mark the document as scripted (`html.js`), which is what activates the
       interactive layer in base.css;
     - render the image credits from src/credits.js;
     - start one module per interaction, each of which quietly does nothing if
       its markup is not on the page.

   Every interaction is progressive: with JavaScript off, none of the modules
   below run, the `js` class is never added, and the poster keeps its static,
   fully readable form. print.css puts the same static state back on paper.
   ========================================================================== */

import credits from './credits.js';
import { initFruitSwitch } from './modules/fruitSwitch.js';
import { initFlipCards } from './modules/flipCards.js';
import { initNutritionBars } from './modules/nutritionBars.js';
import { initTimelineReveal } from './modules/timelineReveal.js';
import { initCardReveal } from './modules/cardReveal.js';
import { initFallingShapes } from './modules/fallingShapes.js';
import { initLightbox } from './modules/lightbox.js';

/** Marks the document as scripted; every interactive style is scoped to it. */
const JS_CLASS = 'js';

/**
 * Section ids that make up the poster, in reading order.
 * Keeping them in one array means later features (navigation, filtering,
 * "reveal the answer" games) can iterate over sections generically.
 */
const SECTION_IDS = [
  'hero',
  'origin',
  'comparison',
  'nutrition',
  'cooking',
  'fun-facts',
  'sources',
];

/**
 * Returns every section element, in the order defined above.
 * @returns {HTMLElement[]}
 */
function getPosterSections() {
  return SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
}

/**
 * Renders the image credits from src/credits.js and drops it into the
 * "Image credits" entry of the #sources section, replacing the
 * "(to be added)" placeholder.
 *
 * Each line reads: {file}: {author}, {license}, via {source}
 * with the source name linking to the file's page when a URL is provided.
 * The list is real content, so it is printed with the rest of the poster.
 * @returns {HTMLUListElement|null} the list that was inserted
 */
function renderCredits() {
  const placeholder = document.querySelector('#sources .credits-placeholder');

  if (!placeholder) {
    console.warn('[credits] Placeholder element not found in #sources.');
    return null;
  }

  const list = document.createElement('ul');
  list.className = 'credits-list';

  for (const { file, author, license, source, url } of credits) {
    const item = document.createElement('li');

    // Leading text, built with textContent so no data is ever parsed as HTML
    item.append(`${file}: ${author}, ${license}, via `);

    // Only a real http(s) address becomes a link; a placeholder stays plain text
    // so an unfinished entry can never produce a broken link.
    if (/^https?:\/\/\S+$/i.test(url ?? '')) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source;

      item.append(link);
    } else {
      item.append(source);
    }

    list.append(item);
  }

  placeholder.replaceWith(list);
  return list;
}

/**
 * Initialises the poster. This runs immediately (no DOMContentDelayed wait),
 * adds the `js` class to activate the interactive layer in base.css, and
 * starts all modules with try/catch safety nets.
 */
function init() {
  // 1. Mark the document as scripted — this MUST run first so base.css
  //    interactive rules (`.js` selectors, `.no-print` hiding, etc.) take effect.
  document.documentElement.classList.add(JS_CLASS);

  // 2. Get sections (must happen after js class is added, some modules depend on it)
  const sections = getPosterSections();

  if (sections.length !== SECTION_IDS.length) {
    console.warn(
      `[poster] Expected ${SECTION_IDS.length} sections, found ${sections.length}.`,
    );
  }

  // 3. Render image credits (replaces "(to be added)" placeholder)
  renderCredits();

  // 4. Initialise every module, one by one, wrapped in try/catch so one
  //    failing module never stops the rest of the poster from loading.
  //    Each module's init function is called and its result is stored,
    //    but errors are caught and logged without stopping the pipeline.
  
  // Fruit switch: Peach / Nectarine / Both segmented control
  try { window.fruitSwitchInit = initFruitSwitch(); } catch (e) { console.error('fruitSwitch', e); }

  // Flip cards: 3D flip cards in #fun-facts
  try { window.flipCardsInit = initFlipCards(); } catch (e) { console.error('flipCards', e); }

  // Nutrition bars: animated bars with final values
  try { window.nutritionBarsInit = initNutritionBars(); } catch (e) { console.error('nutritionBars', e); }

  // Timeline reveal: origin journey timeline
  try { window.timelineRevealInit = initTimelineReveal(); } catch (e) { console.error('timelineReveal', e); }

  // Card reveal: scroll/page turn reveal
  try { window.cardRevealInit = initCardReveal(); } catch (e) { console.error('cardReveal', e); }

  // Falling shapes: decorative emoji layers
  try { window.fallingShapesInit = initFallingShapes(); } catch (e) { console.error('fallingShapes', e); }

  // Lightbox: click-to-enlarge for hero and banner photos
  try { window.lightboxInit = initLightbox(); } catch (e) { console.error('lightbox', e); }

  console.info(
    `[poster] ${sections.length} sections ready: ${SECTION_IDS.join(', ')}`,
  );
  console.info(
    `[poster] interactions initialised: fruitSwitch, flipCards, nutritionBars, timelineReveal, cardReveal, fallingShapes, lightbox`,
  );
}

/** Run init immediately — no DOMContentDelayed dependency. */
init();
