#!/bin/bash

# Update ALL HTML resources in the Supabase database (grammar, vocabulary, speaking, tests).
# Run this after changing HTML files to push updates to the database.
#
# Uses Supabase credentials from .env.local (loaded automatically).
# For the LIVE site: put the same NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
# from Netlify into .env.local once; then this script always updates production.
#
# When adding a new resource, add a line below (exact or partial match for DB title).

echo "🔄 Updating all HTML resources in the database..."
echo ""

# Grammar worksheets
npm run update:resource:supabase "Adjectives" "adjectives-html.html"
npm run update:resource:supabase "Comparative and Superlative Adjectives" "comparative-and-superlative-adjectives-html.html"
npm run update:resource:supabase "Conditionals: Zero, First, Second" "conditionals-zero-first-second-html.html"
npm run update:resource:supabase "Conditionals: Third, Mixed" "conditionals-third-mixed-html.html"
npm run update:resource:supabase "Ellipsis and Substitution" "ellipsis-and-substitution-html.html"
npm run update:resource:supabase "Future Continuous" "future-continuous-html.html"
npm run update:resource:supabase "Future Perfect" "future-perfect-html.html"
npm run update:resource:supabase "Future Tenses" "future-tenses-html.html"
npm run update:resource:supabase "Gerunds and Infinitives" "gerunds-and-infinitives-html.html"
npm run update:resource:supabase "Inversion" "inversion-html.html"
npm run update:resource:supabase "Irregular Verbs" "irregular-verbs-html.html"
npm run update:resource:supabase "Travel English Lesson 1" "travel-english-lesson-1-html.html"
npm run update:resource:supabase "Travel English Lesson 2" "travel-english-lesson-2-html.html"
npm run update:resource:supabase "Travel English Lesson 3" "travel-english-lesson-3-html.html"
npm run update:resource:supabase "Travel English Lesson 5" "travel-english-lesson-5-html.html"
npm run update:resource:supabase "Travel English Lesson 6" "travel-english-lesson-6-html.html"
npm run update:resource:supabase "Travel English Lesson 7" "travel-english-lesson-7-html.html"
npm run update:resource:supabase "Greetings, Numbers and Letters" "greetings-numbers-and-letters-html.html"
npm run update:resource:supabase "Presenting Services and Products" "presenting-services-and-products-html.html"
npm run update:resource:supabase "Giving Information and Answering Questions" "giving-information-and-answering-questions-html.html"
npm run update:resource:supabase "Modal Verbs" "modal-verbs-html.html"
npm run update:resource:supabase "Mixed Tense Review" "mixed-tense-review-html.html"
npm run update:resource:supabase "Mixed Past Tenses" "mixed-past-tenses-html.html"
npm run update:resource:supabase "Mixed Tense Review 2" "mixed-tense-review-2-html.html"
npm run update:resource:supabase "Mixed Tenses" "mixed-tenses-html.html"
npm run update:resource:supabase "Passive Voice 1" "passive-voice-1-html.html"
npm run update:resource:supabase "Passive Voice 2" "passive-voice-2-html.html"
npm run update:resource:supabase "Prepositions of Time and Place" "prepositions-of-time-and-place-html.html"
npm run update:resource:supabase "Advanced Prepositions" "advanced-prepositions-html.html"
npm run update:resource:supabase "Past Continuous" "past-continuous-html.html"
npm run update:resource:supabase "Past Perfect" "past-perfect-html.html"
npm run update:resource:supabase "Past Perfect: Simple and Continuous" "past-perfect-simple-and-continuous-html.html"
npm run update:resource:supabase "Past Simple" "past-simple-html.html"
npm run update:resource:supabase "Past Simple and Past Continuous" "past-simple-and-past-continuous-html.html"
npm run update:resource:supabase "Present Continuous" "present-continuous-html.html"
npm run update:resource:supabase "Present Perfect Continuous" "present-perfect-continuous-html.html"
npm run update:resource:supabase "Present Perfect Simple" "present-perfect-simple-html.html"
npm run update:resource:supabase "Present Simple: other verbs" "present-simple-other-verbs-html.html"
npm run update:resource:supabase 'Present Simple: the verb "to be"' "present-simple-the-verb-to-be-html.html"
npm run update:resource:supabase "Present Simple to be" "present-simple-to-be-html.html"
npm run update:resource:supabase "Reflexive Pronouns" "reflexive-pronouns-html.html"
npm run update:resource:supabase "Relative Clauses" "relative-clauses-html.html"
npm run update:resource:supabase "Reported Speech" "reported-speech-html.html"
npm run update:resource:supabase "Subjunctive" "subjunctive-html.html"
npm run update:resource:supabase "Tense Review" "tense-review-html.html"
npm run update:resource:supabase "Used to and Be used to" "used-to-and-be-used-to-html.html"
npm run update:resource:supabase "Used to Be used to" "used-to-be-used-to-html.html"

# Vocabulary
npm run update:resource:supabase "Jobs, People" "jobs-people-organisations-vocabulary-html.html"
npm run update:resource:supabase "Telephoning and Writing" "telephoning-writing-vocabulary-html.html"
npm run update:resource:supabase "Business travel" "travel-vocabulary-html.html"
npm run update:resource:supabase "Customer Service" "customer-service-vocabulary-html.html"
npm run update:resource:supabase "Vocabulary: Finance and the Economy" "finance-and-the-economy-vocabulary-html.html"
npm run update:resource:supabase "Natur'Evasion Vocabulary" "naturevasion-vocabulary-html.html"
npm run update:resource:supabase "Vocabulary: Military and Marine" "military-marine-vocabulary-html.html"
npm run update:resource:supabase "Vocabulary: Aircraft and Aviation" "aircraft-aviation-vocabulary-html.html"
npm run update:resource:supabase "Instructions and Descriptions (Army)" "instructions-descriptions-army-vocabulary-html.html"
npm run update:resource:supabase "Past Simple Practice (Army)" "past-simple-practice-army-html.html"

# Speaking
npm run update:resource:supabase "Speaking: AI in the Workplace" "speaking-ai-html.html"
npm run update:resource:supabase "Speaking: Remote Work" "speaking-remote-work-html.html"
npm run update:resource:supabase "Speaking: The Workplace" "speaking-the-workplace-html.html"
npm run update:resource:supabase "Speaking: Work-Life Balance" "speaking-work-life-balance-html.html"
npm run update:resource:supabase "Speaking Workplace" "speaking-workplace-html.html"
npm run update:resource:supabase "Meetings" "speaking-meetings-html.html"
npm run update:resource:supabase "PRO Speaking: Presentations" "speaking-presentations-html.html"
npm run update:resource:supabase "Argumentation" "speaking-argumentation-html.html"
npm run update:resource:supabase "Speaking: Making Comparisons" "speaking-making-comparisons-html.html"
npm run update:resource:supabase "Speaking: Your Future Career" "speaking-your-future-career-html.html"

# Tests / TOEIC Reading & Writing
npm run update:resource:supabase "Introduction to TOEICⓇ Reading" "introduction-toeic-reading-html.html"
npm run update:resource:supabase "Introduction to TOEICⓇ Writing" "introduction-toeic-writing-html.html"
npm run update:resource:supabase "Introduction to TOEICⓇ Listening" "introduction-toeic-listening-html.html"

# Tests
npm run update:resource:supabase "Placement Test" "placement-test-html.html"
npm run update:resource:supabase "Final assessment" "final-assessment-html.html"

echo ""
echo "✅ All resources updated!"
