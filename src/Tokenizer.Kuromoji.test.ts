import { IpadicFeatures, Tokenizer, builder } from 'kuromoji';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Paragraph } from './Paragraph';
import { LineArgsTokenizer } from './Tokenizer.Kuromoji';

const kuromojiBuilder = builder({
  dicPath: path.resolve(__dirname, '../node_modules/kuromoji/dict'),
});

const getTokenizer = (): Promise<Tokenizer<IpadicFeatures>> =>
  new Promise((resolve, reject) => {
    kuromojiBuilder.build((err, tokenizer) => {
      if (err) {
        reject(err);
      }
      resolve(tokenizer);
    });
  });

describe('Paragraph used Kuromoji Tokenizer', () => {
  let paragraph: Paragraph;

  beforeEach(async () => {
    const tokenizer = await getTokenizer();
    paragraph = new Paragraph({
      tokenizer: (lineArgs) =>
        LineArgsTokenizer({
          tokenizer,
          lineArgs,
        }),
      position: 1,
      timelines: new Map([
        [
          1,
          new Map([
            [
              1,
              {
                begin: 1,
                end: 5,
                text: 'あの花が咲いたのは、そこに種が落ちたからで',
              },
            ],
          ]),
        ],
        [
          2,
          new Map([
            [
              1,
              {
                begin: 6,
                end: 12,
                text: 'いずれにしても立ち去らなければならない彼女は傷つきすぎた',
              },
            ],
          ]),
        ],
        [
          3,
          new Map([
            [
              1,
              {
                begin: 14,
                end: 20,
                text: '開かないカーテン 割れたカップ流し台の腐乱したキャベツ',
              },
            ],
          ]),
        ],
        [
          4,
          new Map([
            [
              1,
              {
                begin: 20,
                end: 25,
                text: "Oh, I can't help falling in love with you",
              },
            ],
          ]),
        ],
      ]),
    });
  });

  it('should return the text of the line', () => {
    expect(paragraph.allLines()[0].text()).toBe(
      'あの花が\n咲いたのは、\nそこに\n種が落ちたからで'
    );
    expect(paragraph.allLines()[1].text()).toBe(
      'いずれにしても\n立ち去らなければならない\n彼女は傷つきすぎた'
    );
    expect(paragraph.allLines()[2].text()).toBe(
      '開かない\nカーテン\n割れた\nカップ\n流し台の\n腐乱した\nキャベツ'
    );
    expect(paragraph.allLines()[3].text()).toBe(
      "Oh,\nI can't help falling in love with you"
    );
  });

  it('should return Lines', () => {
    expect(paragraph.lineByPosition.size).toBe(4);
  });
});
