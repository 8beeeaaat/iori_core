import {
  Char,
  Line,
  Lyric,
  LyricUpdateArgs,
  Paragraph,
  Word,
} from '@ioris/core';
import type { MetaFunction } from '@remix-run/node';
import { useEffect, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

const sampleLyric = new Lyric({
  resourceID: 'sample',
  duration: 60,
  timelines: [
    [
      [
        {
          begin: 3,
          end: 10,
          text: 'Hello,',
          hasWhitespace: true,
        },
        {
          begin: 10,
          end: 20,
          text: 'world!',
        },
      ],
      [
        {
          begin: 30,
          end: 32,
          text: 'This',
          hasWhitespace: true,
        },
        {
          begin: 32,
          end: 34,
          text: 'is',
          hasWhitespace: true,
        },
        {
          begin: 35,
          end: 36,
          text: 'a',
          hasWhitespace: true,
        },
        {
          begin: 36,
          end: 40,
          text: 'sample.',
        },
      ],
    ],
    [
      [
        {
          begin: 50,
          end: 52,
          text: 'Goodbye,',
          hasWhitespace: true,
        },
        {
          begin: 53,
          end: 55,
          text: 'world!',
        },
      ],
    ],
  ],
});

export default function Index() {
  const [lyric, setLyric] = useState<Lyric>();
  const [editingTimeline, setEditingTimeline] =
    useState<LyricUpdateArgs['timelines']>();
  const [updating, setUpdating] = useState(false);
  const [now, setNow] = useState(0);
  const [paragraphByPosition, setParagraphByPosition] = useState<
    Lyric['paragraphByPosition']
  >(new Map());

  // init lyric
  useEffect(() => {
    if (lyric) return;
    (async () => {
      const l = await sampleLyric.init();
      setLyric(l);
      setEditingTimeline(l.timelines());
    })();
  }, [lyric, sampleLyric]);

  // update lyric
  useEffect(() => {
    if (!lyric || !editingTimeline) return;

    const fetchData = async () => {
      try {
        setUpdating(true);

        const updated = await lyric.update({
          timelines: editingTimeline || [],
        });
        setLyric(updated);
        setParagraphByPosition(new Map(updated.paragraphByPosition));
        setUpdating(false);
      } catch (error) {
        console.error(error);
        setUpdating(false);
      }
    };

    fetchData();
  }, [lyric, editingTimeline]);

  if (!lyric) return <div>Loading...</div>;
  if (updating) return <div>Updating...</div>;

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        lineHeight: '1.8',
        display: 'grid',
        gap: '2rem',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <div>
        <h1>Editor</h1>
        <Editor
          lyric={lyric}
          editingTimeline={editingTimeline}
          setEditingTimeline={setEditingTimeline}
        />
      </div>

      <div>
        <h1>Preview</h1>

        <form
          style={{
            display: 'flex',
          }}
        >
          <input
            style={{
              flex: 1,
            }}
            type="range"
            name="timeline"
            min={0}
            max={lyric.duration}
            value={now}
            step={0.1}
            onChange={(e) => setNow(Number(e.target.value))}
          />
          <span
            style={{
              marginLeft: '1rem',
            }}
          >
            {Math.floor(now / 60)}:
            {Math.floor(now % 60)
              .toString()
              .padStart(2, '0')}
            .{((now % 1) * 100).toFixed(0).padStart(2, '0')}
          </span>
        </form>

        <Preview
          lyric={lyric}
          paragraphByPosition={paragraphByPosition}
          now={now}
          setNow={setNow}
        />
      </div>
    </main>
  );
}

function Editor(props: {
  lyric: Lyric;
  editingTimeline: LyricUpdateArgs['timelines'];
  setEditingTimeline: (timelines: LyricUpdateArgs['timelines']) => void;
}) {
  const { lyric, editingTimeline, setEditingTimeline } = props;

  return editingTimeline
    ? editingTimeline.map((paragraph, paragraphIndex) => (
      <fieldset
        key={paragraphIndex}
        style={{
          marginBottom: '2rem',
        }}
      >
        <legend>Paragraph {paragraphIndex + 1}</legend>
        {paragraph.map((line, lineIndex) => (
          <fieldset
            style={{
              marginTop: '1rem',
            }}
            key={`${paragraphIndex}-${lineIndex}`}
          >
            <legend>Line {lineIndex + 1}</legend>
            {line.map((word, wordIndex) => (
              <form
                key={`${paragraphIndex}-${lineIndex}-${wordIndex}`}
                style={{
                  display: 'grid',
                  gap: '0.25rem',
                  gridTemplateColumns: '4rem 1fr 4rem',
                  marginTop: '1rem',
                }}
              >
                <input
                  type="number"
                  min={0}
                  max={lyric.duration}
                  value={word.begin}
                  onChange={(e) => {
                    const newTimeline = [...editingTimeline];
                    newTimeline[paragraphIndex][lineIndex][wordIndex].begin =
                      Number(e.target.value);
                    setEditingTimeline(newTimeline);
                  }}
                />
                <input
                  key={word.wordID}
                  type="text"
                  value={word.text}
                  onChange={(e) => {
                    const newTimeline = [...editingTimeline];
                    newTimeline[paragraphIndex][lineIndex][wordIndex] = {
                      ...word,
                      text: e.target.value,
                    };
                    setEditingTimeline(newTimeline);
                  }}
                />
                <input
                  type="number"
                  min={0}
                  max={lyric.duration}
                  value={word.end}
                  onChange={(e) => {
                    const newTimeline = [...editingTimeline];
                    newTimeline[paragraphIndex][lineIndex][wordIndex].end =
                      Number(e.target.value);
                    setEditingTimeline(newTimeline);
                  }}
                />
              </form>
            ))}
          </fieldset>
        ))}
      </fieldset>
    ))
    : null;
}

function Preview(props: {
  lyric: Lyric;
  paragraphByPosition: Lyric['paragraphByPosition'];
  now: number;
  setNow: (now: number) => void;
}) {
  const { lyric, paragraphByPosition, now, setNow } = props;

  const [currentParagraph, setCurrentParagraph] = useState<Paragraph>();
  const [currentLine, setCurrentLine] = useState<Line>();
  const [currentWord, setCurrentWord] = useState<Word>();
  const [currentChar, setCurrentChar] = useState<Char>();

  useEffect(() => {
    if (!lyric) return;
    setCurrentParagraph(lyric.currentParagraph(now));
    setCurrentLine(lyric.currentLine(now));
    setCurrentWord(lyric.currentWord(now));
    setCurrentChar(lyric.currentChar(now));
  }, [lyric, now]);

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {paragraphByPosition &&
        Array.from(paragraphByPosition).map(([, paragraph]) => (
          <li
            style={{
              marginTop: '2rem',
              display: 'flex',
              opacity: currentParagraph?.id === paragraph.id ? 1 : 0.5,
            }}
            key={paragraph.id}
          >
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {Array.from(paragraph.lineByPosition).map(([, line]) => (
                <li
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    color: currentLine?.id === line.id ? 'red' : 'gray',
                    transition: '0.1s ease-in-out',
                  }}
                  key={line.id}
                >
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      perspective: 500,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {Array.from(line.wordByPosition).map(([, word]) => {
                      const isCurrentWord = currentWord?.id === word.id;
                      return (
                        <li
                          key={word.id}
                          style={{
                            transition: '0.1s ease-in-out',
                            display: 'inline-block',
                            cursor: 'pointer',
                            fontSize: '2rem',
                            transformStyle: 'preserve-3d',
                            transform: isCurrentWord
                              ? 'translateZ(100px)'
                              : 'translateZ(0px)',
                            opacity: isCurrentWord ? 1 : 0.5,
                            marginRight: word.timeline.hasWhitespace
                              ? '0.2rem'
                              : '',
                          }}
                          onClick={() => {
                            setNow(word.begin());
                          }}
                        >
                          {word.chars().map((char) => {
                            return (
                              <span
                                key={char.id}
                                style={{
                                  display: 'inline-block',
                                  opacity:
                                    currentChar?.id === char.id ? 1 : 0.5,
                                  filter:
                                    !isCurrentWord ||
                                      currentChar?.id === char.id
                                      ? 'blur(0)'
                                      : 'blur(1px)',
                                }}
                              >
                                {char.text}
                              </span>
                            );
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
    </ul>
  );
}
