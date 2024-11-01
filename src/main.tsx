import "@logseq/libs";

import React, { useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { logseq as PL } from "../package.json";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";
import { ollamaUI } from "./ollama";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const pluginId = PL.id;

let settings: SettingSchemaDesc[] = [
  {
    key: "host",
    type: "string",
    title: "Host",
    description: "Set the host of your ollama model",
    default: "localhost:11434"
  },
  {
    key: "model",
    type: "string",
    title: "LLM Model",
    description: "Set your desired model to use ollama",
    default: "llama3.1:8b"
  },
  {
    key: "shortcut",
    type: "string",
    title: "Shortcut",
    description: "Shortcut to open plugin command pallete",
    default: "mod+shift+o"
  },
  {
    key: "custom_prompt_block",
    type: "string",
    title: "Custom prompt block",
    description: "Define your custom prompt and use a block as context",
    default: "Translate in French : "
  },
]


function main() {
  console.info(`#${pluginId}: MAIN`);
  logseq.useSettingsSchema(settings)
  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  function createModel() {
    return {
      show() {
        ollamaUI()
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "ollama-ui-open";


  logseq.provideStyle(css`
    .${openIconName} {
      opacity: 1;
      font-size: 20px;
      margin-top: 4px;
    }

    .${openIconName}:hover {
      color: red;
    }
  `);

  logseq.App.registerUIItem("toolbar", {
    key: openIconName,
    template: `
      <a data-on-click="show"
         class="button">
        <i class="ti ti-wand"></i>
      </a>
    `,
  });
}
logseq.ready(main).catch(console.error);


