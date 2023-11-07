# 🦙 ollama-logseq plugin

A plugin to integrate [ollama](https://github.com/jmorganca/ollama) with [logseq](https://github.com/logseq/logseq)

# Get Started
- First you will need to setup [ollama](https://github.com/jmorganca/ollama) you can check their github repo for instructions on how to setup ollama
- That's it once you setup ollama you should be able to use the plugin with no problem
- NOTE: The plugin currently doesn't work from the marketplace due to a cors error and I am actively trying to fix that if you want to try the plugin you can install manually

# Manual Installation
```bash
git clone https://github.com/omagdy7/ollama-logseq
cd ollama-logseq
pnpm install
pnpm build
```
- Now head to logseq and enable developer mode and head to plugins and choose Load unpacked plugin and choose the folder of the project '/your/path/to/ollama-logseq'

# Features
- The plugin currently has 5 commands
  - Ask Ai -> which is a prompt the AI freely without any context
  - Ask Ai with context -> This is the same as Ask Ai but it gives the model the context of the current page
  - Summarize -> Summarizs the whole page
  - Create a flash card
  - Divide a todo task into subtasks
- Respects theming
- Context menu commands(Make a flash card, Divide task into subtasks)
- A slash command via /ollama
- Button in tool bar
- Settings for changing the host of the model, the model itself and a shortcut to open the plugin command pallete


# Demo
![demo](./docs/demo.gif)
![summary](./docs/summary.gif)
![context](./docs/context.gif)


If you have any features suggestions feel free to open an issue

