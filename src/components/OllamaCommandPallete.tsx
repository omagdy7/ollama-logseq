import React, { useEffect, useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { convertToFlashCardCurrentBlock, DivideTaskIntoSubTasksCurrentBlock, summarizePage, summarizeBlock } from "@/ollama";
import { PromptAI } from "./PromptAI";

export function OllamaCommandPallete({ options, theme }: { options: string[], theme: string }) {
  const [selection, setSelection] = useState('')
  const [isEnterPressed, setIsEnterPressed] = useState(false);
  const handleSelection = (selection: string) => {
    setSelection(selection)
    setIsEnterPressed(true);
    switch (selection) {
      case "divide into subtasks":
        logseq.hideMainUI()
        DivideTaskIntoSubTasksCurrentBlock()
        break;
      case "summarize page":
        logseq.hideMainUI()
        summarizePage()
        break;
      case "summarize block":
        logseq.hideMainUI()
        summarizeBlock()
        break;
      case "convert to flash card":
        logseq.hideMainUI()
        convertToFlashCardCurrentBlock()
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    const handleEsc = (e: any) => {
      if (e.key === 'Escape') {
        logseq.hideMainUI()
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const validSelections = ['ask with page context', 'ask with block context', 'ask ai', 'define', 'ask with context'];

  if (isEnterPressed && !validSelections.includes(selection)) {
    return null;
  }

  return (
    validSelections.includes(selection) ? (<PromptAI theme={theme} type={selection} />) : (
      <Command className={(theme === 'dark' ? "dark dark:bg-gray-900" : "bg-gray-200") + " rounded-lg border shadow-md w-1/2"}>
        <CommandInput className="ai-input" placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {
            options.map((option) => (
              <CommandItem key={option} onSelect={handleSelection} className="text-lg">
                <span>{option}</span>
              </CommandItem>
            ))
          }
        </CommandList>
      </Command>
    )
  )
}
