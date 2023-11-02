import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/LSPlugin'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

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

/**
 * main entry
 * @param baseInfo
 */
function main(baseInfo: LSPluginBaseInfo) {
  logseq.useSettingsSchema(settings)
  let loading = false

  logseq.provideModel({
    async summarize() {

      const info = await logseq.App.getUserConfigs()
      if (loading) return


      await delay(300)

      loading = true


      logseq.App.showMsg(`
          [:div.p-2
            [:h1 "response"]
            [:h2.text-xl "Hello"]]
        `)

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

          const summary = await promptLLM(logseq.settings.host, `Summarize the following ${blocksContent}`, logseq.settings.model)

          await logseq.Editor.updateBlock(lastBlock.uuid, `Summary: ${summary}`)
        }

      } catch (e) {
        logseq.App.showMsg(e.toString(), 'warning')
        console.error(e)
      } finally {
        loading = false
      }
    }
  })


  logseq.Editor.registerBlockContextMenuItem('Summarize with AI',
    async () => {
      logseq.App.showMsg(
        'Summarizing....'
      );
      const currentSelectedBlocks = await logseq.Editor.getCurrentPageBlocksTree()
      let blocksContent = ""
      if (currentSelectedBlocks != undefined) {
        let lastBlock: any = currentSelectedBlocks[currentSelectedBlocks.length - 1]
        for (const block in currentSelectedBlocks) {
          blocksContent += currentSelectedBlocks[block].content + "/n"
        }
        if (lastBlock) {
          lastBlock = await logseq.Editor.insertBlock(lastBlock.uuid, '🚀 Summarizing....', { before: false })
        }

        const summary = await promptLLM(logseq.settings.host, `Summarize the following ${blocksContent}`, logseq.settings.model)

        await logseq.Editor.updateBlock(lastBlock.uuid, `Summary: ${summary}`)
      }
    })

  logseq.App.registerUIItem('toolbar', {
    key: 'logseq-reddit',
    template: `
      <a data-on-click="summarize"
         class="button">
        <i class="ti ti-brand-reddit"></i>
      </a>
    `
  })

  logseq.provideStyle(`
    [data-injected-ui=logseq-reddit-${baseInfo.id}] {
      display: flex;
      align-items: center;
    }
  `)
}

// bootstrap
logseq.ready(main).catch(console.error)
