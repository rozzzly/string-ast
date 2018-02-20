/**
 * @module string-ast/AnsiCodes
 * @author rozzzly<pclienau@gmail.com>
 * @license MIT
 * @overview Contains the so called "SGR parameters" (constant "magic numbers") for the ANSI escape sequences used to stylize text.
 *
 * ANSI escape format as according the the Wikipedia article.
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 */

/** Resets the text to the default style */
export const RESET: 0 = 0;

/** Sets the text to be bold */
export const WEIGHT_BOLD: 1 = 1;
/** Sets the text to be faint */
export const WEIGHT_FAINT: 2 = 2;
/** Sets the text to be normal (neither bold nor faint) */
export const WEIGHT_NORMAL: 22 = 22;
/** Same as `WEIGHT_NORMAL` but with very little support  */
export const WEIGHT_BOLD_OFF: 21 = 21;

/** Sets the text to be italic */
export const ITALIC_ON: 3 = 3;
/** Sets the text to NOT be italic */
export const ITALIC_OFF: 23 = 23;

/** Sets the text to be underlined */
export const UNDERLINED_ON: 4 = 4;
/** Sets the text to NOT be underlined */
export const UNDERLINED_OFF: 24 = 24;

/**  Sets the text to be inverted/inverse/"reverse video" (swap foreground and background color) */
export const INVERTED_ON: 7 = 7;
/**  Sets the text to NOT be inverted/inverse/"reverse video" (swap foreground and background color) */
export const INVERTED_OFF: 27 = 27;

/** Sets the text to be striked-out */
export const STRIKED_ON: 9 = 9;
/** Sets the text to NOT be striked-out */
export const STRIKED_OFF: 29 = 29;

/** Sets the foreground of the text to be the default color */
export const FG_DEFAULT: 39 = 39;
/** Sets the background of the text to be the default color (none) */
export const BG_DEFAULT: 49 = 49;
/** Signals following parameters will specify a custom foreground text color */
export const FG_CUSTOM: 38 = 38;
/** Signals following parameters will specify a custom background color */
export const BG_CUSTOM: 48 = 48;
/** Signals following parameter will specify an 8bit color */
export const COLOR_MODE_8BIT: 5 = 5;
/** Signals following parameters will specify an 24bit color */
export const COLOR_MODE_24BIT: 2 = 2;

/** Start of the foreground text color (3bit) range */
export const FG_START: 30 = 30;
/** End of the foreground text color (3bit) range */
export const FG_END: 37 = 37;
/** Start of the bright foreground text color (3bit) range */
export const FG_BRIGHT_START: 90 = 90;
/** End of the bright foreground text color (3bit) range */
export const FG_BRIGHT_END: 97 = 97;
/** Start of the background color (3bit) range */
export const BG_START: 40 = 40;
/** End of the background color (3bit) range */
export const BG_END: 47 = 47;
/** Start of the bright background color (3bit) range */
export const BG_BRIGHT_START: 100 = 100;
/** End of the bright background color (3bit) range */
export const BG_BRIGHT_END: 107 = 107;

export { Colors } from './AnsiColor';