/** biome-ignore-all lint/suspicious/noArrayIndexKey: sample */
import {
  createLyric,
  getCurrentChar,
  getCurrentLine,
  getCurrentParagraph,
  getCurrentWord,
  getTimelines,
  isSuccess,
  type Lyric,
  mergeWords,
  shiftWords,
  splitWord,
  type UpdateLyricArgs,
  updateLyric,
  type ValidationResult,
  type WordTimeline,
} from "@ioris/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "@ioris/core v0.4.0 Demo" },
    { name: "description", content: "Editing API Demo - Shift, Split, Merge" },
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

type EditAction = {
  type: "shift" | "split" | "merge";
  description: string;
  timestamp: number;
};

export default function Index() {
  const [lyric, setLyric] = useState<Lyric>();
  const [editingTimeline, setEditingTimeline] =
    useState<UpdateLyricArgs["timelines"]>();
  const [updating, setUpdating] = useState(false);
  const [now, setNow] = useState(0);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [editHistory, setEditHistory] = useState<EditAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lyricRef = useRef<Lyric>(null);
  const lastEditedTimelineRef = useRef<UpdateLyricArgs["timelines"] | null>(
    null,
  );

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
  // Only update when editingTimeline is modified by Editor, not by editing operations
  useEffect(() => {
    if (!lyricRef.current || !editingTimeline) return;

    // Skip if the timeline came from editing operation (same reference)
    if (editingTimeline === lastEditedTimelineRef.current) {
      lastEditedTimelineRef.current = null;
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!lyricRef.current) return;
      // Double check in case it was set during debounce
      if (editingTimeline === lastEditedTimelineRef.current) {
        lastEditedTimelineRef.current = null;
        return;
      }

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
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [editingTimeline]);

  // Handle result from editing operations
  const handleEditResult = useCallback(
    (result: ValidationResult<Lyric>, action: EditAction) => {
      if (isSuccess(result)) {
        setLyric(result.data);
        lyricRef.current = result.data;
        // Store the timeline reference to skip the next updateLyric
        lastEditedTimelineRef.current = getTimelines(result.data);
        setEditingTimeline(lastEditedTimelineRef.current);
        setEditHistory((prev) => [action, ...prev].slice(0, 10));
        setSelectedWordIds([]);
        setError(null);
      } else {
        setError(`${result.error.code}: ${result.error.message}`);
      }
    },
    [],
  );

  // Shift selected words
  const handleShiftWords = useCallback(
    (offsetSec: number) => {
      if (!lyricRef.current || selectedWordIds.length === 0) return;

      const result = shiftWords(lyricRef.current, selectedWordIds, offsetSec);
      const sign = offsetSec > 0 ? "+" : "";
      handleEditResult(result, {
        type: "shift",
        description:
          "Shifted " +
          selectedWordIds.length +
          " word(s) by " +
          sign +
          offsetSec +
          "s",
        timestamp: Date.now(),
      });
    },
    [selectedWordIds, handleEditResult],
  );

  // Split word
  const handleSplitWord = useCallback(
    (type: "position" | "time", value: number) => {
      if (!lyricRef.current || selectedWordIds.length !== 1) return;

      const wordId = selectedWordIds[0];
      const word = lyricRef.current._index.wordById.get(wordId);

      const result =
        type === "position"
          ? splitWord(lyricRef.current, wordId, {
              type: "position",
              charIndex: value,
            })
          : splitWord(lyricRef.current, wordId, {
              type: "time",
              splitTime: value,
            });

      const typeDesc =
        type === "position" ? `position ${value}` : `time ${value}s`;
      handleEditResult(result, {
        type: "split",
        description: `Split "${word?.timeline.text || ""}" by ${typeDesc}`,
        timestamp: Date.now(),
      });
    },
    [selectedWordIds, handleEditResult],
  );

  // Merge words
  const handleMergeWords = useCallback(() => {
    if (!lyricRef.current || selectedWordIds.length < 2) return;

    const words = selectedWordIds
      .map((id) => lyricRef.current?._index.wordById.get(id))
      .filter(Boolean);
    const text = words.map((w) => w?.timeline.text).join(" + ");

    const result = mergeWords(lyricRef.current, selectedWordIds);
    handleEditResult(result, {
      type: "merge",
      description: `Merged: ${text}`,
      timestamp: Date.now(),
    });
  }, [selectedWordIds, handleEditResult]);

  // Toggle word selection
  const toggleWordSelection = useCallback((wordId: string) => {
    setSelectedWordIds((prev) =>
      prev.includes(wordId)
        ? prev.filter((id) => id !== wordId)
        : [...prev, wordId],
    );
    setError(null);
  }, []);

  // Reset to initial state
  const handleReset = useCallback(async () => {
    const l = await createLyric({
      resourceID: "sample",
      duration: 60,
      timelines: sampleTimelines,
      initID: true,
    });
    setLyric(l);
    lyricRef.current = l;
    setEditingTimeline(getTimelines(l));
    setSelectedWordIds([]);
    setEditHistory([]);
    setError(null);
  }, []);

  if (!lyric) return <div>Loading...</div>;
  if (updating) return <div>Updating...</div>;

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        lineHeight: "1.8",
        padding: "1rem",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>@ioris/core Demo</h1>
        <p style={{ color: "#666", margin: 0 }}>
          Click words to select, then use editing operations below
        </p>
      </header>

      {error && (
        <div
          style={{
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            marginBottom: "1rem",
            color: "#c00",
          }}
        >
          Error: {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "2rem",
          gridTemplateColumns: "1fr 1fr",
          marginTop: "2rem",
        }}
      >
        <div>
          <h2>Preview (Click to select words)</h2>

          <form
            style={{
              display: "flex",
              marginBottom: "1rem",
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
                fontFamily: "monospace",
              }}
            >
              {Math.floor(now / 60)}:
              {Math.floor(now % 60)
                .toString()
                .padStart(2, "0")}
              .{((now % 1) * 100).toFixed(0).padStart(2, "0")}
            </span>
          </form>

          <Preview
            lyric={lyric}
            now={now}
            setNow={setNow}
            selectedWordIds={selectedWordIds}
            onToggleWord={toggleWordSelection}
          />
        </div>

        <div>
          <h2>Editor</h2>
          <Editor
            lyric={lyric}
            editingTimeline={editingTimeline}
            setEditingTimeline={setEditingTimeline}
          />
        </div>
      </div>

      <EditingControls
        selectedWordIds={selectedWordIds}
        lyric={lyric}
        onShift={handleShiftWords}
        onSplit={handleSplitWord}
        onMerge={handleMergeWords}
        onReset={handleReset}
      />

      {editHistory.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Edit History</h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {editHistory.map((action, index) => (
              <li
                key={`${action.timestamp}-${index}`}
                style={{
                  padding: "0.5rem",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    background: "#666",
                    color: "white",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                  }}
                >
                  {action.type}
                </span>
                <span>{action.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function EditingControls(props: {
  selectedWordIds: string[];
  lyric: Lyric;
  onShift: (offset: number) => void;
  onSplit: (type: "position" | "time", value: number) => void;
  onMerge: () => void;
  onReset: () => void;
}) {
  const { selectedWordIds, lyric, onShift, onSplit, onMerge, onReset } = props;
  const [splitValue, setSplitValue] = useState(1);
  const [splitType, setSplitType] = useState<"position" | "time">("position");
  const [shiftAmount, setShiftAmount] = useState(1);

  const selectedWord =
    selectedWordIds.length === 1
      ? lyric._index.wordById.get(selectedWordIds[0])
      : null;

  return (
    <div
      style={{
        background: "#f8f9fa",
        borderRadius: "8px",
        padding: "1rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          minWidth: "200px",
          padding: "0.5rem",
          background: "#fff",
          borderRadius: "4px",
          border: "1px solid #ddd",
        }}
      >
        <strong>Selected:</strong>{" "}
        {selectedWordIds.length === 0 ? (
          <span style={{ color: "#999" }}>None</span>
        ) : (
          <span>
            {selectedWordIds.length} word(s)
            {selectedWord && (
              <span style={{ color: "#666" }}>
                {" "}
                - &quot;{selectedWord.timeline.text}&quot;
              </span>
            )}
          </span>
        )}
      </div>

      <fieldset
        style={{
          border: "1px solid #999",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
        }}
      >
        <legend style={{ fontWeight: "bold" }}>Shift</legend>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            value={shiftAmount}
            onChange={(e) => setShiftAmount(Number(e.target.value))}
            step={0.5}
            style={{ width: "60px" }}
          />
          <span>sec</span>
          <button
            type="button"
            onClick={() => onShift(-shiftAmount)}
            disabled={selectedWordIds.length === 0}
            style={{
              background: selectedWordIds.length > 0 ? "#333" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "0.25rem 0.75rem",
              cursor: selectedWordIds.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            ← Earlier
          </button>
          <button
            type="button"
            onClick={() => onShift(shiftAmount)}
            disabled={selectedWordIds.length === 0}
            style={{
              background: selectedWordIds.length > 0 ? "#333" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "0.25rem 0.75rem",
              cursor: selectedWordIds.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Later →
          </button>
        </div>
      </fieldset>

      <fieldset
        style={{
          border: "1px solid #999",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
        }}
      >
        <legend style={{ fontWeight: "bold" }}>Split</legend>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <select
            value={splitType}
            onChange={(e) =>
              setSplitType(e.target.value as "position" | "time")
            }
            style={{ padding: "0.25rem" }}
          >
            <option value="position">By Position</option>
            <option value="time">By Time</option>
          </select>
          <input
            type="number"
            value={splitValue}
            onChange={(e) => setSplitValue(Number(e.target.value))}
            step={splitType === "time" ? 0.5 : 1}
            min={splitType === "position" ? 1 : 0}
            style={{ width: "60px" }}
          />
          <span>{splitType === "position" ? "chars" : "sec"}</span>
          <button
            type="button"
            onClick={() => onSplit(splitType, splitValue)}
            disabled={selectedWordIds.length !== 1}
            style={{
              background: selectedWordIds.length === 1 ? "#333" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "0.25rem 0.75rem",
              cursor: selectedWordIds.length === 1 ? "pointer" : "not-allowed",
            }}
          >
            Split Word
          </button>
        </div>
        {selectedWordIds.length !== 1 && (
          <small style={{ color: "#999" }}>
            Select exactly 1 word to split
          </small>
        )}
      </fieldset>

      <fieldset
        style={{
          border: "1px solid #999",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
        }}
      >
        <legend style={{ fontWeight: "bold" }}>Merge</legend>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={onMerge}
            disabled={selectedWordIds.length < 2}
            style={{
              background: selectedWordIds.length >= 2 ? "#333" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "0.25rem 0.75rem",
              cursor: selectedWordIds.length >= 2 ? "pointer" : "not-allowed",
            }}
          >
            Merge Words
          </button>
        </div>
        {selectedWordIds.length < 2 && (
          <small style={{ color: "#999" }}>
            Select 2+ words in the same line
          </small>
        )}
      </fieldset>

      <button
        type="button"
        onClick={onReset}
        style={{
          background: "#666",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          alignSelf: "center",
        }}
      >
        Reset
      </button>
    </div>
  );
}

function Editor(props: {
  lyric: Lyric;
  editingTimeline: UpdateLyricArgs["timelines"];
  setEditingTimeline: (timelines: UpdateLyricArgs["timelines"]) => void;
}) {
  const { lyric, editingTimeline, setEditingTimeline } = props;

  return editingTimeline
    ? editingTimeline.map((paragraph, paragraphIndex) => (
        <fieldset
          key={`paragraph-${paragraphIndex}`}
          style={{
            marginBottom: "1rem",
          }}
        >
          <legend>Paragraph {paragraphIndex + 1}</legend>
          {paragraph.map((line, lineIndex) => (
            <fieldset
              style={{
                marginTop: "0.5rem",
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
                    marginTop: "0.5rem",
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
  lyric: Lyric;
  now: number;
  setNow: (now: number) => void;
  selectedWordIds: string[];
  onToggleWord: (wordId: string) => void;
}) {
  const { lyric, now, setNow, selectedWordIds, onToggleWord } = props;

  const currentParagraph = getCurrentParagraph(lyric, now);
  const currentLine = getCurrentLine(lyric, now);
  const currentWord = getCurrentWord(lyric, now);
  const currentChar = getCurrentChar(lyric, now);

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {lyric.paragraphs.map((paragraph) => (
        <li
          style={{
            marginTop: "1.5rem",
            display: "flex",
            opacity: currentParagraph?.id === paragraph.id ? 1 : 0.5,
          }}
          key={paragraph.id}
        >
          <ul style={{ listStyle: "none", padding: 0 }}>
            {paragraph.lines.map((line) => (
              <li
                style={{
                  marginTop: "0.75rem",
                  display: "flex",
                  color: currentLine?.id === line.id ? "#333" : "#999",
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
                    const isSelected = selectedWordIds.includes(word.id);
                    return (
                      // biome-ignore lint/a11y/useKeyWithClickEvents: demo
                      <li
                        key={word.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWord(word.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setNow(word.timeline.begin);
                        }}
                        style={{
                          transition: "0.1s ease-in-out",
                          display: "inline-block",
                          cursor: "pointer",
                          fontSize: "1.75rem",
                          transformStyle: "preserve-3d",
                          transform: isCurrentWord
                            ? "translateZ(100px)"
                            : "translateZ(0px)",
                          opacity: isCurrentWord || isSelected ? 1 : 0.5,
                          marginRight: word.timeline.hasWhitespace
                            ? "0.3rem"
                            : "",
                          background: isSelected ? "#eee" : "transparent",
                          border: isSelected
                            ? "2px solid #333"
                            : "2px solid transparent",
                          borderRadius: "4px",
                          padding: "0.125rem 0.25rem",
                        }}
                        title={
                          word.timeline.text +
                          " (" +
                          word.timeline.begin +
                          "s - " +
                          word.timeline.end +
                          "s)\nClick to select, double-click to seek"
                        }
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
