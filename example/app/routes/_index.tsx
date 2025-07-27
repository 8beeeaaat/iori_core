/** biome-ignore-all lint/suspicious/noArrayIndexKey: sample */
import {
  createLyric,
  getCurrentChar,
  getCurrentLine,
  getCurrentParagraph,
  getCurrentWord,
  getTimelines,
  type LyricData,
  type LyricUpdateArgs,
  updateLyric,
  type WordTimeline,
} from "@ioris/core";
import { useEffect, useRef, useState } from "react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const sampleTimelines: WordTimeline[][][] = [
  [
    [
      {
        wordID: "word1",
        begin: 3,
        end: 10,
        text: "Hello,",
        hasWhitespace: true,
      },
      {
        wordID: "word2",
        begin: 10,
        end: 20,
        text: "world!",
      },
    ],
    [
      {
        wordID: "word3",
        begin: 30,
        end: 32,
        text: "This",
        hasWhitespace: true,
      },
      {
        wordID: "word4",
        begin: 32,
        end: 34,
        text: "is",
        hasWhitespace: true,
      },
      {
        wordID: "word5",
        begin: 35,
        end: 36,
        text: "a",
        hasWhitespace: true,
      },
      {
        wordID: "word6",
        begin: 36,
        end: 40,
        text: "sample.",
      },
    ],
  ],
  [
    [
      {
        wordID: "word7",
        begin: 50,
        end: 52,
        text: "Goodbye,",
        hasWhitespace: true,
      },
      {
        wordID: "word8",
        begin: 53,
        end: 55,
        text: "world!",
      },
    ],
  ],
];

export default function Index() {
  const [lyric, setLyric] = useState<LyricData>();
  const [editingTimeline, setEditingTimeline] =
    useState<LyricUpdateArgs["timelines"]>();
  const [updating, setUpdating] = useState(false);
  const [now, setNow] = useState(0);
  const lyricRef = useRef<LyricData>(null);

  // init lyric
  useEffect(() => {
    if (lyric) return;
    (async () => {
      const l = await createLyric({
        resourceID: "sample",
        duration: 60,
        timelines: sampleTimelines,
        initID: true,
      });
      setLyric(l);
      lyricRef.current = l;
      setEditingTimeline(getTimelines(l));
    })();
  }, [lyric]);

  // update lyric (with debounce to prevent frequent updates)
  useEffect(() => {
    if (!lyricRef.current || !editingTimeline) return;

    const timeoutId = setTimeout(async () => {
      if (!lyricRef.current) return;

      try {
        setUpdating(true);

        const updated = await updateLyric(lyricRef.current, {
          timelines: editingTimeline || [],
        });
        setLyric(updated);
        lyricRef.current = updated;
        setUpdating(false);
      } catch (error) {
        console.error(error);
        setUpdating(false);
      }
    }, 300); // 300ms のデバウンス

    return () => clearTimeout(timeoutId);
  }, [editingTimeline]);

  if (!lyric) return <div>Loading...</div>;
  if (updating) return <div>Updating...</div>;

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        lineHeight: "1.8",
        display: "grid",
        gap: "2rem",
        gridTemplateColumns: "1fr 1fr",
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
            display: "flex",
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
              marginLeft: "1rem",
            }}
          >
            {Math.floor(now / 60)}:
            {Math.floor(now % 60)
              .toString()
              .padStart(2, "0")}
            .{((now % 1) * 100).toFixed(0).padStart(2, "0")}
          </span>
        </form>

        <Preview lyric={lyric} now={now} setNow={setNow} />
      </div>
    </main>
  );
}

function Editor(props: {
  lyric: LyricData;
  editingTimeline: LyricUpdateArgs["timelines"];
  setEditingTimeline: (timelines: LyricUpdateArgs["timelines"]) => void;
}) {
  const { lyric, editingTimeline, setEditingTimeline } = props;

  return editingTimeline
    ? editingTimeline.map((paragraph, paragraphIndex) => (
        <fieldset
          key={`paragraph-${paragraphIndex}`}
          style={{
            marginBottom: "2rem",
          }}
        >
          <legend>Paragraph {paragraphIndex + 1}</legend>
          {paragraph.map((line, lineIndex) => (
            <fieldset
              style={{
                marginTop: "1rem",
              }}
              key={`paragraph-${paragraphIndex}-line-${lineIndex}`}
            >
              <legend>Line {lineIndex + 1}</legend>
              {line.map((word, wordIndex) => (
                <form
                  key={`${paragraphIndex}-${lineIndex}-${word.wordID}`}
                  style={{
                    display: "grid",
                    gap: "0.25rem",
                    gridTemplateColumns: "4rem 1fr 4rem",
                    marginTop: "1rem",
                  }}
                >
                  <input
                    type="number"
                    min={0}
                    max={lyric.duration}
                    value={word.begin}
                    onChange={(e) => {
                      if (!editingTimeline) return;
                      const newTimeline = [...editingTimeline];
                      newTimeline[paragraphIndex][lineIndex][wordIndex] = {
                        ...word,
                        begin: Number(e.target.value),
                      };
                      setEditingTimeline(newTimeline);
                    }}
                  />
                  <input
                    key={word.wordID}
                    type="text"
                    value={word.text}
                    onChange={(e) => {
                      if (!editingTimeline) return;
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
                      if (!editingTimeline) return;
                      const newTimeline = [...editingTimeline];
                      newTimeline[paragraphIndex][lineIndex][wordIndex] = {
                        ...word,
                        end: Number(e.target.value),
                      };
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
  lyric: LyricData;
  now: number;
  setNow: (now: number) => void;
}) {
  const { lyric, now, setNow } = props;

  const currentParagraph = getCurrentParagraph(lyric, now);
  const currentLine = getCurrentLine(lyric, now);
  const currentWord = getCurrentWord(lyric, now);
  const currentChar = getCurrentChar(lyric, now);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {lyric.paragraphs.map((paragraph) => (
        <li
          style={{
            marginTop: "2rem",
            display: "flex",
            opacity: currentParagraph?.id === paragraph.id ? 1 : 0.5,
          }}
          key={paragraph.id}
        >
          <ul style={{ listStyle: "none", padding: 0 }}>
            {paragraph.lines.map((line) => (
              <li
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  color: currentLine?.id === line.id ? "red" : "gray",
                  transition: "0.1s ease-in-out",
                }}
                key={line.id}
              >
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    perspective: 500,
                    transformStyle: "preserve-3d",
                  }}
                >
                  {line.words.map((word) => {
                    const isCurrentWord = currentWord?.id === word.id;
                    return (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: explanation needed
                      <li
                        key={word.id}
                        style={{
                          transition: "0.1s ease-in-out",
                          display: "inline-block",
                          cursor: "pointer",
                          fontSize: "2rem",
                          transformStyle: "preserve-3d",
                          transform: isCurrentWord
                            ? "translateZ(100px)"
                            : "translateZ(0px)",
                          opacity: isCurrentWord ? 1 : 0.5,
                          marginRight: word.timeline.hasWhitespace
                            ? "0.2rem"
                            : "",
                        }}
                        onClick={() => {
                          setNow(word.timeline.begin);
                        }}
                      >
                        {word.chars.map((char) => {
                          return (
                            <span
                              key={char.id}
                              style={{
                                display: "inline-block",
                                opacity: currentChar?.id === char.id ? 1 : 0.5,
                                filter:
                                  !isCurrentWord || currentChar?.id === char.id
                                    ? "blur(0)"
                                    : "blur(1px)",
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
