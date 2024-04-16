import { WordTimeline } from './Constants';
import { LineArgs } from './Line';
import { Lyric, LyricArgs } from './Lyric';
import { ParagraphArgs } from './Paragraph';

const isElementNode = (n: Node) => Node.ELEMENT_NODE === n.nodeType;

const confirmTag = (t: Element['tagName']) => {
  const tagName = t.toLowerCase();
  return (n: Element) => {
    return n.nodeName.toLowerCase() === tagName;
  };
};

function parseTime(t: string): number {
  if (t === '') {
    return 0;
  }
  if (t.endsWith('s')) {
    return Number(t.slice(0, -1));
  }
  return Number(t.split(':').reduce((acc, time) => 60 * acc + Number(time), 0));
}

const getTime = (e: Element): { begin: number; end: number } => {
  return {
    begin: parseTime(e.getAttribute('begin') || ''),
    end: parseTime(e.getAttribute('end') || ''),
  };
};

const TIMING_TYPE = {
  Line: 'Line',
  Word: 'Word',
} as const;

export class TTMLParser {
  constructor() {}

  public parse(ttml: XMLDocument, resourceID: string): Lyric {
    const duration = parseTime(
      ttml.querySelector('body')?.getAttribute('dur') || ''
    );
    const timelines: LyricArgs['timelines'] = new Map();
    const paragraphs = ttml.querySelectorAll('div');

    paragraphs.forEach((paragraphElm, paragraphIndex) => {
      const { lineTimelines } = this.parseParagraphTimelines(paragraphElm);
      timelines.set(paragraphIndex + 1, lineTimelines);
    });

    return new Lyric({
      resourceID,
      duration,
      timelines,
    });
  }

  private parseParagraphTimelines(paragraphElm: HTMLDivElement): {
    lineTimelines: ParagraphArgs['timelines'];
  } {
    if (!isElementNode(paragraphElm) || !confirmTag('div')(paragraphElm)) {
      throw new Error('Invalid TTML format');
    }
    const lines = paragraphElm.querySelectorAll('p');
    const lineTimelines: ParagraphArgs['timelines'] = new Map();

    lines.forEach((lineElm, lineIndex) => {
      const { wordTimelines } = this.parseLineTimelines(lineElm);
      lineTimelines.set(lineIndex + 1, wordTimelines);
    });

    return {
      lineTimelines,
    };
  }

  private parseLineTimelines(lineElm: HTMLParagraphElement): {
    wordTimelines: LineArgs['timelines'];
  } {
    if (!isElementNode(lineElm) || !confirmTag('p')(lineElm)) {
      throw new Error('Invalid TTML format');
    }

    const wordTimelines: LineArgs['timelines'] = new Map();
    const { begin, end } = getTime(lineElm);

    const timingType =
      Array.from(lineElm.children)
        .filter(isElementNode)
        .filter(confirmTag('span')).length > 0
        ? TIMING_TYPE.Word
        : TIMING_TYPE.Line;

    if (timingType === TIMING_TYPE.Line) {
      if (lineElm.textContent === null) {
        return {
          wordTimelines,
        };
      }
      const texts = lineElm.textContent.split(' ');
      const durationByWord = (end - begin) / texts.length;

      texts.forEach((text, wordIndex) => {
        const position = wordIndex + 1;
        const wordTimeline: WordTimeline = {
          begin: begin + durationByWord * wordIndex,
          end: begin + durationByWord * position,
          text,
          hasWhitespace: wordIndex !== texts.length - 1,
        };
        wordTimelines.set(position, wordTimeline);
      });

      return {
        wordTimelines,
      };
    }

    lineElm.querySelectorAll('span').forEach((spanElm, wordIndex) => {
      const { begin, end } = getTime(spanElm);
      wordTimelines.set(wordIndex + 1, {
        begin,
        end,
        text: spanElm.textContent || '',
        hasWhitespace:
          spanElm.nextSibling !== null && spanElm.nextSibling.nodeType === 3, // There is a whitespace between the next span element
      });
    });

    return {
      wordTimelines,
    };
  }
}

export default TTMLParser;
