/**
 * Generates resources/publishing-vocabulary-html.html from vocab data.
 * Run: npx tsx scripts/generate-publishing-html.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TITLE = 'Vocabulary: Publishing'
const AUDIO_DIR = '/vocab-audio/publishing-vocab-audio/'

const VOCAB: ReadonlyArray<{ word: string; french: string; example: string }> = [
  { word: 'manuscript', french: 'manuscrit', example: 'She spent three years writing the manuscript before she let anyone else read it.' },
  { word: 'literary', french: 'littéraire', example: 'The novel won a literary prize for its beautiful writing and original story.' },
  { word: 'submission', french: 'soumission (d\'un manuscrit)', example: 'His first submission was rejected, but a different publisher accepted the second one.' },
  { word: 'protagonist', french: 'protagoniste', example: 'Readers often sympathise with the protagonist, even when that character makes mistakes.' },
  { word: 'narrative', french: 'récit', example: 'A clear narrative helps the reader follow what happens from the first page to the last.' },
  { word: 'editorial', french: 'éditorial', example: 'The editorial team decides which books fit the publisher\'s list and how each one should be shaped.' },
  { word: 'copyright', french: 'droit d\'auteur', example: 'Copyright means other people cannot copy an author\'s work without permission.' },
  { word: 'blurb', french: 'texte de quatrième de couverture', example: 'A good blurb makes you want to open the book, without revealing how the story ends.' },
  { word: 'forthcoming title', french: 'titre à paraître', example: 'The publisher announced a forthcoming title by a well-known crime writer.' },
  { word: 'advance', french: 'à-valoir', example: 'An advance is money the publisher pays the author before the book goes on sale.' },
  { word: 'royalties', french: 'redevances', example: 'Authors earn royalties each time a bookshop sells a copy of their book.' },
  { word: 'book launch', french: 'lancement d\'un livre', example: 'The book launch included a short reading and time for readers to ask questions.' },
  { word: 'foreign rights', french: 'droits étrangers', example: 'Selling the foreign rights lets another publisher bring the book out in a different country.' },
  { word: 'translation', french: 'traduction', example: 'A good translation keeps the voice of the original book in a new language.' },
  { word: 'print run', french: 'tirage', example: 'A small print run is safer for a first novel, because unsold copies are expensive to store.' },
  { word: 'pitch', french: 'pitch / argumentaire', example: 'A strong pitch can persuade an editor to read the full story, not just the first page.' },
  { word: 'synopsis', french: 'synopsis', example: 'Editors often ask for a synopsis so they can see the whole plot before they read every chapter.' },
  { word: 'editing', french: 'révision éditoriale', example: 'Editing improves the structure and clarity of a book; it is more than correcting spelling.' },
  { word: 'proofreading', french: 'correction d\'épreuves', example: 'Proofreading comes after editing and looks for small errors such as typos and missing commas.' },
  { word: 'book fair', french: 'salon du livre', example: 'A book fair is a large event where publishers show new books to booksellers and readers.' },
]

const DISCUSSION = [
  'What makes a good blurb, and how is it different from a synopsis? Which one would you read before buying a novel, and why?',
  'If you were a first-time author, would you rather receive a large advance or higher royalties? What are the risks of each?',
  'Why might a publisher print only a small number of copies of a first novel? What could go wrong with a very large print run?',
  'You are organising a book launch for a novel you love. Who would you invite, and what would you want people to do there?',
  'A novel is first published in English. Why might the publisher also sell the foreign rights, and what does a translation need to do well?',
  'What is the difference between editing and proofreading? Why do both matter before a book is printed and sold?',
]

const ANSWER_KEY: ReadonlyArray<{ sentence: string; answer: string }> = [
  { sentence: 'The novel still existed only as a __________ on the author\'s laptop: 90,000 words, and not yet a printed book.', answer: 'manuscript' },
  { sentence: 'The award is only for __________ fiction, so cookbooks, textbooks and sports biographies cannot be entered.', answer: 'literary' },
  { sentence: 'The guidelines explain how to prepare a __________: a short letter, a one-page summary, and the first three chapters.', answer: 'submission' },
  { sentence: 'For most of the story, readers follow Maya, the __________, as she tries to save her family\'s bookshop.', answer: 'protagonist' },
  { sentence: 'The __________ jumps between three decades, so the reader has to piece the family history together.', answer: 'narrative' },
  { sentence: 'At the weekly __________ meeting, the team argued about whether the ending was too sad for their readers.', answer: 'editorial' },
  { sentence: 'Without the author\'s permission, posting whole chapters online would break __________.', answer: 'copyright' },
  { sentence: 'The __________ printed on the back cover made the novel sound exciting, but it carefully hid the final twist.', answer: 'blurb' },
  { sentence: 'Booksellers can already order the novel, even though it is still listed as a __________ and will not reach the shops until October.', answer: 'forthcoming title' },
  { sentence: 'The contract offered an __________ of €12,000, paid in three parts before the book went on sale.', answer: 'advance' },
  { sentence: 'After the book had earned back that first payment, the writer began to receive __________ of 8% on every copy sold.', answer: 'royalties' },
  { sentence: 'On publication day, the author read two pages aloud at the __________ and then signed copies for people in the queue.', answer: 'book launch' },
  { sentence: 'The agent sold the __________ to publishers in Italy and Korea, so each country can bring out its own edition.', answer: 'foreign rights' },
  { sentence: 'The Spanish __________ took eight months, because the translator wanted the jokes to work for readers in Madrid.', answer: 'translation' },
  { sentence: 'The publisher printed 4,000 copies in the first __________ and waited to see if bookshops asked for more.', answer: 'print run' },
  { sentence: 'Standing by the editor\'s stand, the agent gave a two-minute spoken __________ about why commuters would buy this novel.', answer: 'pitch' },
  { sentence: 'Unlike the back-cover text, the __________ gave away the ending so the editor could judge the whole plot.', answer: 'synopsis' },
  { sentence: 'During __________, the editor asked the writer to cut a side character and make chapter four easier to follow.', answer: 'editing' },
  { sentence: 'The final check is __________: someone looks for typos and missing commas, but does not change the story.', answer: 'proofreading' },
  { sentence: 'At the London __________, hundreds of publishers set up stands so they can meet booksellers and show their new books.', answer: 'book fair' },
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

const gapJson = readFileSync(join(process.cwd(), 'resources', 'vocab-gap-data', 'publishing.json'), 'utf-8').trim()

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

writeFileSync(join(process.cwd(), 'resources', 'publishing-vocabulary-html.html'), html)
console.log('Wrote resources/publishing-vocabulary-html.html')
