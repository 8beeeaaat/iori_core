import { LineArgs } from '../../entities/Line';
import {
  Lyric,
  LyricArgs,
  TIMING_TYPE,
  TimingType,
} from '../../entities/Lyric';
import { ParagraphArgs } from '../../entities/Paragraph';
import { WordTimeline } from '../../entities/Word';

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

export class TTMLParser {
  constructor() {}

  public parse(ttml: XMLDocument, resourceID: string): Lyric {
    const duration = parseTime(
      ttml.querySelector('body')?.getAttribute('dur') || ''
    );
    const timelines: LyricArgs['timelines'] = new Map();
    const paragraphs = ttml.querySelectorAll('div');
    let retTimingType: TimingType = TIMING_TYPE.Line;

    paragraphs.forEach((paragraphElm, paragraphIndex) => {
      const { lineTimelines, timingType } =
        this.parseParagraphTimelines(paragraphElm);
      retTimingType = timingType;
      timelines.set(paragraphIndex + 1, lineTimelines);
    });

    return new Lyric({
      resourceID,
      duration,
      timingType: retTimingType,
      timelines,
    });
  }

  private parseParagraphTimelines(paragraphElm: HTMLDivElement): {
    lineTimelines: ParagraphArgs['timelines'];
    timingType: TimingType;
  } {
    if (!isElementNode(paragraphElm) || !confirmTag('div')(paragraphElm)) {
      throw new Error('Invalid TTML format');
    }
    const lines = paragraphElm.querySelectorAll('p');
    const lineTimelines: ParagraphArgs['timelines'] = new Map();
    let retTimingType: TimingType = TIMING_TYPE.Line;

    lines.forEach((lineElm, lineIndex) => {
      const { wordTimelines, timingType } = this.parseLineTimelines(lineElm);
      retTimingType = timingType;
      lineTimelines.set(lineIndex + 1, wordTimelines);
    });

    return {
      lineTimelines,
      timingType: retTimingType,
    };
  }

  private parseLineTimelines(lineElm: HTMLParagraphElement): {
    wordTimelines: LineArgs['timelines'];
    timingType: TimingType;
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
          timingType,
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
        timingType,
      };
    } else {
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
        timingType,
      };
    }
  }
}
