/**
 * credits.js — Image credits for the poster.
 *
 * Every photograph in /public/images needs an attribution line on the poster
 * itself, so the list is rendered in the "Image credits" entry of the #sources
 * section, populated by renderCredits() in main.js.
 *
 * The entries below describe the images honestly: the three fruit photographs
 * came from the web as reference material and the cooking scene is an
 * AI-generated image. All of them are used for educational purposes only, so
 * the author is left as "Unknown" where it is genuinely not known rather than
 * inventing a name.
 *
 * Fields
 *   file     name of the image inside /public/images
 *   author   photographer or uploader, as credited on the source site
 *   license  short licence name (Public domain / CC BY / CC BY-SA / …)
 *   source   where the image came from
 *   url      the page the image can be cited from (empty when there is none)
 *
 * Rendering rules (kept as they were):
 *   - the line reads "{file}: {author}, {license}, via {source}"
 *   - the source name is only turned into a link when `url` is a real
 *     http(s) URL, so an entry without a URL can never produce a broken link.
 *
 * Both a named and a default export are provided so either import style works:
 *   import credits from './credits.js';
 *   import { credits } from './credits.js';
 */

/** @type {{ file: string, author: string, license: string, source: string, url: string }[]} */
export const credits = [
  {
    file: 'hero-peach.jpg',
    author: 'Unknown',
    license: 'Educational use',
    source: 'Web image',
    url: '',
  },
  {
    file: 'hero-nectarine.jpg',
    author: 'Unknown',
    license: 'Educational use',
    source: 'Web image',
    url: '',
  },
  {
    file: 'comparison.jpg',
    author: 'Unknown',
    license: 'Educational use',
    source: 'Web image',
    url: '',
  },
  {
    file: 'cooking.jpg',
    author: 'AI-generated image',
    license: 'Educational use',
    source: 'AI image generator',
    url: '',
  },
];

export default credits;