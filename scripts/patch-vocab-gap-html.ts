/**
 * Injects drag-and-drop gap fill mount + JSON config into vocabulary series HTML files.
 * Run: npx tsx scripts/patch-vocab-gap-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const VSG_STYLES = `
  @keyframes vsg-shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
  }
  .vsg-shake { animation: vsg-shake 0.45s ease; }
  .vsg-slot-correct {
    border: 3px solid #15803d !important;
    background: #ecfdf5 !important;
    box-shadow: inset 0 0 0 1px rgba(21, 128, 61, 0.15);
  }
  .vsg-slot-wrong { border-color: #b91c1c !important; background: #fee2e2 !important; }
  .vsg-layout {
    display: flex;
    flex-direction: row;
    gap: 20px;
    align-items: flex-start;
  }
  .vsg-sentences-col { flex: 1; min-width: 0; }
  .vsg-bank-col {
    width: min(260px, 100%);
    flex-shrink: 0;
    position: sticky;
    top: 12px;
    padding: 14px;
    border-radius: 10px;
    background: linear-gradient(135deg, #e8eaf6 0%, #f5f6fc 100%);
    border: 1px solid #c5cae9;
    box-shadow: 0 2px 6px rgba(56, 67, 143, 0.1);
  }
  .vsg-bank-scroll-notice {
    margin: 0 0 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border: 1px solid #fdba74;
    font-size: 12px;
    line-height: 1.45;
    color: #9a3412;
  }
  .vsg-bank-scroll-wrap {
    position: relative;
  }
  .vsg-bank-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: min(70vh, 640px);
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
    scrollbar-color: #38438f #e8eaf6;
  }
  .vsg-bank-grid::-webkit-scrollbar { width: 8px; }
  .vsg-bank-grid::-webkit-scrollbar-track {
    background: #e8eaf6;
    border-radius: 8px;
  }
  .vsg-bank-grid::-webkit-scrollbar-thumb {
    background: #38438f;
    border-radius: 8px;
  }
  .vsg-bank-fade {
    position: absolute;
    left: 0;
    right: 8px;
    height: 28px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1;
  }
  .vsg-bank-fade-top {
    top: 0;
    background: linear-gradient(180deg, rgba(245, 246, 252, 0.98) 0%, rgba(245, 246, 252, 0) 100%);
  }
  .vsg-bank-fade-bottom {
    bottom: 0;
    background: linear-gradient(0deg, rgba(245, 246, 252, 0.98) 0%, rgba(245, 246, 252, 0) 100%);
  }
  .vsg-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-top: 18px;
  }
  @media (max-width: 720px) {
    .vsg-layout { flex-direction: column; }
    .vsg-bank-col { width: 100%; position: static; }
    .vsg-bank-grid {
      flex-direction: row;
      flex-wrap: wrap;
      max-height: none;
    }
    .vsg-chip { flex: 0 1 auto; width: auto !important; }
  }
  @media print {
    .vsg-no-print { display: none !important; }
    .vsg-slot { border: 1px dashed #333 !important; background: #fff !important; }
  }
`

const PATCHES: Array<{
  htmlFile: string
  jsonFile: string
  audioDir: string
}> = [
  {
    htmlFile: 'telephoning-writing-vocabulary-html.html',
    jsonFile: 'telephoning-writing.json',
    audioDir: '/vocab-audio/telephoning-writing-vocab-audio/',
  },
  {
    htmlFile: 'jobs-people-organisations-vocabulary-html.html',
    jsonFile: 'jobs-people-organisations.json',
    audioDir: '/vocab-audio/jobs-people-organisations-vocab-audio/',
  },
  {
    htmlFile: 'travel-vocabulary-html.html',
    jsonFile: 'travel.json',
    audioDir: '/vocab-audio/travel-vocab-audio/',
  },
  {
    htmlFile: 'customer-service-vocabulary-html.html',
    jsonFile: 'customer-service.json',
    audioDir: '/vocab-audio/customer-service-vocab-audio/',
  },
]

function patchFile(htmlFile: string, jsonFile: string, audioDir: string) {
  const htmlPath = join(process.cwd(), 'resources', htmlFile)
  const jsonPath = join(process.cwd(), 'resources', 'vocab-gap-data', jsonFile)
  let html = readFileSync(htmlPath, 'utf-8')
  const json = readFileSync(jsonPath, 'utf-8').trim()

  if (!html.includes('vsg-shake')) {
    html = html.replace('</style>', `${VSG_STYLES}\n</style>`)
  }

  const instructionOld =
    '<p style="font-size: 16px; margin-bottom: 15px; color: #475569;">Complete the sentences using the correct word or phrase from the vocabulary list.</p>'
  const instructionNew =
    '<p style="font-size: 16px; margin-bottom: 15px; color: #475569;">Drag the word cards from the <strong>scrollable word bank on the right</strong> into the gaps in each sentence, or click a card and then click a gap. Use the <strong>Check answers</strong> button when you are ready.</p>'

  html = html.replace(instructionOld, instructionNew)

  const mount = `<div data-vocab-gap-fill-mount="true" data-vocab-audio-dir="${audioDir}" style="margin-top: 8px;">
      <div class="vocab-series-gap-data" hidden aria-hidden="true">${json}</div>
    </div>`

  if (html.includes('data-vocab-gap-fill-mount')) {
    html = html.replace(
      /<div data-vocab-gap-fill-mount="true"[^>]*>[\s\S]*?<\/div>\s*(?=<\/div>\s*<\/div>\s*\n\n<!-- PAGE 3)/,
      mount + '\n  '
    )
  } else {
    const olStart = html.indexOf('<ol style="padding-left: 25px; font-size: 16px; list-style-type: decimal;">')
    if (olStart === -1) {
      console.error(`Could not find <ol> or mount in ${htmlFile}`)
      process.exit(1)
    }
    const olEnd = html.indexOf('</ol>', olStart)
    if (olEnd === -1) {
      console.error(`Could not find </ol> in ${htmlFile}`)
      process.exit(1)
    }
    html = html.slice(0, olStart) + mount + html.slice(olEnd + 5)
  }
  writeFileSync(htmlPath, html)
  console.log(`Patched ${htmlFile}`)
}

for (const p of PATCHES) {
  patchFile(p.htmlFile, p.jsonFile, p.audioDir)
}
