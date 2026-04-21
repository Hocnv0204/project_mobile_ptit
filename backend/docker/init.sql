-- =====================================================
-- 🔐 AUTHENTICATION & AUTHORIZATION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR        NOT NULL UNIQUE,
    username      VARCHAR(100)   UNIQUE,
    full_name     VARCHAR,
    phone_number  VARCHAR(20),
    date_birth    DATE,

    is_active          BOOLEAN DEFAULT TRUE,
    is_email_verified  BOOLEAN DEFAULT FALSE,
    delete_flag        BOOLEAN DEFAULT FALSE,

    level_id    BIGINT,

    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    last_login  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_credentials (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL UNIQUE REFERENCES users(id),
    password_hash VARCHAR NOT NULL,
    updated_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT  NOT NULL REFERENCES users(id),
    provider         VARCHAR NOT NULL,
    provider_user_id VARCHAR NOT NULL,

    access_token      VARCHAR,
    refresh_token     VARCHAR,
    token_expires_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT  NOT NULL REFERENCES users(id),
    token    VARCHAR NOT NULL UNIQUE,

    expires_at  TIMESTAMP NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT  NOT NULL REFERENCES users(id),
    token    VARCHAR NOT NULL UNIQUE,

    expires_at  TIMESTAMP NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT  NOT NULL REFERENCES users(id),
    token_hash  VARCHAR NOT NULL UNIQUE,

    expires_at  TIMESTAMP NOT NULL,
    is_revoked  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP
);

-- =====================================================
-- 🛡️ ROLE & PERMISSION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR NOT NULL UNIQUE,
    description VARCHAR
);

CREATE TABLE IF NOT EXISTS permissions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR NOT NULL UNIQUE,
    description VARCHAR
);

CREATE TABLE IF NOT EXISTS user_roles (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT NOT NULL REFERENCES users(id),
    role_id  BIGINT NOT NULL REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id             BIGSERIAL PRIMARY KEY,
    role_id        BIGINT NOT NULL REFERENCES roles(id),
    permission_id  BIGINT NOT NULL REFERENCES permissions(id)
);

-- =====================================================
-- 📚 CONTENT CORE
-- =====================================================

CREATE TABLE IF NOT EXISTS topic (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100),
    description TEXT,
    type        VARCHAR(50),
    note        TEXT,

    delete_flag  BOOLEAN,
    created_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS level (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100),
    description TEXT,

    delete_flag  BOOLEAN,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP
);

-- =====================================================
-- 📖 VOCAB LESSON
-- =====================================================

CREATE TABLE IF NOT EXISTS lesson_vocab (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100),
    create_by  VARCHAR(100),

    user_id   BIGINT REFERENCES users(id),
    level_id  INT    REFERENCES level(id),

    created_at   TIMESTAMP,
    updated_at   TIMESTAMP,
    delete_flag  BOOLEAN
);

CREATE TABLE IF NOT EXISTS vocabulary (
    id             SERIAL PRIMARY KEY,
    term           VARCHAR(100),
    vi             TEXT,
    type           VARCHAR(50),
    pronunciation  VARCHAR(100),
    example        TEXT,
    audio_url      VARCHAR,
    image_url      VARCHAR,

    created_at      TIMESTAMP,
    user_id         BIGINT REFERENCES users(id),
    lesson_vocab_id BIGINT REFERENCES lesson_vocab(id)
);

-- =====================================================
-- ✍️ WRITING LESSON
-- =====================================================

CREATE TABLE IF NOT EXISTS lesson_writing (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100),
    paragraph   TEXT,
    note        TEXT,
    description TEXT,
    status      VARCHAR(50),
    type        VARCHAR(50),

    delete_flag  BOOLEAN,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP,

    topic_id  INT REFERENCES topic(id),
    level_id  INT REFERENCES level(id)
);

CREATE TABLE IF NOT EXISTS history_writing (
    id        SERIAL PRIMARY KEY,
    question  TEXT,
    answer    TEXT,
    result    VARCHAR,

    created_at        TIMESTAMP,
    user_id           BIGINT REFERENCES users(id),
    lesson_writing_id INT    REFERENCES lesson_writing(id)
);

CREATE TABLE IF NOT EXISTS status_lesson_writing_user (
    id        SERIAL PRIMARY KEY,
    user_id   BIGINT REFERENCES users(id),
    lesson_id INT    REFERENCES lesson_writing(id),
    status    INT
);

CREATE TABLE IF NOT EXISTS suggest_vocabulary (
    id             SERIAL PRIMARY KEY,
    term           VARCHAR(100),
    vietnamese     TEXT,
    type           VARCHAR(50),
    pronunciation  VARCHAR(100),
    example        TEXT,

    delete_flag        BOOLEAN,
    lesson_writing_id  INT REFERENCES lesson_writing(id)
);

-- =====================================================
-- 🔔 NOTIFICATION
-- =====================================================

CREATE TABLE IF NOT EXISTS notification (
    id      SERIAL PRIMARY KEY,
    type    VARCHAR(50),
    message TEXT,
    link    VARCHAR(255),

    created_at   TIMESTAMP,
    is_read      BOOLEAN,

    user_sender   BIGINT REFERENCES users(id),
    user_receive  BIGINT REFERENCES users(id)
);

-- =====================================================
-- 🔥 STREAK SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS streak_activities (
    id             BIGINT PRIMARY KEY,
    user_id        BIGINT REFERENCES users(id),
    activity_type  VARCHAR(50),
    created_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id                  BIGINT PRIMARY KEY,
    user_id             BIGINT UNIQUE REFERENCES users(id),

    current_streak      INT DEFAULT 0,
    longest_streak      INT DEFAULT 0,
    last_activity_date  DATE
);

-- =====================================================
-- 🎧 DICTATION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS dictations (
    id              UUID PRIMARY KEY,
    title           VARCHAR,
    media_url       VARCHAR,
    total_segments  INT
);

CREATE TABLE IF NOT EXISTS dictation_segments (
    id               UUID PRIMARY KEY,
    dictation_id     UUID REFERENCES dictations(id),
    sequence_order   INT,
    start_time       FLOAT,
    end_time         FLOAT,
    english_text     TEXT,
    translation_text TEXT
);

CREATE TABLE IF NOT EXISTS user_dictation_progress (
    id                  UUID PRIMARY KEY,
    user_id             UUID,
    dictation_id        UUID REFERENCES dictations(id),

    current_sequence    INT,
    completed_segments  INT,
    status              VARCHAR,
    updated_at          TIMESTAMP
);

-- =====================================================
-- 🎙️ PODCAST SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS podcasts (
    id             SERIAL PRIMARY KEY,
    title          VARCHAR NOT NULL,
    description    TEXT,
    audio_url      VARCHAR NOT NULL,
    thumbnail_url  VARCHAR,

    level_id     INT REFERENCES level(id),
    topic_id     INT REFERENCES topic(id),

    duration     INT,
    order_index  INT,

    delete_flag  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS podcast_dialogues (
    id          SERIAL PRIMARY KEY,
    podcast_id  INT NOT NULL REFERENCES podcasts(id),

    speaker          VARCHAR(10),
    content          TEXT,
    order_index      INT,
    timestamp_start  INT
);

CREATE TABLE IF NOT EXISTS podcast_vocab (
    id          SERIAL PRIMARY KEY,
    podcast_id  INT NOT NULL REFERENCES podcasts(id),

    term           VARCHAR(100),
    definition     TEXT,
    pronunciation  VARCHAR(100),
    example        TEXT,
    word_type      VARCHAR(50),
    vocab_type     VARCHAR(20),
    order_index    INT
);

CREATE TABLE IF NOT EXISTS user_podcast_history (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    podcast_id  INT    REFERENCES podcasts(id),

    progress_seconds  INT     DEFAULT 0,
    is_completed      BOOLEAN DEFAULT FALSE,
    listened_at       TIMESTAMP
);

-- =====================================================
-- 🌱 SEED DATA
-- =====================================================

INSERT INTO roles (name, description) VALUES
    ('ROLE_USER',  'Standard user role'),
    ('ROLE_ADMIN', 'Administrator role')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description) VALUES
    ('user:read',    'Read user data'),
    ('user:write',   'Write user data'),
    ('admin:manage', 'Full admin access')
ON CONFLICT (name) DO NOTHING;
