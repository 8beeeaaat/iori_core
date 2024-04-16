import * as char from './Char';
import * as constants from './Constants';
import * as line from './Line';
import * as lyric from './Lyric';
import * as paragraph from './Paragraph';
import * as ttmlParser from './Parser.TTMLParser';
import * as word from './Word';

export namespace Iori {
  export const Char = char.Char;
  export const Line = line.Line;
  export const Lyric = lyric.Lyric;
  export const Paragraph = paragraph.Paragraph;
  export const Word = word.Word;
  export const TTMLParser = ttmlParser.TTMLParser;
  export const Constants = constants; // Add a declaration statement for the Constants export.
}

export default Iori;
