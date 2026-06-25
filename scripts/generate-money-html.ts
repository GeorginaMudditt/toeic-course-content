/**
 * Generates resources/money-vocabulary-html.html from vocab data.
 * Run: npx tsx scripts/generate-money-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const AUDIO_DIR = '/vocab-audio/money-vocab-audio/'

const VOCAB: ReadonlyArray<{ word: string; french: string; example: string }> = [
  { word: 'salary', french: 'salaire', example: 'Her annual salary increased after the promotion.' },
  { word: 'overtime', french: 'heures supplémentaires', example: 'Employees receive a higher rate for overtime on public holidays.' },
  { word: 'remuneration', french: 'rémunération', example: 'The remuneration package includes a company car and health insurance.' },
  { word: 'compensation', french: 'compensation / indemnisation', example: 'The company offered compensation to customers affected by the error.' },
  { word: 'pension', french: 'retraite / pension', example: 'He contributes to a private pension plan every month.' },
  { word: 'commission', french: 'commission', example: 'She earns a 5% commission on each sale she closes.' },
  { word: 'mortgage', french: 'emprunt immobilier / hypothèque', example: 'They are paying off a 25-year mortgage on their house.' },
  { word: 'share options', french: 'stock-options / options sur actions', example: 'Executives were granted share options as an incentive.' },
  { word: 'bonus', french: 'prime', example: 'The team received a year-end bonus for exceeding their targets.' },
  { word: 'sales', french: 'ventes', example: 'Sales fell by 8% during the summer quarter.' },
  { word: 'target', french: 'objectif', example: 'The sales director set a challenging revenue target for the team.' },
  { word: 'turnover', french: "chiffre d'affaires", example: "The firm's turnover has grown steadily over the past five years." },
  { word: 'forecast', french: 'prévisions', example: 'The finance team published an optimistic sales forecast for next year.' },
  { word: 'budget', french: 'budget', example: 'Marketing must operate within a tight budget this quarter.' },
  { word: 'growth', french: 'croissance', example: 'The company reported strong growth in overseas markets.' },
  { word: 'expenses', french: 'frais / dépenses', example: 'Business travel expenses must be approved in advance.' },
  { word: 'fixed costs', french: 'coûts fixes', example: 'Rent and salaries are examples of fixed costs.' },
  { word: 'variable costs', french: 'coûts variables', example: 'Variable costs increase when production volumes rise.' },
  { word: 'overheads', french: 'frais généraux', example: 'By moving into a new office with shared facilities, the company reduced overheads.' },
  { word: 'margin', french: 'marge (bénéficiaire)', example: 'A slim profit margin left little room for price cuts.' },
]

const DISCUSSION = [
  'What factors should employees consider when comparing salary, bonus, and pension benefits in a job offer?',
  'How can a company balance growth targets with controlling expenses and overheads?',
  'Why might a business choose to offer share options instead of a higher base salary?',
  'What is the difference between fixed costs and variable costs? Give examples from a business you know.',
  'Do you think sales staff should be paid mainly through commission, a fixed salary, or a mix? Why?',
  'What were you taught about managing money at school? What do you think schools should teach about this topic?',
]

const ANSWER_KEY: ReadonlyArray<{ sentence: string; answer: string }> = [
  { sentence: "The union argued that workers' __________ had not kept pace with inflation.", answer: 'remuneration' },
  { sentence: 'Loan repayments are classified as __________ because they do not change with sales volumes.', answer: 'fixed costs' },
  { sentence: 'The contract limits __________ to a maximum of ten hours per week.', answer: 'overtime' },
  { sentence: 'Wholesalers often operate on a narrow __________ of only a few per cent per item.', answer: 'margin' },
  { sentence: 'After forty years with the firm, he retired on a generous company __________.', answer: 'pension' },
  { sentence: 'Weak consumer confidence led to a sharp fall in retail __________ in October.', answer: 'sales' },
  { sentence: 'The bank refused to approve the __________ until the couple improved their credit score.', answer: 'mortgage' },
  { sentence: 'The regional manager questioned whether the new sales __________ of €5 million was realistic.', answer: 'target' },
  { sentence: 'The airline paid generous __________ to passengers whose flights had been cancelled.', answer: 'compensation' },
  { sentence: 'Electricity used in the factory is a __________ that fluctuates with production levels.', answer: 'variable cost' },
  { sentence: 'After the merger, every employee received a one-off __________ of €500.', answer: 'bonus' },
  { sentence: "Despite losing a major contract, the shop's __________ remained above €1 million.", answer: 'turnover' },
  { sentence: 'The project was halted because it had already exceeded its allocated __________.', answer: 'budget' },
  { sentence: 'As part of the deal, the CEO received additional __________ in the newly listed company.', answer: 'share options' },
  { sentence: 'Real estate agents typically receive a __________ when a property sale is completed.', answer: 'commission' },
  { sentence: 'The board criticised the previous sales __________ because it was far too optimistic.', answer: 'forecast' },
  { sentence: 'The start-up achieved rapid __________ by expanding into three new markets simultaneously.', answer: 'growth' },
  { sentence: 'Negotiations focused on a higher base __________ before any benefits were discussed.', answer: 'salary' },
  { sentence: 'Managers questioned whether the hotel bill was a legitimate business __________.', answer: 'expense' },
  { sentence: 'The accountant reviewed the monthly __________ to find areas where spending could be cut.', answer: 'overheads' },
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

const gapJson = readFileSync(join(process.cwd(), 'resources', 'vocab-gap-data', 'money.json'), 'utf-8').trim()

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
    <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Money</h1>
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

writeFileSync(join(process.cwd(), 'resources', 'money-vocabulary-html.html'), html)
console.log('Wrote resources/money-vocabulary-html.html')
