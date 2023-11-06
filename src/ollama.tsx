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
        content += await getTreeContent(childBlock);
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

async function promptLLM(prompt: string) {
  if (!logseq.settings) {
    throw new Error("Couldn't find logseq settings");
  }
  try {
    const response = await fetch(`http://${logseq.settings.host}/api/generate`, {
      method: 'POST',
      mode: 'no-cors',
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
      console.log("Error: couldn't fulful request")
      logseq.App.showMsg("Couldn't fulfuil request make sure you don't have a typo in the name of the model or the host url")
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    return data.response;
  } catch (e: any) {
    console.error("ERROR: ", e)
    logseq.App.showMsg("Couldn't fulfuil request make sure you don't have a typo in the name of the model or the host url")
  }
}

export async function defineWord(word: string) {
  askAI(`What's the formal defintion of ${word}`)
}


export async function askWithContext(prompt: string) {
  await delay(300)

  try {
    const currentBlocksTree = await logseq.Editor.getCurrentPageBlocksTree()
    const currentBlock = currentBlocksTree[0]
    if (!currentBlock) {
      throw new Error("Block not found");
    }
    let blocksContent = ""
    for (const block of currentBlocksTree) {
      blocksContent += await getTreeContent(block)
    }
    askAI(`With the Context of : ${blocksContent}, ${prompt}`)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
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
        lastBlock = await logseq.Editor.insertBlock(lastBlock.uuid, '🚀 Summarizing....', { before: true })
      }
      const summary = await promptLLM(`Summarize the following ${blocksContent}`)
      await logseq.Editor.updateBlock(lastBlock.uuid, `Summary: ${summary}`)
    }
  } catch (e: any) {
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
      const response = await promptLLM(prompt)
      await logseq.Editor.updateBlock(lastBlock.uuid, response)
    }

  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}


export async function convertToFlashCardFromEvent(b: IHookEvent) {
  try {
    const currentBlock = await logseq.Editor.getBlock(b.uuid)
    if (!currentBlock) {
      throw new Error("Block not found");
    }
    const block = await logseq.Editor.insertBlock(currentBlock.uuid, 'Generating....', { before: false })
    if (!block) {
      throw new Error("Block not found");
    }
    const response = await promptLLM(`Create a flashcard for:\n ${currentBlock.content}`)
    await logseq.Editor.updateBlock(block.uuid, `${response} #card`)
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}


export async function convertToFlashCard() {
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    if (!currentBlock) {
      throw new Error("Block not found");
    }
    const block = await logseq.Editor.insertBlock(currentBlock.uuid, "Genearting todos....", { before: false })
    if (!block) {
      throw new Error("Block not found");
    }
    if (currentBlock) {
      let i = 0;
      const response = await promptLLM(`Divide this task into subtasks with numbers: ${currentBlock.content}`)
      for (const todo of response.split("\n")) {
        if (i == 0) {
          await logseq.Editor.updateBlock(block.uuid, `TODO ${todo.slice(3)}`)
        } else {
          await logseq.Editor.insertBlock(currentBlock.uuid, `TODO ${todo.slice(3)}`, { before: false })
        }
        i++;
      }
    }
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function DivideTaskIntoSubTasksFromEvent(b: IHookEvent) {
  try {
    const currentBlock = await logseq.Editor.getBlock(b.uuid)
    if (!currentBlock) {
      throw new Error("Block not found");
    }
    const block = await logseq.Editor.insertBlock(currentBlock.uuid, "Genearting todos....", { before: false })
    if (!block) {
      throw new Error("Block not found");
    }
    if (currentBlock) {
      let i = 0;
      const response = await promptLLM(`Divide this task into subtasks with numbers: ${currentBlock.content}`)
      for (const todo of response.split("\n")) {
        if (i == 0) {
          await logseq.Editor.updateBlock(block.uuid, `TODO ${todo.slice(3)}`)
        } else {
          await logseq.Editor.insertBlock(currentBlock.uuid, `TODO ${todo.slice(3)}`, { before: false })
        }
        i++;
      }
    }
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}

export async function DivideTaskIntoSubTasks() {
  try {
    const currentBlock = await logseq.Editor.getCurrentBlock()
    if (currentBlock) {
      const response = await promptLLM(`Divide this task into subtasks with numbers: ${currentBlock.content}`)
      for (const todo of response.split("\n")) {
        await logseq.Editor.insertBlock(currentBlock.uuid, `TODO ${todo.slice(3)}`, { before: false })
      }
    }
  } catch (e: any) {
    logseq.App.showMsg(e.toString(), 'warning')
    console.error(e)
  }
}
