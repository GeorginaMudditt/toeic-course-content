-- ============================================
-- Check Audio URLs in Vocabulary Database
-- ============================================
-- Run this in Supabase SQL Editor to check audio URL formats
-- This helps diagnose why some audio files work and others don't

-- 1. Check all topics and their audio URL formats
SELECT 
    topic_page,
    word_english,
    pron_english,
    CASE 
        WHEN pron_english IS NULL THEN 'NULL'
        WHEN pron_english = '' THEN 'EMPTY'
        WHEN pron_english LIKE 'http://%' OR pron_english LIKE 'https://%' THEN 'FULL_URL'
        WHEN pron_english LIKE '/storage/%' THEN 'STORAGE_PATH'
        WHEN pron_english LIKE 'storage/%' THEN 'STORAGE_PATH_NO_SLASH'
        WHEN pron_english LIKE '/uploads/%' OR pron_english LIKE 'uploads/%' THEN 'UPLOADS_PATH'
        ELSE 'OTHER_FORMAT'
    END as url_format,
    LENGTH(pron_english) as url_length
FROM "Brizzle_A1_vocab"
WHERE pron_english IS NOT NULL AND pron_english != ''
ORDER BY topic_page, word_english;

-- 2. Check specific topics mentioned by user
SELECT 
    topic_page,
    word_english,
    pron_english,
    CASE 
        WHEN pron_english IS NULL THEN 'NULL'
        WHEN pron_english = '' THEN 'EMPTY'
        WHEN pron_english LIKE 'http://%' OR pron_english LIKE 'https://%' THEN 'FULL_URL'
        WHEN pron_english LIKE '/storage/%' THEN 'STORAGE_PATH'
        WHEN pron_english LIKE 'storage/%' THEN 'STORAGE_PATH_NO_SLASH'
        WHEN pron_english LIKE '/uploads/%' OR pron_english LIKE 'uploads/%' THEN 'UPLOADS_PATH'
        ELSE 'OTHER_FORMAT'
    END as url_format
FROM "Brizzle_A1_vocab"
WHERE topic_page ILIKE '%season%' 
   OR topic_page ILIKE '%holiday%'
   OR topic_page ILIKE '%travel%'
   OR topic_page ILIKE '%transport%'
ORDER BY topic_page, word_english;

-- 3. Count URLs by format for each topic
SELECT 
    topic_page,
    COUNT(*) as total_words,
    COUNT(pron_english) as words_with_audio,
    COUNT(CASE WHEN pron_english LIKE 'http://%' OR pron_english LIKE 'https://%' THEN 1 END) as full_urls,
    COUNT(CASE WHEN pron_english LIKE '/storage/%' OR pron_english LIKE 'storage/%' THEN 1 END) as storage_paths,
    COUNT(CASE WHEN pron_english LIKE '/uploads/%' OR pron_english LIKE 'uploads/%' THEN 1 END) as uploads_paths,
    COUNT(CASE WHEN pron_english IS NOT NULL AND pron_english != '' 
               AND pron_english NOT LIKE 'http://%' 
               AND pron_english NOT LIKE 'https://%'
               AND pron_english NOT LIKE '/storage/%'
               AND pron_english NOT LIKE 'storage/%'
               AND pron_english NOT LIKE '/uploads/%'
               AND pron_english NOT LIKE 'uploads/%'
               THEN 1 END) as other_formats
FROM "Brizzle_A1_vocab"
GROUP BY topic_page
ORDER BY topic_page;

-- 4. Find words with potentially problematic URLs
SELECT 
    topic_page,
    word_english,
    pron_english
FROM "Brizzle_A1_vocab"
WHERE pron_english IS NOT NULL 
  AND pron_english != ''
  AND pron_english NOT LIKE 'http://%'
  AND pron_english NOT LIKE 'https://%'
  AND pron_english NOT LIKE '/storage/%'
  AND pron_english NOT LIKE 'storage/%'
ORDER BY topic_page, word_english;
