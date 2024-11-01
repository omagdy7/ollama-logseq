import { IHookEvent } from "@logseq/libs/dist/LSPlugin.user";
import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin.user";

const delay = (t = 100) => new Promise(r => setTimeout(r, t))


export async function ollamaUI() {
  logseq.showMainUI()
  setTimeout(() => {
    const element = document.querySelector(".ai-input") as HTMLInputElement | null;
    if (element) {
      element.focus();
    }
  }, 300)
}

function isBlockEntity(b: BlockEntity | BlockUUIDTuple): b is BlockEntity {
  return (b as BlockEntity).uuid !== undefined;
}

async function getTreeContent(b: BlockEntity) {
  let content = "";
  const trimmedBlockContent = b.content.trim();
  if (trimmedBlockContent.length > 0) {
    content += trimmedBlockContent;
  }

  if (!b.children) {
    return content;
  }

  for (const child of b.children) {
    if (isBlockEntity(child)) {
      content += await getTreeContent(child);
    } else {
      const childBlock = await logseq.Editor.getBlock(child[1], {
        includeChildren: true,
      });
      if (childBlock) {
        content += "\n" + await getTreeContent(childBlock);
      }
    }
  }
  return content;
}

export async function getPageContentFromBlock(b: BlockEntity): Promise<string> {
  let blockContents = [];

  const currentBlock = await logseq.Editor.getBlock(b);
  if (!currentBlock) {
    throw new Error("Block not found");
  }

  const page = await logseq.Editor.getPage(currentBlock.page.id);
  if (!page) {
    throw new Error("Page not found");
  }

  const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name);
  for (const pageBlock of pageBlocks) {
    const blockContent = await getTreeContent(pageBlock);
    if (blockContent.length > 0) {
      blockContents.push(blockContent);
    }
  }
  return blockContents.join(" ");
}

type OllamaGenerateParameters = {
  model?: string;
  [key: string]: any;
}

async function ollamaGenerate(prompt: string, parameters?: OllamaGenerateParameters) {
  if (!logseq.settings) {
    throw new Error("Couldn't find ollama-logseq settings")
  }

  let params = parameters || {};
  if (params.model === undefined) {
    params.model = logseq.settings.model;
  }
  params.prompt = prompt
  params.stream = false

  try {
    const response = await fetch(`http://${logseq.settings.host}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })
    if (!response.ok) {
      logseq.UI.showMsg("Coudln't fulfill request make sure that ollama service is running and make sure there is no typo in host or model name")
      throw new Error("Error in Ollama request: " + response.statusText)
    }
    const data = await response.json()
    return data
  } catch (e: any) {
    console.error("ERROR: ", e)
    logseq.App.showMsg("Coudln't fulfill request make sure that ollama service is running and make sure there is no typo in host or model name")
  }
}

async function promptLLM(prompt: string) {
  if (!logseq.settings) {
    throw new Error("Couldn't find logseq settings");
  }
  try {
    const response = await fetch(`http://${logseq.settings.host}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: logseq.settings.model,
        prompt: prompt,
        stream: false,
      }),
    })
    if (!response.ok) {
      logseq.App.showMsg("Coudln't fulfill request make sure that ollama service is running and make sure there is no typo in host or model name")
      throw new Error("Error in Ollama request: " + response.statusText)
    }
    const data = await response.json();

    return data.response;
  } catch (e: any) {
    console.error("ERROR: ", e)
    logseq.App.showMsg("Coudln't fulfill request make sure that ollama service is running and make sure there is no typo in host or model name")
  }
}

export async function defineWord(word: string) {
  askAI(`What's the definition of ${word}?`, "")
}

type ContextType = 'block' | 'page'

export async function askWithContext(prompt: string, contextType: ContextType) {
  try {
    let blocksContent = ""
    if (contextType === 'page') {
      const currentBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
      for (const block of currentBlocksTree) {
        blocksContent += await getTreeContent(block)
      }
    } else {
      const currentBlock = await logseq.Editor.getCurrentBlock()
      blocksContent += await getTreeContent(currentBlock!)
    }
    askAI(prompt, `Context: ${blocksContent}`)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function summarizePage() {
  await delay(300)
  try {
    const currentSelectedBlocks = await logseq.Editor.getCurrentPageBlocksTree()
    let blocksContent = ""
    if (currentSelectedBlocks) {
      let lastBlock: any = currentSelectedBlocks[currentSelectedBlocks.length - 1]
      for (const block of currentSelectedBlocks) {
        blocksContent += block.content + "/n"
      }
      lastBlock = await logseq.Editor.insertBlock(lastBlock.uuid, '⌛ Summarizing Page....', { before: true })
      const summary = await promptLLM(`Summarize the following ${blocksContent}`)
      await logseq.Editor.updateBlock(lastBlock.uuid, `Summary: ${summary}`)
    }
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function summarizeBlock() {
  try {
    // TODO: Get contnet of current block and subblocks
    const currentBlock = await logseq.Editor.getCurrentBlock()
    let summaryBlock = await logseq.Editor.insertBlock(currentBlock!.uuid, `⌛Summarizing Block...`, { before: false })
    const summary = await promptLLM(`Summarize the following ${currentBlock!.content}`);

    await logseq.Editor.updateBlock(summaryBlock!.uuid, `Summary: ${summary}`)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}



async function getOllamaParametersFromBlockProperties(b: BlockEntity) {
  const properties = await logseq.Editor.getBlockProperties(b.uuid);
  const ollamaParameters: OllamaGenerateParameters = {}
  const prefix = 'ollamaGenerate'
  for (const property in properties) {
    if (property.startsWith(prefix)) {
      const key = property.replace(prefix, '').toLowerCase()
      ollamaParameters[key] = properties[property]
    }
  }
  return ollamaParameters
}

async function getOllamaParametersFromBlockAndParentProperties(b: BlockEntity) {
  let ollamaParentProperties: OllamaGenerateParameters = {}
  if (b.parent) {
    let parentBlock = await logseq.Editor.getBlock(b.parent.id)
    if (parentBlock)
      ollamaParentProperties = await getOllamaParametersFromBlockProperties(parentBlock)
  }
  const ollamaBlockProperties = await getOllamaParametersFromBlockProperties(b)
  return { ...ollamaParentProperties, ...ollamaBlockProperties }
}

async function promptFromBlock(block: BlockEntity, prefix?: string) {
  const answerBlock = await logseq.Editor.insertBlock(block!.uuid, '🦙Generating ...', { before: false })
  const params = await getOllamaParametersFromBlockAndParentProperties(block!)
  const blockContent = await getTreeContent(block);

  // let prompt = block!.content.replace(/^.*::.*$/gm, '') // hack to remove properties from block content

  let prompt = blockContent;
  if (prefix) {
    prompt = prefix + "\n" + prompt
  }

  const result = await ollamaGenerate(prompt, params);

  //FIXME: work out the best way to story context
  if (params.usecontext) {
    await logseq.Editor.upsertBlockProperty(block!.uuid, 'ollama-generate-context', result.context)
  }

  await logseq.Editor.updateBlock(answerBlock!.uuid, `${result.response}`)
}

export function promptFromBlockEventClosure(prefix?: string) {
  return async (event: IHookEvent) => {
    try {
      const currentBlock = await logseq.Editor.getBlock(event.uuid)
      await promptFromBlock(currentBlock!, prefix)
    } catch (e: any) {
      logseq.UI.showMsg(e.toString(), 'warning')
      console.error(e)
    }
  }
}

export async function askAI(prompt: string, context: string) {
  await delay(300)
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    let block = null;
    if (currentBlock?.content.trim() === '') {
      block = await logseq.Editor.insertBlock(currentBlock!.uuid, '⌛Generating....', { before: true })
    } else {
      block = await logseq.Editor.insertBlock(currentBlock!.uuid, '⌛Generating....', { before: false })
    }
    let response = "";
    if (context == "") {
      response = await promptLLM(prompt)
    } else {
      response = await promptLLM(`With the context of: ${context}, ${prompt}`)
    }
    await logseq.Editor.updateBlock(block!.uuid, `${prompt}\n${response}`)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function convertToFlashCard(uuid: string, blockContent: string) {
  try {
    const questionBlock = await logseq.Editor.insertBlock(uuid, "⌛Genearting question....", { before: false })
    const answerBlock = await logseq.Editor.insertBlock(questionBlock!.uuid, "⌛Genearting answer....", { before: false })
    const question = await promptLLM(`Create a question about this that would fit in a flashcard:\n ${blockContent}`)
    const answer = await promptLLM(`Given the question ${question} and the context of ${blockContent} What is the answer? be as brief as possible and provide the answer only.`)
    await logseq.Editor.updateBlock(questionBlock!.uuid, `${question} #card`)
    await delay(300)
    await logseq.Editor.updateBlock(answerBlock!.uuid, answer)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function convertToFlashCardFromEvent(b: IHookEvent) {
  const currentBlock = await logseq.Editor.getBlock(b.uuid)
  await convertToFlashCard(currentBlock!.uuid, currentBlock!.content)
}

export async function convertToFlashCardCurrentBlock() {
  const currentBlock = await logseq.Editor.getCurrentBlock()
  await convertToFlashCard(currentBlock!.uuid, currentBlock!.content)
}

export async function DivideTaskIntoSubTasks(uuid: string, content: string) {
  try {
    const block = await logseq.Editor.insertBlock(uuid, "✅ Genearting todos ...", { before: false })
    let i = 0;
    const response = await promptLLM(`Divide this task into subtasks with numbers: ${content} `)
    for (const todo of response.split("\n")) {
      if (i == 0) {
        await logseq.Editor.updateBlock(block!.uuid, `TODO ${todo.slice(3)} `)
      } else {
        await logseq.Editor.insertBlock(uuid, `TODO ${todo.slice(3)} `, { before: false })
      }
      i++;
    }
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function DivideTaskIntoSubTasksFromEvent(b: IHookEvent) {
  const currentBlock = await logseq.Editor.getBlock(b.uuid)
  DivideTaskIntoSubTasks(currentBlock!.uuid, currentBlock!.content)
}

export async function DivideTaskIntoSubTasksCurrentBlock() {
  const currentBlock = await logseq.Editor.getCurrentBlock()
  DivideTaskIntoSubTasks(currentBlock!.uuid, currentBlock!.content)
}

