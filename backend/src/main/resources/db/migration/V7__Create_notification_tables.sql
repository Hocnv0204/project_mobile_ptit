CREATE TABLE IF NOT EXISTS user_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    last_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    link VARCHAR(255),
    created_at TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    user_sender BIGINT,
    user_receive BIGINT
);
