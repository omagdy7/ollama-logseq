import { AppUserInfo } from "@logseq/libs/dist/LSPlugin";
import React, { useEffect, useRef, useState } from "react";
import { OllamaCommandPallete } from "./components/OllamaCommandPallete";
import { convertToFlashCardFromEvent, DivideTaskIntoSubTasksFromEvent, ollamaUI } from "./ollama";
import { useAppVisible } from "./utils";

const options = [
  'Ask ai',
  'Ask with context',
  'Define',
  'Divide into subtasks',
  'Summarize',
  'Convert to flash card',
];

async function getTheme() {
  const theme = await logseq.App.getUserInfo()
  if (!theme) {
    return "dark"
  }
  return theme.preferredThemeMode
}

function App() {
  const innerRef = useRef<HTMLDivElement>(null);
  const visible = useAppVisible();
  const [theme, setTheme] = useState<string>('')

  useEffect(() => {
    const getTheme = async () => {
      const theme = await logseq.App.getUserConfigs()
      if (!theme) {
        setTheme('dark')
      } else {
        setTheme(theme.preferredThemeMode)
      }
    }
    getTheme();
    if (!logseq.settings) {
      return
    }
    logseq.Editor.registerSlashCommand("ollama", ollamaUI)
    logseq.Editor.registerBlockContextMenuItem("Create a flash card", convertToFlashCardFromEvent)
    logseq.Editor.registerBlockContextMenuItem("Make task into subtasks", DivideTaskIntoSubTasksFromEvent)
    logseq.App.registerCommandShortcut(
      { "binding": logseq.settings.shortcut },
      ollamaUI
    );
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
        <div ref={innerRef} className="flex items-center justify-center w-screen">
          <OllamaCommandPallete options={options} theme={theme} />
        </div>
      </main>
    );
  }
  return null;
}

export default App;
