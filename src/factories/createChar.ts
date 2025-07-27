import { CHAR_TYPES, type CharType } from "../Constants";
import type { CharData } from "../types";

export type CreateCharArgs = {
  wordID: string;
  position: number;
  text: string;
  begin: number;
  end: number;
};

function getCharType(text: string): CharType {
  if (/^\s+$/.test(text)) {
    return CHAR_TYPES.WHITESPACE;
  }
  if (/^[a-zA-Z]+$/.test(text)) {
    return CHAR_TYPES.ALPHABET;
  }
  if (/^[0-9]+$/.test(text)) {
    return CHAR_TYPES.NUMBER;
  }
  if (/^[\u4E00-\u9FFF]+$/.test(text)) {
    return CHAR_TYPES.KANJI;
  }
  if (/^[\u3040-\u309F]+$/.test(text)) {
    return CHAR_TYPES.HIRAGANA;
  }
  if (/^[\u30A0-\u30FF]+$/.test(text)) {
    return CHAR_TYPES.KATAKANA;
  }
  return CHAR_TYPES.OTHER;
}

export function createChar(args: CreateCharArgs): CharData {
  const id = `char-${crypto.randomUUID()}`;
  const type = getCharType(args.text);

  return Object.freeze({
    id,
    wordID: args.wordID,
    text: args.text,
    type,
    position: args.position,
    begin: args.begin,
    end: args.end,
  });
}
