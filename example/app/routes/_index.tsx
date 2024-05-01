import { Lyric, LyricArgs } from '@ioris/core';
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
    useState<LyricArgs['timelines']>();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (lyric) return;
    (async () => {
      const l = await sampleLyric.init();
      setLyric(l);
      setEditingTimeline(l.timelines());
    })();
  }, [lyric, sampleLyric]);

  if (!lyric) return <div>Loading...</div>;

  const currentParagraph = lyric.currentParagraph(now);
  const currentLine = lyric.currentLine(now);
  const currentWord = currentLine?.currentWord(now);

  const updateLyric = async () => {
    const l = await new Lyric({
      ...lyric,
      timelines: editingTimeline || [],
    }).init();
    setLyric(l);
  };

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
        {editingTimeline
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
                          type='number'
                          min={0}
                          max={lyric.duration}
                          value={word.begin}
                          onChange={(e) => {
                            const newTimeline = [...editingTimeline];
                            newTimeline[paragraphIndex][lineIndex][
                              wordIndex
                            ].begin = Number(e.target.value);
                            setEditingTimeline(newTimeline);
                            updateLyric();
                          }}
                        />
                        <input
                          key={wordIndex}
                          type='text'
                          value={word.text}
                          onChange={(e) => {
                            const newTimeline = [...editingTimeline];
                            newTimeline[paragraphIndex][lineIndex][wordIndex] =
                              {
                                ...word,
                                text: e.target.value,
                              };
                            setEditingTimeline(newTimeline);
                            updateLyric();
                          }}
                        />
                        <input
                          type='number'
                          min={0}
                          max={lyric.duration}
                          value={word.end}
                          onChange={(e) => {
                            const newTimeline = [...editingTimeline];
                            newTimeline[paragraphIndex][lineIndex][
                              wordIndex
                            ].end = Number(e.target.value);
                            setEditingTimeline(newTimeline);
                            updateLyric();
                          }}
                        />
                      </form>
                    ))}
                  </fieldset>
                ))}
              </fieldset>
            ))
          : null}
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
            type='range'
            name='timeline'
            min={0}
            max={lyric.duration}
            value={now}
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
          </span>
        </form>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Array.from(lyric.paragraphByPosition).map(([, paragraph]) => (
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
                      color: currentLine?.id === line.id ? 'pink' : 'gray',
                    }}
                    key={line.id}
                  >
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {line.words().map((word) => (
                        <li
                          key={word.id}
                          style={{
                            display: 'inline',
                            fontSize:
                              currentWord?.id === word.id ? '3rem' : '1.5rem',
                            color:
                              currentWord?.id === word.id ? 'red' : 'inherit',

                            fontWeight:
                              currentWord?.id === line.id ? 'bolder' : 'normal',
                            marginRight: word.timeline.hasWhitespace
                              ? '0.2rem'
                              : '',
                          }}
                        >
                          {word.text()}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
