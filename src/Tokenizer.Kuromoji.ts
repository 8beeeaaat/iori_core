import { IpadicFeatures, Tokenizer } from 'kuromoji';
import Line, { LineArgs } from './Line';
import { Word } from './Word';

export function LineArgsTokenizer(props: {
  tokenizer: Tokenizer<IpadicFeatures>;
  lineArgs: LineArgs;
}): LineArgs {
  const { tokenizer, lineArgs } = props;
  const originalLine = new Line(lineArgs);
  const wordByPosition = originalLine.wordByPosition;
  const originalLineText = originalLine.text();
  const tokens = tokenizer.tokenize(originalLineText);

  const tokensByWordPosition = tokens.reduce<
    Map<number, Map<number, { features: IpadicFeatures; word: Word }>>
  >((acc, features) => {
    const last = acc.get(acc.size);
    if (!last) {
      const word = wordByPosition.get(1);
      const newMap = new Map();
      newMap.set(1, {
        features,
        word,
      });
      acc.set(1, newMap);
      return acc;
    }

    const currentWordText = last.get(last.size)?.word.text() || '';
    const currentFeaturesText = last
      ? Array.from(last.values())
          .map((token) => token.features.surface_form)
          .join('')
      : '';

    if (currentWordText === currentFeaturesText) {
      const word = wordByPosition.get(acc.size + 1);
      const newMap = new Map();
      newMap.set(1, {
        features,
        word,
      });
      acc.set(acc.size + 1, newMap);
    } else {
      const word = wordByPosition.get(acc.size);
      if (word) {
        last.set(last.size + 1, {
          features,
          word,
        });
        acc.set(acc.size, last);
      }
    }

    return acc;
  }, new Map());

  return {
    ...lineArgs,
    timelines: convertTokensToTimelines(tokensByWordPosition),
  };
}

function convertTokensToTimelines(
  tokensByWordPosition: Map<
    number,
    Map<number, { features: IpadicFeatures; word: Word }>
  >
): LineArgs['timelines'] {
  return Array.from(tokensByWordPosition).reduce<LineArgs['timelines']>(
    (acc, [, tokens]) => {
      Array.from(tokens).forEach(([tokenPosition, { features, word }]) => {
        const durationByChar = word.durationByChar();
        const duration = durationByChar * features.surface_form.length;
        const begin =
          tokenPosition === 1 ? word.begin : acc.get(acc.size)?.end || 0;
        const lastTokenInWord = tokenPosition === tokens.size;
        const hasNewLine = needNewLine({
          features,
          afterFeatures: tokens.get(tokenPosition + 1)?.features,
          lastTokenInWord,
        });
        const hasWhitespace = needWhiteSpace({
          features,
          afterFeatures: tokens.get(tokenPosition + 1)?.features,
          lastTokenInWord,
        });

        acc.set(acc.size + 1, {
          begin,
          end: begin + duration,
          text: features.surface_form,
          hasNewLine,
          hasWhitespace,
        });
      });
      return acc;
    },
    new Map()
  );
}

type BrakeRuleInput = RegExp | [string, boolean?];

type BrakeRule = {
  current?: {
    surfaceForm?: BrakeRuleInput[];
    pos?: BrakeRuleInput[];
    detail1?: BrakeRuleInput[];
    conjugatedForm?: BrakeRuleInput[];
  };
  after?: {
    surfaceForm?: BrakeRuleInput[];
    pos?: BrakeRuleInput[];
    detail1?: BrakeRuleInput[];
    conjugatedForm?: BrakeRuleInput[];
  };
};

const regExpNotAlphabetOrNumber = new RegExp(/^(?!.*[a-zA-Z1-9'"`]).*$/);
const regExpPeriod = new RegExp(/^(.*[.,!?]).*$/);

const brakeRules: BrakeRule[] = [
  {
    current: {
      surfaceForm: [regExpNotAlphabetOrNumber, regExpPeriod],
    },
    after: {
      detail1: [['空白']],
    },
  },
  {
    current: {
      surfaceForm: [regExpPeriod],
    },
  },
  {
    current: {
      detail1: [['読点']],
    },
  },
  {
    current: {
      pos: [['名詞']],
      surfaceForm: [regExpNotAlphabetOrNumber],
    },
    after: {
      pos: [['名詞']],
      surfaceForm: [regExpNotAlphabetOrNumber],
    },
  },
  {
    current: {
      pos: [['助詞']],
      detail1: [['格助詞'], ['係助詞']],
    },
    after: {
      pos: [['動詞']],
      detail1: [['自立']],
      conjugatedForm: [['連用形', true]],
    },
  },
  {
    current: {
      pos: [['助詞']],
      detail1: [['格助詞'], ['連体化']],
    },
    after: {
      pos: [['名詞']],
    },
  },
  {
    current: {
      pos: [['助動詞']],
    },
    after: {
      pos: [['名詞']],
      detail1: [['非自立', true]],
    },
  },
  {
    current: { pos: [['形容詞']] },
    after: { pos: [['名詞']] },
  },
];

function isMatch(input: BrakeRuleInput, str: string): boolean {
  if (Array.isArray(input)) {
    return input[1] ? input[0] !== str : input[0] === str;
  }
  return input.test(str);
}

function needNewLine(props: {
  features: IpadicFeatures;
  afterFeatures: IpadicFeatures | undefined;
  lastTokenInWord: boolean;
}): boolean {
  if (props.lastTokenInWord) {
    return false;
  }

  return brakeRules.some((rule) => {
    if (rule.current && rule.after) {
      const currentSurfaceFormMatch = rule.current.surfaceForm
        ? rule.current.surfaceForm?.some((input) =>
            isMatch(input, props.features.surface_form)
          )
        : true;
      if (!currentSurfaceFormMatch) {
        return false;
      }
      const currentPosMatch = rule.current.pos
        ? rule.current.pos?.some((input) => isMatch(input, props.features.pos))
        : true;
      if (!currentPosMatch) {
        return false;
      }
      const currentDetail1Match = rule.current.detail1
        ? rule.current.detail1?.some((input) =>
            isMatch(input, props.features.pos_detail_1)
          )
        : true;
      if (!currentDetail1Match) {
        return false;
      }
      const currentConjugatedFormMatch = rule.current.conjugatedForm
        ? rule.current.conjugatedForm?.some((input) =>
            isMatch(input, props.features.conjugated_form)
          )
        : true;
      if (!currentConjugatedFormMatch) {
        return false;
      }
      const afterSurfaceFormMatch = rule.after.surfaceForm
        ? rule.after.surfaceForm?.some((input) =>
            isMatch(input, props.features.surface_form)
          )
        : true;
      if (!afterSurfaceFormMatch) {
        return false;
      }
      const afterPosMatch = rule.after.pos
        ? rule.after.pos?.some((input) =>
            isMatch(input, props.afterFeatures?.pos || '')
          )
        : true;
      if (!afterPosMatch) {
        return false;
      }
      const afterDetail1Match = rule.after.detail1
        ? rule.after.detail1?.some((input) =>
            isMatch(input, props.afterFeatures?.pos_detail_1 || '')
          )
        : true;
      if (!afterDetail1Match) {
        return false;
      }
      const afterConjugatedFormMatch = rule.after.conjugatedForm
        ? rule.after.conjugatedForm?.some((input) =>
            isMatch(input, props.afterFeatures?.conjugated_form || '')
          )
        : true;
      if (!afterConjugatedFormMatch) {
        return false;
      }

      return true;
    }
    if (rule.current) {
      const currentSurfaceFormMatch = rule.current.surfaceForm
        ? rule.current.surfaceForm?.some((input) =>
            isMatch(input, props.features.surface_form)
          )
        : true;
      if (!currentSurfaceFormMatch) {
        return false;
      }
      const currentPosMatch = rule.current.pos
        ? rule.current.pos?.some((reg) => isMatch(reg, props.features.pos))
        : true;
      if (!currentPosMatch) {
        return false;
      }
      const currentDetail1Match = rule.current.detail1
        ? rule.current.detail1?.some((reg) =>
            isMatch(reg, props.features.pos_detail_1)
          )
        : true;
      if (!currentDetail1Match) {
        return false;
      }
      const currentConjugatedFormMatch = rule.current.conjugatedForm
        ? rule.current.conjugatedForm?.some((reg) =>
            isMatch(reg, props.features.conjugated_form)
          )
        : true;
      if (!currentConjugatedFormMatch) {
        return false;
      }
      return true;
    }

    if (rule.after) {
      const afterSurfaceFormMatch = rule.after.surfaceForm
        ? rule.after.surfaceForm?.some((input) =>
            isMatch(input, props.features.surface_form)
          )
        : true;
      if (!afterSurfaceFormMatch) {
        return false;
      }
      const afterPosMatch = rule.after.pos
        ? rule.after.pos?.some((reg) =>
            isMatch(reg, props.afterFeatures?.pos || '')
          )
        : true;
      if (!afterPosMatch) {
        return false;
      }
      const afterDetail1Match = rule.after.detail1
        ? rule.after.detail1?.some((reg) =>
            isMatch(reg, props.afterFeatures?.pos_detail_1 || '')
          )
        : true;
      if (!afterDetail1Match) {
        return false;
      }
      const afterConjugatedFormMatch = rule.after.conjugatedForm
        ? rule.after.conjugatedForm?.some((input) =>
            isMatch(input, props.afterFeatures?.conjugated_form || '')
          )
        : true;
      if (!afterConjugatedFormMatch) {
        return false;
      }

      return true;
    }
    return false;
  });
}

function needWhiteSpace(props: {
  features: IpadicFeatures;
  afterFeatures: IpadicFeatures | undefined;
  lastTokenInWord: boolean;
}): boolean {
  if (props.lastTokenInWord) {
    return false;
  }
  return false;
}

export default LineArgsTokenizer;
