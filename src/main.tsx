import "@logseq/libs";

import React, { useEffect } from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { logseq as PL } from "../package.json";
import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

const delay = (t = 100) => new Promise(r => setTimeout(r, t))

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
    default: "mistral:instruct"
  },
]

function main() {
  console.log("Hello")
  console.info(`#${pluginId}: MAIN`);
  // logseq.useSettingsSchema(settings)
  let loading = false
  const root = ReactDOM.createRoot(document.getElementById("app")!);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  function show() {
    logseq.showMainUI();
  }
  function createModel() {
    return {
      show() {
        logseq.showMainUI();
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  const openIconName = "template-plugin-open";


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
        <i class="ti ti-brand-reddit"></i>
      </a>
    `,
  });
}
logseq.ready(main).catch(console.error);


