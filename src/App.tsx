import React, { useEffect, useRef, useState } from "react";
import CommandPalette from "./components/CommandPallete";
import { useAppVisible } from "./utils";

const options = [
  { label: 'Ask Ai' },
  { label: 'Define' },
  { label: 'Divide into subtasks' },
  { label: 'Summarize' },
];


async function ollamaUI() {
  console.log("Hello")
  logseq.showMainUI({ autoFocus: true })
  setTimeout(() => {
    document.getElementById("ai-input")?.focus()
    console.log(document.getElementById("ai-input"))
  }, 300)
}

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();

  useEffect(() => {
    logseq.Editor.registerSlashCommand("ollama", ollamaUI)
  }, [])

  if (visible) {
    return (
      <main
        className="fixed inset-0 flex items-center justify-center"
        onClick={(e) => {
          if (!innerRef.current?.contains(e.target as any)) {
            window.logseq.hideMainUI();
          }
        }}
      >
        <div ref={innerRef} className="text-white text-2xl">
          <CommandPalette options={options} />
        </div>
      </main>
    );
  }
  return null;
}

export default App;
