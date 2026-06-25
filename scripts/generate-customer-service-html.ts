/**
 * Generates resources/customer-service-vocabulary-html.html from vocab data.
 * Run: npx tsx scripts/generate-customer-service-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const AUDIO_DIR = '/vocab-audio/customer-service-vocab-audio/'

const VOCAB: ReadonlyArray<{ word: string; french: string; example: string }> = [
  { word: 'customer', french: 'client / consommateur', example: 'The customer was happy with the support she received.' },
  { word: 'client', french: 'client', example: 'Our company has several international clients.' },
  { word: 'satisfaction', french: 'satisfaction', example: 'Customer satisfaction is one of our main priorities.' },
  { word: 'complaint', french: 'réclamation / plainte', example: 'The manager dealt with a complaint about a delayed delivery.' },
  { word: 'to handle', french: 'gérer', example: 'She knows how to handle difficult situations professionally.' },
  { word: 'to resolve', french: 'résoudre', example: 'We resolved the issue within 24 hours.' },
  { word: 'query', french: 'demande / question', example: 'If you have a query, please contact our support team.' },
  { word: 'feedback', french: "retour d'expérience / commentaires", example: 'We encourage customers to leave feedback after their purchase.' },
  { word: 'after-sales service', french: 'service après-vente (SAV)', example: 'Good after-sales service helps build customer loyalty.' },
  { word: 'guarantee', french: 'garantie', example: 'This product comes with a two-year guarantee.' },
  { word: 'refund', french: 'remboursement', example: 'The customer requested a refund for the damaged item.' },
  { word: 'exchange', french: 'échange', example: 'The store offered an exchange instead of a refund.' },
  { word: 'faulty', french: 'défectueux', example: 'The customer returned a faulty charger.' },
  { word: 'defective', french: 'défectueux', example: 'Several defective products were removed from the shelves.' },
  { word: 'apology', french: 'excuses', example: 'The company sent a formal apology for the inconvenience.' },
  { word: 'response time', french: 'délai de réponse', example: 'Our average response time is under two hours.' },
  { word: 'retention', french: 'fidélisation', example: 'Customer retention is cheaper than finding new customers.' },
  { word: 'courteous', french: 'courtois / poli', example: 'The receptionist was very courteous and helpful.' },
  { word: 'escalation', french: "escalade (d'un problème)", example: 'The issue required escalation to the technical department.' },
  { word: 'service standards', french: 'normes de service', example: "All employees must follow the company's service standards." },
]

const DISCUSSION = [
  'Think about a time when you received excellent customer service. What made you satisfied with the experience?',
  'Have you ever made a complaint to a company? How did they handle it? Were they able to resolve the issue?',
  'Why is customer feedback important for businesses? How can companies use it to improve customer satisfaction?',
  'What should a company do if it sells a faulty or defective product? Should customers always receive a refund or an exchange?',
  'Why are response time and courteous communication important in customer service?',
  'What can companies do to improve customer retention and encourage clients to stay loyal?',
]

const ANSWER_KEY: ReadonlyArray<{ sentence: string; answer: string }> = [
  { sentence: 'The __________ contacted us because his order arrived late.', answer: 'customer' },
  { sentence: 'We received a __________ from a customer who was unhappy with the product quality.', answer: 'complaint' },
  { sentence: 'Our team aims to improve customer __________ through excellent service.', answer: 'satisfaction' },
  { sentence: 'If you have a __________ about your invoice, please email our accounts department.', answer: 'query' },
  { sentence: 'The support agent was able __________ the problem quickly and efficiently.', answer: 'to resolve' },
  { sentence: 'It is important to __________ difficult customers calmly and professionally.', answer: 'to handle' },
  { sentence: 'The company provides excellent __________ for all electronic products.', answer: 'after-sales service' },
  { sentence: 'Every new __________ receives a welcome call from their account manager.', answer: 'client' },
  { sentence: "The laptop is still covered by the manufacturer's __________.", answer: 'guarantee' },
  { sentence: 'The customer requested a full __________ after receiving the wrong item.', answer: 'refund' },
  { sentence: 'We offered an __________ because the customer preferred a different size.', answer: 'exchange' },
  { sentence: 'The technician confirmed that the printer was __________ and needed replacing.', answer: 'faulty' },
  { sentence: 'Several __________ units were discovered during the quality inspection.', answer: 'defective' },
  { sentence: 'The manager sent a written __________ for the delivery delay.', answer: 'apology' },
  { sentence: 'Our average __________ is less than four hours during business days.', answer: 'response time' },
  { sentence: 'Customer __________ is a key objective for subscription-based businesses.', answer: 'retention' },
  { sentence: 'The employee remained __________ even when the customer became frustrated.', answer: 'courteous' },
  { sentence: 'The issue required __________ to a senior manager.', answer: 'escalation' },
  { sentence: 'We regularly collect __________ to improve our services.', answer: 'feedback' },
  { sentence: "All staff must follow the company's __________ when speaking with customers.", answer: 'service standards' },
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

const gapJson = readFileSync(join(process.cwd(), 'resources', 'vocab-gap-data', 'customer-service.json'), 'utf-8').trim()

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
    <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Customer Service</h1>
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

writeFileSync(join(process.cwd(), 'resources', 'customer-service-vocabulary-html.html'), html)
console.log('Wrote resources/customer-service-vocabulary-html.html')
