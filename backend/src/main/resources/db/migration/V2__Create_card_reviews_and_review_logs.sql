CREATE TABLE card_reviews (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT           NOT NULL,
    vocabulary_id BIGINT         NOT NULL,
    repetition  INT              NOT NULL DEFAULT 0,
    ease_factor DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval_days INT            NOT NULL DEFAULT 1,
    next_review_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMP,
    CONSTRAINT uq_card_review_user_vocab UNIQUE (user_id, vocabulary_id)
);

CREATE TABLE review_logs (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT           NOT NULL,
    card_review_id     BIGINT           NOT NULL REFERENCES card_reviews(id),
    quality            INT              NOT NULL,
    ease_factor_before DOUBLE PRECISION NOT NULL,
    ease_factor_after  DOUBLE PRECISION NOT NULL,
    interval_before    INT              NOT NULL,
    interval_after     INT              NOT NULL,
    reviewed_at        TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_reviews_user_next ON card_reviews (user_id, next_review_date);
CREATE INDEX idx_review_logs_card_review ON review_logs (card_review_id);
