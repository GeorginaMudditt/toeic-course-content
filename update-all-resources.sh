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
npm run update:resource:supabase "Modal Verbs" "modal-verbs-html.html"
npm run update:resource:supabase "Mixed Tense Review" "mixed-tense-review-html.html"
npm run update:resource:supabase "Mixed Tenses" "mixed-tenses-html.html"
npm run update:resource:supabase "Passive Voice 1" "passive-voice-1-html.html"
npm run update:resource:supabase "Passive Voice 2" "passive-voice-2-html.html"
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
npm run update:resource:supabase "Presentations Vocabulary" "presentations-vocabulary-html.html"
npm run update:resource:supabase "Telephoning and Writing" "telephoning-writing-vocabulary-html.html"
npm run update:resource:supabase "Travel Vocabulary" "travel-vocabulary-html.html"

# Speaking
npm run update:resource:supabase "Speaking AI" "speaking-ai-html.html"
npm run update:resource:supabase "Speaking Remote Work" "speaking-remote-work-html.html"
npm run update:resource:supabase "Speaking The Workplace" "speaking-the-workplace-html.html"
npm run update:resource:supabase "Speaking Work Life Balance" "speaking-work-life-balance-html.html"
npm run update:resource:supabase "Speaking Workplace" "speaking-workplace-html.html"
npm run update:resource:supabase "Meetings" "speaking-meetings-html.html"
npm run update:resource:supabase "Presentations" "speaking-presentations-html.html"

# Tests
npm run update:resource:supabase "Placement Test" "placement-test-html.html"
npm run update:resource:supabase "Final assessment" "final-assessment-html.html"

echo ""
echo "✅ All resources updated!"
