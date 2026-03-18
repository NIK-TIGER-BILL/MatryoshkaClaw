/**
 * Message formatting utilities for Max messenger
 * Max supports Markdown and HTML formatting in messages
 */

/**
 * Convert a plain text string for safe use in Max Markdown.
 * Escapes: * _ ` [ ] ( ) # + - . !
 */
export function escapeMaxMarkdown(text: string): string {
  return text.replace(/[*_`[\]()#+\-.!]/g, "\\$&");
}

/**
 * Split long text into chunks respecting Max's 4000-char message limit.
 * Prefers splitting at newlines, then spaces.
 */
export const MAX_MESSAGE_LENGTH = 4000;

export function chunkText(text: string, maxLen = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen * 0.5) {
      splitAt = remaining.lastIndexOf(" ", maxLen);
    }
    if (splitAt <= 0) {
      splitAt = maxLen;
    }
    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

/**
 * Build a simple inline keyboard attachment from button rows.
 * Each inner array is a row; each string is a button label/payload.
 */
export function buildInlineKeyboard(
  rows: Array<Array<{ text: string; payload: string }>>
) {
  return {
    type: "inline_keyboard" as const,
    payload: {
      buttons: rows.map((row) =>
        row.map((btn) => ({
          type: "callback" as const,
          text: btn.text,
          payload: btn.payload,
        }))
      ),
    },
  };
}
