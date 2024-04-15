import * as char from './entities/Char';
import * as line from './entities/Line';
import * as lyric from './entities/Lyric';
import * as paragraph from './entities/Paragraph';
import * as word from './entities/Word';

import * as ttmlParser from './lib/parser/ttml';

export namespace Iori {
  export const Char = char;
  export const Line = line;
  export const Lyric = lyric;
  export const Paragraph = paragraph;
  export const Word = word;
  export const TTMLParser = ttmlParser;
}
