/**
 * Squeezes an authored description down to a single printable line.
 *
 * Descriptions in the compendium are multi-paragraph and written for the screen
 * (`\n`-separated, often with a lead sentence followed by rules detail). The
 * printed sheet has one line per entry, so we take the opening sentence of the
 * first paragraph and cut it at a word boundary. The full text stays available
 * in the sheet appendix — see `features-to-implement/character-sheet-print-plan.md` §5.
 */

/**
 * Guards against degenerate cuts such as a leading list marker ("1. Pierwszy
 * krok"), which otherwise satisfies the sentence-end rule after two characters.
 */
const minimumSentenceLength = 12;

export const defaultSummaryLength = 90;

export function summarizeDescription(description: string | null | undefined, maxChars: number = defaultSummaryLength): string
{
  const paragraph = takeFirstParagraph(description);

  if (!paragraph) return '';

  return truncateAtWordBoundary(takeFirstSentence(paragraph), maxChars);
}

/** First non-empty paragraph, with internal whitespace collapsed to single spaces. */
function takeFirstParagraph(description: string | null | undefined): string
{
  if (!description) return '';

  const paragraphs = description
    .split(/\r?\n/)
    .map(paragraph => paragraph.replace(/\s+/g, ' ').trim())
    .filter(paragraph => paragraph.length > 0);

  return paragraphs[0] ?? '';
}

/**
 * A `.` only ends a sentence when what follows starts a new one — i.e. the text
 * runs out, or the next word is capitalised. Polish rules text is full of
 * abbreviations ("np.", "itp.", "m.in.", "tzn.") that are always followed by a
 * lowercase word, so this single rule replaces an abbreviation dictionary.
 */
const sentenceEndPattern = /[.!?](\s+(?=\p{Lu})|$)/u;

function takeFirstSentence(paragraph: string): string
{
  let searchFrom = 0;

  while (searchFrom < paragraph.length)
  {
    const relativeIndex = paragraph.slice(searchFrom).search(sentenceEndPattern);

    if (relativeIndex < 0) return paragraph;

    const sentenceEnd = searchFrom + relativeIndex + 1;

    if (sentenceEnd >= minimumSentenceLength) return paragraph.slice(0, sentenceEnd).trim();

    searchFrom = sentenceEnd;
  }

  return paragraph;
}

function truncateAtWordBoundary(text: string, maxChars: number): string
{
  if (maxChars <= 0) return '';
  if (text.length <= maxChars) return text;

  const clipped = text.slice(0, maxChars);
  const lastSpace = clipped.lastIndexOf(' ');
  const stem = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;

  return `${stem.replace(/[.,;:!?]$/, '')}…`;
}
