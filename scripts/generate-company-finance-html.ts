/**
 * Generates resources/company-finance-vocabulary-html.html from vocab data.
 * Run: npx tsx scripts/generate-company-finance-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TITLE = 'Vocabulary: Company Finance'
const AUDIO_DIR = '/vocab-audio/company-finance-vocab-audio/'

const VOCAB: ReadonlyArray<{ word: string; french: string; example: string }> = [
  { word: 'profit and loss', french: 'compte de résultat', example: 'The finance director reviewed the profit and loss statement before presenting the quarterly results.' },
  { word: 'shareholder', french: 'actionnaire', example: 'A major shareholder sold part of its stake after disagreeing with the company\'s strategy.' },
  { word: 'financial year', french: 'exercice comptable', example: 'The financial year ends on 31 December for most UK companies.' },
  { word: 'dividends', french: 'dividendes', example: 'The company increased its dividends for the third consecutive year.' },
  { word: 'accounting', french: 'comptabilité', example: 'External accounting firms audit large corporations to verify their financial records.' },
  { word: 'expenses', french: 'dépenses / charges', example: 'Office rent and staff salaries are typical operating expenses.' },
  { word: 'turnover', french: 'chiffre d\'affaires', example: 'Group turnover rose by 8% despite challenging market conditions.' },
  { word: 'depreciation', french: 'amortissement', example: 'Depreciation of vehicles and machinery reduces the value of fixed assets over time.' },
  { word: 'balance sheet', french: 'bilan', example: 'The balance sheet provides a snapshot of what a company owns and owes at a specific date.' },
  { word: 'assets', french: 'actifs', example: 'The firm\'s assets include warehouses, delivery vehicles, and cash in the bank.' },
  { word: 'market value', french: 'valeur marchande', example: 'The market value of the shares doubled within eighteen months of the IPO.' },
  { word: 'liabilities', french: 'passifs / dettes', example: 'Long-term liabilities such as bank loans must be repaid over several years.' },
  { word: 'equity', french: 'capitaux propres', example: 'Rising equity on the balance sheet indicates that the business is building value for its owners.' },
  { word: 'cashflow', french: 'flux de trésorerie', example: 'Positive cashflow allowed the business to invest in new equipment without borrowing.' },
  { word: 'credit period', french: 'délai de crédit', example: 'The supplier offered a 30-day credit period on all wholesale orders.' },
  { word: 'credit terms', french: 'conditions de crédit', example: 'The credit terms specified that invoices must be paid within 45 days.' },
  { word: 'investment', french: 'investissement', example: 'The board approved a substantial investment in renewable energy technology.' },
  { word: 'net income', french: 'résultat net', example: 'Net income for the year fell slightly, even though revenue increased.' },
  { word: 'yield', french: 'rendement', example: 'The bond\'s yield attracted investors seeking a reliable return with minimal risk.' },
  { word: 'earnings', french: 'bénéfices / résultats', example: 'Strong earnings in the technology division offset weaker performance elsewhere.' },
]

const DISCUSSION = [
  'What kinds of expenses do many companies have? How are these typical expenses changing over the years?',
  'A company reports strong earnings, but employees say their salaries have barely increased. What questions might you ask?',
  'What financial results do you think a company should have to publish at the end of each financial year and why? Should this differ depending on the sector or the size of the company?',
  'What are the advantages and disadvantages for the supplier and the customer when a supplier offers a 30-day or 90-day credit period instead of asking for immediate payment?',
  'What is the difference between turnover and profit? How would you explain this to a high school student who wants to run their own business in the future? Try explaining with a simple example, such as a shop or café.',
  'What can we learn about managing our own money from the way companies manage theirs - and how should we go about teaching this to teenagers?',
]

const ANSWER_KEY: ReadonlyArray<{ sentence: string; answer: string }> = [
  { sentence: 'Before the board meeting, the CFO analysed the latest __________ statement to compare revenue with costs.', answer: 'profit and loss' },
  { sentence: 'Any __________ who owns more than 3% of the voting shares must disclose their holding to the regulator.', answer: 'shareholder' },
  { sentence: 'Because its __________ ends in March, the company publishes its annual results in May.', answer: 'financial year' },
  { sentence: 'Rather than reinvesting all the profits, the firm chose to pay higher __________ to its investors.', answer: 'dividends' },
  { sentence: 'International __________ rules require subsidiaries to be included in the parent company\'s consolidated figures.', answer: 'accounting' },
  { sentence: 'The audit revealed that several personal __________ had wrongly been charged to the company account.', answer: 'expenses' },
  { sentence: 'Despite losing one major client, the group\'s __________ still grew by 3% last year.', answer: 'turnover' },
  { sentence: 'Each year, __________ is charged against the value of the firm\'s buildings and equipment.', answer: 'depreciation' },
  { sentence: 'At the year-end, the auditor verified every figure on the __________ before signing off the accounts.', answer: 'balance sheet' },
  { sentence: 'The company\'s __________ were valued at €120 million, including property, stock, and cash.', answer: 'assets' },
  { sentence: 'After the takeover bid was announced, the __________ of the company\'s shares jumped by 25%.', answer: 'market value' },
  { sentence: 'Total __________ had risen to €80 million, mainly due to new borrowing and unpaid supplier invoices.', answer: 'liabilities' },
  { sentence: 'The founders retained a 40% __________ stake in the business after the private investment round.', answer: 'equity' },
  { sentence: 'The business was profitable on paper, but weak __________ made it difficult to meet payroll each month.', answer: 'cashflow' },
  { sentence: 'Wholesale customers were granted a 90-day __________, giving them three months to settle invoices.', answer: 'credit period' },
  { sentence: 'The __________ offered by the manufacturer included a 5% discount for early payment.', answer: 'credit terms' },
  { sentence: 'The board\'s decision to approve a major __________ in automation was welcomed by the production team.', answer: 'investment' },
  { sentence: 'In the annual accounts, the figure labelled "__________" represents profit after tax and all other charges.', answer: 'net income' },
  { sentence: 'Investors comparing fixed-income products often look at the __________ offered by each bond.', answer: 'yield' },
  { sentence: 'House prices have risen by 48%, while average __________ have increased by only 5% over the same period.', answer: 'earnings' },
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

const gapJson = readFileSync(join(process.cwd(), 'resources', 'vocab-gap-data', 'company-finance.json'), 'utf-8').trim()

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

writeFileSync(join(process.cwd(), 'resources', 'company-finance-vocabulary-html.html'), html)
console.log('Wrote resources/company-finance-vocabulary-html.html')
