/**
 * Generates resources/finance-and-the-economy-vocabulary-html.html from vocab data.
 * Run: npx tsx scripts/generate-finance-and-the-economy-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TITLE = 'Finance and the Economy'
const AUDIO_DIR = '/vocab-audio/finance-and-the-economy-vocab-audio/'

const VOCAB: ReadonlyArray<{ word: string; french: string; example: string }> = [
  { word: 'current account', french: 'compte courant', example: 'She uses her current account for everyday payments and direct debits.' },
  { word: 'joint account', french: 'compte joint', example: 'They opened a joint account to manage household expenses more easily.' },
  { word: 'credit card', french: 'carte de crédit', example: 'Paying the full credit card balance each month avoids costly interest charges.' },
  { word: 'interest', french: 'intérêts', example: 'The central bank raised interest rates to curb inflation.' },
  { word: 'overdraft', french: 'découvert (bancaire)', example: 'The company relied on a short-term overdraft to cover its payroll.' },
  { word: 'savings', french: 'épargne', example: 'Robust household savings can cushion the impact of an economic downturn.' },
  { word: 'balance', french: 'solde', example: 'The treasurer reviewed the account balance before authorising the transfer.' },
  { word: 'to borrow', french: 'emprunter', example: 'The start-up had to borrow heavily to finance its expansion abroad.' },
  { word: 'financial', french: 'financier / financière', example: 'The board published a detailed financial statement for shareholders.' },
  { word: 'loan', french: 'prêt / emprunt', example: 'The firm secured a five-year loan at a fixed rate of 4.2%.' },
  { word: 'broker', french: 'courtier', example: 'An independent broker negotiated better insurance terms on their behalf.' },
  { word: 'trader', french: 'trader / opérateur de marché', example: 'An experienced commodity trader anticipated the rise in oil prices.' },
  { word: 'investor', french: 'investisseur', example: 'Long-term investors remained cautious amid volatile market conditions.' },
  { word: 'currency', french: 'devise / monnaie', example: 'A weaker domestic currency made exports more competitive overseas.' },
  { word: 'commodities', french: 'matières premières', example: 'Rising commodity prices pushed up manufacturing costs across the sector.' },
  { word: 'stock market', french: 'marché boursier', example: 'The stock market recovered after the government\'s stimulus announcement.' },
  { word: 'trade', french: 'commerce / échanges', example: 'Bilateral trade between the two countries reached a record €12 billion.' },
  { word: 'economic', french: 'économique', example: 'Weak economic indicators pointed to slower growth in the coming quarter.' },
  { word: 'deficit', french: 'déficit', example: 'The government aims to reduce the budget deficit within three years.' },
  { word: 'recession', french: 'récession', example: 'Analysts warned that rising unemployment could tip the economy into recession.' },
]

const DISCUSSION = [
  'What are the advantages and risks of keeping most of your money in a current account rather than in savings?',
  'How can a weaker currency affect a country\'s exports, imports, and inflation?',
  'Why might a government run a budget deficit, and when does it become a serious problem?',
  'What is the difference between a broker, a trader, and an investor? Which role interests you most, and why?',
  'How do rising interest rates influence household borrowing, business investment, and the stock market?',
  'What signs might suggest that an economy is heading towards recession?',
]

const ANSWER_KEY: ReadonlyArray<{ sentence: string; answer: string }> = [
  { sentence: 'They use their __________ for everyday payments and direct debits.', answer: 'current account' },
  { sentence: 'The couple opened a __________ to manage shared household expenses.', answer: 'joint account' },
  { sentence: 'Paying the full __________ balance each month helps avoid costly interest charges.', answer: 'credit card' },
  { sentence: 'The central bank raised __________ rates to slow inflation.', answer: 'interest' },
  { sentence: 'The firm relied on a short-term __________ to cover its monthly payroll.', answer: 'overdraft' },
  { sentence: 'Strong household __________ can cushion the impact of an economic downturn.', answer: 'savings' },
  { sentence: 'The treasurer checked the account __________ before authorising the transfer.', answer: 'balance' },
  { sentence: 'The start-up had to __________ heavily to finance its overseas expansion.', answer: 'borrow' },
  { sentence: 'The board published a detailed __________ statement for shareholders.', answer: 'financial' },
  { sentence: 'The company secured a five-year __________ at a fixed rate of 4.2%.', answer: 'loan' },
  { sentence: 'An independent __________ negotiated better insurance terms on their behalf.', answer: 'broker' },
  { sentence: 'An experienced commodity __________ anticipated the rise in oil prices.', answer: 'trader' },
  { sentence: 'Long-term __________ remained cautious amid volatile market conditions.', answer: 'investors' },
  { sentence: 'A weaker domestic __________ made exports more competitive overseas.', answer: 'currency' },
  { sentence: 'Rising __________ prices pushed up manufacturing costs across the sector.', answer: 'commodities' },
  { sentence: 'The __________ recovered after the government\'s stimulus announcement.', answer: 'stock market' },
  { sentence: 'Bilateral __________ between the two countries reached a record €12 billion.', answer: 'trade' },
  { sentence: 'Weak __________ indicators pointed to slower growth in the coming quarter.', answer: 'economic' },
  { sentence: 'The government aims to reduce the budget __________ within three years.', answer: 'deficit' },
  { sentence: 'Analysts warned that rising unemployment could tip the economy into __________.', answer: 'recession' },
]

function slug(word: string): string {
  return word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function listenCell(word: string): string {
  const id = `audio-${slug(word)}`
  const src = `${AUDIO_DIR}${word}.mp3`
  return `<div onclick="document.getElementById('${id}').play()" style="display: inline-block; background: linear-gradient(135deg, #ba3627 0%, #9a2d21 100%); color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(186,54,39,0.3); transition: transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🔊 Listen</div><audio id="${id}" preload="auto"><source src="${src}" type="audio/mpeg"></audio>`
}

function vocabRows(): string {
  return VOCAB.map((item, i) => {
    const bg = i % 2 === 1 ? ' style="background: #e8eaf6;"' : ''
    return `        <tr${bg}>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 16px; font-weight: bold; color: #1e293b;">${item.word}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 16px;">${listenCell(item.word)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 16px; font-style: italic; color: #64748b;">${item.french}</td>
          <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 16px;">${item.example}</td>
        </tr>`
  }).join('\n')
}

function discussionItems(): string {
  return DISCUSSION.map((q, i) => {
    const mb = i < DISCUSSION.length - 1 ? '15px' : '0'
    return `        <li style="margin-bottom: ${mb}; padding: 10px; background: white; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${q}</li>`
  }).join('\n')
}

function answerKeyItems(): string {
  return ANSWER_KEY.map((item) => {
    const html = item.sentence.replace('__________', `<strong style="color: #38438f;">${item.answer}</strong>`)
    return `        <li style="margin-bottom: 10px; padding: 8px; background: #f5e6e4; border-radius: 4px;">${html}</li>`
  }).join('\n')
}

const VSG_STYLES = readFileSync(join(process.cwd(), 'scripts', 'patch-vocab-gap-html.ts'), 'utf-8')
  .match(/const VSG_STYLES = `([\s\S]*?)`/)?.[1] ?? ''

const gapJson = readFileSync(join(process.cwd(), 'resources', 'vocab-gap-data', 'finance-and-the-economy.json'), 'utf-8').trim()

const html = `<!-- PAGE 1: Vocabulary List -->
<style>
  @media print {
    @page { margin: 1.5cm; }
    body { margin: 0; padding: 0; }
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; break-inside: avoid; }
    .keep-together { page-break-inside: avoid; break-inside: avoid; }
    h2, h3 { page-break-after: avoid; break-after: avoid; }
    table { page-break-inside: avoid; break-inside: avoid; }
    ul, ol { page-break-inside: avoid; break-inside: avoid; }
  }
${VSG_STYLES}
</style>
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.5; color: #333; background: linear-gradient(to bottom, #e8eaf6, #ffffff);">

  <div style="text-align: center; margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #38438f 0%, #2d3569 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(56,67,143,0.3);" class="no-break">
    <div style="display: inline-block; margin-bottom: 8px;">
      <img src="/brizzle-logo.png" alt="Brizzle Logo" style="width: 50px; height: 50px; object-fit: contain; background: white; padding: 5px; border-radius: 50%;" />
    </div>
    <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${TITLE}</h1>
  </div>

  <div style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" class="keep-together">
    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #38438f; border-bottom: 3px solid #38438f; padding-bottom: 8px;">Part 1: Vocabulary List with Pronunciation and Translation</h2>

    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 16px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" class="no-break">
      <thead>
        <tr style="background: linear-gradient(135deg, #38438f 0%, #2d3569 100%);">
          <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-weight: bold; font-size: 16px; width: 25%; color: white;">Word/Phrase</th>
          <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-weight: bold; font-size: 16px; width: 15%; color: white;">Pronunciation</th>
          <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-weight: bold; font-size: 16px; width: 20%; color: white;">French Translation</th>
          <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-weight: bold; font-size: 16px; width: 40%; color: white;">Example Sentence</th>
        </tr>
      </thead>
      <tbody>
${vocabRows()}
      </tbody>
    </table>
  </div>
</div>

<!-- PAGE 2: Gap Fill Exercise -->
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.5; color: #333; background: linear-gradient(to bottom, #f5e6e4, #ffffff);" class="page-break">

  <div style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" class="keep-together">
    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #ba3627; border-bottom: 3px solid #ba3627; padding-bottom: 8px;">Part 2: Gap Fill Exercise</h2>
    <p style="font-size: 16px; margin-bottom: 15px; color: #475569;">Drag the word cards from the <strong>scrollable word bank on the right</strong> into the gaps in each sentence, or click a card and then click a gap. Use the <strong>Check answers</strong> button when you are ready.</p>

    <div data-vocab-gap-fill-mount="true" data-vocab-audio-dir="${AUDIO_DIR}" style="margin-top: 8px;">
      <div class="vocab-series-gap-data" hidden aria-hidden="true">${gapJson}</div>
    </div>
  </div>
</div>

<!-- PAGE 3: Discussion Questions -->
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.5; color: #333; background: linear-gradient(to bottom, #e8eaf6, #ffffff);" class="page-break">

  <div style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" class="keep-together">
    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #38438f; border-bottom: 3px solid #38438f; padding-bottom: 8px;">Part 3: Discussion Questions</h2>
    <p style="font-size: 16px; margin-bottom: 15px; color: #475569;">Use the vocabulary from this worksheet to answer the following questions.</p>

    <div style="background: linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%); padding: 20px; border-radius: 10px; border-left: 5px solid #38438f; box-shadow: 0 2px 4px rgba(56,67,143,0.1);">
      <ol style="padding-left: 25px; font-size: 16px; list-style-type: decimal; margin: 0;">
${discussionItems()}
      </ol>
    </div>
  </div>
</div>

<!-- PAGE 4: Answer Key -->
<div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; line-height: 1.5; color: #333; background: linear-gradient(to bottom, #e8eaf6, #ffffff);" class="page-break">

  <div style="margin-top: 30px; padding-top: 20px; border-top: 3px solid #38438f;" class="no-break">
    <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 20px; color: white; text-align: center; padding: 15px; background: linear-gradient(135deg, #38438f 0%, #2d3569 100%); border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">📝 Answer Key</h2>

    <div style="margin-bottom: 20px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <h3 style="font-size: 22px; font-weight: bold; margin-bottom: 15px; color: #ba3627; border-bottom: 2px solid #ba3627; padding-bottom: 6px;">Part 2: Gap Fill Exercise</h3>
      <ol style="padding-left: 25px; font-size: 16px; list-style-type: decimal;">
${answerKeyItems()}
      </ol>
    </div>
  </div>
</div>
`

writeFileSync(join(process.cwd(), 'resources', 'finance-and-the-economy-vocabulary-html.html'), html)
console.log('Wrote resources/finance-and-the-economy-vocabulary-html.html')
