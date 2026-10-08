-- Real-World English: teacher-curated films, series, podcasts, books and similar links.
-- Students can suggest, rate, and comment. Suggestions and comments stay private until the teacher approves them.
-- Run in the Supabase SQL editor, or via: npx prisma db execute --file supabase-migration-english-outside-class.sql

CREATE TABLE IF NOT EXISTS "EnglishOutsideResource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "whereToFind" TEXT,
  "level" TEXT,
  "topicTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "contentNotes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "suggestedByName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EnglishOutsideResource_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EnglishOutsideResource_status_check" CHECK ("status" IN ('PUBLISHED', 'HIDDEN'))
);

CREATE TABLE IF NOT EXISTS "EnglishOutsideSuggestion" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "format" TEXT NOT NULL,
  "whereToFind" TEXT,
  "whyRecommend" TEXT NOT NULL,
  "studentContentNote" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdResourceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EnglishOutsideSuggestion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EnglishOutsideSuggestion_status_check" CHECK ("status" IN ('PENDING', 'ADDED', 'DECLINED')),
  CONSTRAINT "EnglishOutsideSuggestion_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EnglishOutsideSuggestion_createdResourceId_fkey"
    FOREIGN KEY ("createdResourceId") REFERENCES "EnglishOutsideResource"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EnglishOutsideRating" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "stars" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EnglishOutsideRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EnglishOutsideRating_stars_check" CHECK ("stars" >= 1 AND "stars" <= 5),
  CONSTRAINT "EnglishOutsideRating_resource_student_key" UNIQUE ("resourceId", "studentId"),
  CONSTRAINT "EnglishOutsideRating_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "EnglishOutsideResource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EnglishOutsideRating_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EnglishOutsideComment" (
  "id" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "studentName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EnglishOutsideComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EnglishOutsideComment_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'DECLINED')),
  CONSTRAINT "EnglishOutsideComment_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "EnglishOutsideResource"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "EnglishOutsideComment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "EnglishOutsideResource_status_createdAt_idx"
  ON "EnglishOutsideResource"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "EnglishOutsideSuggestion_status_createdAt_idx"
  ON "EnglishOutsideSuggestion"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "EnglishOutsideSuggestion_studentId_createdAt_idx"
  ON "EnglishOutsideSuggestion"("studentId", "createdAt");

CREATE INDEX IF NOT EXISTS "EnglishOutsideRating_resourceId_idx"
  ON "EnglishOutsideRating"("resourceId");

CREATE INDEX IF NOT EXISTS "EnglishOutsideComment_resourceId_status_idx"
  ON "EnglishOutsideComment"("resourceId", "status");

CREATE INDEX IF NOT EXISTS "EnglishOutsideComment_status_createdAt_idx"
  ON "EnglishOutsideComment"("status", "createdAt");

INSERT INTO "EnglishOutsideResource" (
  "id", "title", "description", "url", "format", "whereToFind", "level",
  "topicTags", "contentNotes", "suggestedByName", "status", "createdAt", "updatedAt"
) VALUES
(
  'eoc-bbc-6-minute',
  'BBC 6 Minute English',
  'A short podcast from BBC Learning English. Each episode explores one topic from the news and teaches a few useful phrases. The presenters speak clearly, and a transcript is available on the website.',
  'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english',
  'podcast',
  'BBC Sounds, or the BBC Learning English website',
  'a1-a2',
  ARRAY['news']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-07 10:00:00',
  TIMESTAMP '2026-03-07 10:00:00'
),
(
  'eoc-paddington-2',
  'Paddington 2',
  'A warm, funny film with clear British English and a story that is easy to follow. A good choice when you want everyday conversation without strong language or violence.',
  'https://www.imdb.com/title/tt4468740/',
  'film',
  'Streaming services',
  'a1-a2',
  ARRAY['comedy', 'family']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-06 10:00:00',
  TIMESTAMP '2026-03-06 10:00:00'
),
(
  'eoc-planet-earth-ii',
  'Planet Earth II',
  'David Attenborough narrates this nature series in rich but clear British English. The pictures help you understand new words. Some scenes show animals hunting.',
  'https://www.bbcearth.com/shows/planet-earth-ii',
  'series',
  'BBC iPlayer, or other streaming services',
  'b1-b2',
  ARRAY['documentary', 'science']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-05 10:00:00',
  TIMESTAMP '2026-03-05 10:00:00'
),
(
  'eoc-ted-talks',
  'TED Talks',
  'Short talks on ideas from science, work, culture and everyday life. Many speakers use clear international English, and you can turn on English subtitles. Pick a subject you already know something about, then watch with the transcript.',
  'https://www.ted.com/talks',
  'youtube',
  'ted.com, the TED app, or YouTube',
  'b1-b2',
  ARRAY['science']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-04 10:00:00',
  TIMESTAMP '2026-03-04 10:00:00'
),
(
  'eoc-harry-potter-audio',
  'Harry Potter and the Philosopher''s Stone (audiobook)',
  'Hearing a long story is excellent listening practice. This audiobook uses clear British English. If you can, follow the words in the book at the same time.',
  'https://www.wizardingworld.com/discover/books',
  'audiobook',
  'Audible, a library, or the printed book alongside the recording',
  'b1-b2',
  ARRAY['family', 'drama']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-03 10:00:00',
  TIMESTAMP '2026-03-03 10:00:00'
),
(
  'eoc-the-office',
  'The Office (UK)',
  'The original BBC workplace comedy, with natural British English, everyday office vocabulary, and a very dry sense of humour. Some episodes include strong language, so it is better suited to adults.',
  'https://www.imdb.com/title/tt0290978/',
  'series',
  'BBC iPlayer, or other streaming services',
  'b1-b2',
  ARRAY['comedy']::TEXT[],
  ARRAY['strong-language']::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-02 10:00:00',
  TIMESTAMP '2026-03-02 10:00:00'
),
(
  'eoc-atomic-habits',
  'Atomic Habits by James Clear',
  'A practical book about building better habits. The English is modern and direct, and the chapters are short. A strong choice if you would rather read something useful than a novel.',
  'https://jamesclear.com/atomic-habits',
  'book',
  'Bookshops, libraries, or an ebook',
  'b2-plus',
  ARRAY['self-help']::TEXT[],
  ARRAY[]::TEXT[],
  NULL,
  'PUBLISHED',
  TIMESTAMP '2026-03-01 10:00:00',
  TIMESTAMP '2026-03-01 10:00:00'
)
ON CONFLICT ("id") DO NOTHING;

NOTIFY pgrst, 'reload schema';
