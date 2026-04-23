-- Add blank_text and answer_keys columns to dictation_segments
ALTER TABLE dictation_segments
    ADD COLUMN IF NOT EXISTS blank_text TEXT,
    ADD COLUMN IF NOT EXISTS answer_keys JSONB;

-- Change user_id from UUID to BIGINT to match users.id type
ALTER TABLE user_dictation_progress
    ALTER COLUMN user_id TYPE BIGINT USING NULL;
