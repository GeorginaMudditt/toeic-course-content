#!/bin/bash

# Script to test Supabase connection with different regions

REGIONS=("us-west-1" "us-east-1" "eu-west-1" "eu-central-1" "ap-southeast-1" "ap-northeast-1" "ap-southeast-2")

PASSWORD="MFiSIiJQabYUzjx4"
PROJECT_ID="ulrwcortyhassmytkcij"

echo "Testing connection with different regions..."
echo ""

for REGION in "${REGIONS[@]}"; do
  CONNECTION_STRING="postgresql://postgres.${PROJECT_ID}:${PASSWORD}@aws-0-${REGION}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
  
  echo "Testing region: $REGION"
  
  # Try to connect (this will fail if wrong region, but we can see the error)
  PGPASSWORD="$PASSWORD" psql "$CONNECTION_STRING" -c "SELECT 1;" 2>&1 | head -1
  
  if [ $? -eq 0 ]; then
    echo "✓ SUCCESS! Region is: $REGION"
    echo ""
    echo "Your connection string is:"
    echo "$CONNECTION_STRING"
    exit 0
  fi
done

echo ""
echo "Could not auto-detect region. Please check your Supabase project settings for the region."

