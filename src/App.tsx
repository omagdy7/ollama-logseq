import React, { useEffect, useRef, useState } from "react";
import { OllamaCommandPallete } from "./components/OllamaCommandPallete";
import {
  convertToFlashCardFromEvent,
  DivideTaskIntoSubTasksFromEvent,
  ollamaUI,
  promptFromBlockEventClosure
} from "./ollama";
import { useAppVisible } from "./utils";

const options = [
  'Ask ai',
  'Ask with context',
  'Define',
  'Divide into subtasks',
  'Summarize',
  'Summarize Block',
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

logseq.Editor.getPageBlocksTree("ollama-logseq-config").then((blocks) => {
  blocks!.forEach((block) => {
    logseq.Editor.getBlockProperty(block.uuid, "ollama-context-menu-title").then((title) => {
      logseq.Editor.getBlockProperty(block.uuid, "ollama-prompt-prefix").then((prompt_prefix) => {
        logseq.Editor.registerBlockContextMenuItem(title, promptFromBlockEventClosure(prompt_prefix))
      })
    }).catch((reason) => {
    })
  })
}).catch((reason) => {
  console.log("Can not find the configuration page named 'ollama-logseq-config'")
  console.log(reason)
})
    

    logseq.Editor.registerSlashCommand("ollama", ollamaUI)
    logseq.Editor.registerBlockContextMenuItem("Ollama: Create a flash card", convertToFlashCardFromEvent)
    logseq.Editor.registerBlockContextMenuItem("Ollama: Divide into subtasks", DivideTaskIntoSubTasksFromEvent)
    logseq.Editor.registerBlockContextMenuItem("Ollama: Prompt from Block", promptFromBlockEventClosure())
    logseq.Editor.registerBlockContextMenuItem("Ollama: Summarize block", promptFromBlockEventClosure("Summarize: "))
    logseq.Editor.registerBlockContextMenuItem("Ollama: Expand Block", promptFromBlockEventClosure("Expand: "))

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
