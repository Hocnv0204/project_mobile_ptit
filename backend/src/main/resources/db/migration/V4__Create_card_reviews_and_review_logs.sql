CREATE TABLE IF NOT EXISTS card_reviews (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT           NOT NULL,
    vocabulary_id BIGINT         NOT NULL,
    repetition  INT              NOT NULL DEFAULT 0,
    ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval_days INT            NOT NULL DEFAULT 1,
    next_review_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_logs (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT           NOT NULL,
    card_review_id     BIGINT           NOT NULL,
    quality            INT              NOT NULL,
    ease_factor_before DOUBLE PRECISION NOT NULL,
    ease_factor_after  DOUBLE PRECISION NOT NULL,
    interval_before    INT              NOT NULL,
    interval_after     INT              NOT NULL,
    reviewed_at        TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- Add constraints safely (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_card_review_user_vocab'
    ) THEN
        ALTER TABLE card_reviews
            ADD CONSTRAINT uq_card_review_user_vocab UNIQUE (user_id, vocabulary_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_review_logs_card_review'
    ) THEN
        ALTER TABLE review_logs
            ADD CONSTRAINT fk_review_logs_card_review
            FOREIGN KEY (card_review_id) REFERENCES card_reviews(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_card_reviews_user_next ON card_reviews (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_logs_card_review ON review_logs (card_review_id);

