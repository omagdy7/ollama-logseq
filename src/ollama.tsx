import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin.user";

const delay = (t = 100) => new Promise(r => setTimeout(r, t))


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

async function promptLLM(url: string, prompt: string, model: string) {


  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
    }),
  })
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();

  return data.response;

}

export async function defineWord(word: string) {
  askAI(`Define this following ${word}`)
}

export async function summarize() {
  await delay(300)

  try {
    const currentSelectedBlocks = await logseq.Editor.getCurrentPageBlocksTree()
    let blocksContent = ""
    if (currentSelectedBlocks) {
      let lastBlock: any = currentSelectedBlocks[currentSelectedBlocks.length - 1]
      for (const block of currentSelectedBlocks) {
        blocksContent += block.content + "/n"
      }
      if (lastBlock) {
        lastBlock = await logseq.Editor.insertBlock(lastBlock.uuid, '🚀 Summarizing....', { before: false })
      }

      const summary = await promptLLM("localhost:11434", `Summarize the following ${blocksContent}`, "mistral:instruct")

      await logseq.Editor.updateBlock(lastBlock.uuid, `Summary: ${summary}`)
    }

  } catch (e) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function askAI(prompt: string) {
  await delay(300)

  try {
    const currentSelectedBlocks = await logseq.Editor.getCurrentPageBlocksTree()
    if (currentSelectedBlocks) {
      let lastBlock: any = currentSelectedBlocks[currentSelectedBlocks.length - 1]
      if (lastBlock) {
        lastBlock = await logseq.Editor.insertBlock(lastBlock.uuid, 'Generating....', { before: true })
      }
      const response = await promptLLM("localhost:11434", prompt, "mistral:instruct")
      await logseq.Editor.updateBlock(lastBlock.uuid, response)
    }

  } catch (e) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function DivideTaskIntoSubTasks() {
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    if (currentBlock) {
      // const block = await logseq.Editor.insertBlock(currentBlock.uuid, 'Generating....', { before: false })
      logseq.App.showMsg(`
          [:div.p-2
            [:h1 "currentBlock content"]
            [:h2.text-xl "Divide this task into subtasks: ${currentBlock?.content}"]]
        `)
      const response = await promptLLM("localhost:11434", `Divide this task into subtasks with numbers: ${currentBlock.content}`, "mistral:instruct")
      for (const todo of response.split("\n")) {
        const block = await logseq.Editor.insertBlock(currentBlock.uuid, `TODO ${todo.slice(3)}`, { before: false })
      }
    }
  } catch (e) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}
