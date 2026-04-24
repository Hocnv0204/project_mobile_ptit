-- ==============================================================================
-- 1. XÓA CÁC BẢNG CŨ (Sử dụng CASCADE để dọn sạch khóa ngoại tự động)
-- ==============================================================================
DROP TABLE IF EXISTS user_translation_history CASCADE;
DROP TABLE IF EXISTS user_lesson_progress CASCADE;
DROP TABLE IF EXISTS suggest_vocabulary CASCADE;
DROP TABLE IF EXISTS lesson_sentence CASCADE;
DROP TABLE IF EXISTS status_lesson_writing_user CASCADE;
DROP TABLE IF EXISTS history_writing CASCADE;
DROP TABLE IF EXISTS lesson_writing CASCADE;

-- ==============================================================================
-- 2. TẠO CÁC BẢNG MỚI (Chuẩn PostgreSQL)
-- ==============================================================================

-- Bảng lesson_writing (Bảng cha)
CREATE TABLE lesson_writing (
                                id SERIAL PRIMARY KEY, -- Dùng SERIAL thay cho INT AUTO_INCREMENT
                                name VARCHAR(100),
                                description TEXT,
                                status VARCHAR(50), -- DRAFT, PUBLISHED
                                topic_id INT,
                                level_id INT,
                                created_at TIMESTAMP, -- Dùng TIMESTAMP thay cho DATETIME
                                updated_at TIMESTAMP,
                                delete_flag BOOLEAN DEFAULT FALSE
);

-- Bảng lesson_sentence (Tách câu)
CREATE TABLE lesson_sentence (
                                 id SERIAL PRIMARY KEY,
                                 lesson_writing_id INT,
                                 sentence_vi TEXT,
                                 order_index INT,
                                 CONSTRAINT fk_sentence_lesson FOREIGN KEY (lesson_writing_id) REFERENCES lesson_writing(id) ON DELETE CASCADE
);

-- Bảng user_lesson_progress (Lưu tiến độ)
CREATE TABLE user_lesson_progress (
                                      id BIGSERIAL PRIMARY KEY, -- Dùng BIGSERIAL cho BIGINT tự tăng
                                      user_id BIGINT,
                                      lesson_writing_id INT,
                                      current_order_index INT,
                                      total_sentences INT,
                                      status VARCHAR(20), -- IN_PROGRESS, COMPLETED
                                      created_at TIMESTAMP,
                                      updated_at TIMESTAMP,
                                      CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_writing_id) REFERENCES lesson_writing(id) ON DELETE CASCADE
);

-- Bảng user_translation_history (Lịch sử làm bài và AI Feedback)
CREATE TABLE user_translation_history (
                                          id BIGSERIAL PRIMARY KEY,
                                          user_id BIGINT,
                                          lesson_writing_id INT,
                                          sentence_id INT,
                                          user_answer TEXT,
                                          ai_feedback_json JSONB, -- BẮT BUỘC dùng JSONB trong Postgres để tối ưu hiệu suất
                                          accuracy_score INT,
                                          created_at TIMESTAMP,
                                          CONSTRAINT fk_history_lesson FOREIGN KEY (lesson_writing_id) REFERENCES lesson_writing(id) ON DELETE CASCADE,
                                          CONSTRAINT fk_history_sentence FOREIGN KEY (sentence_id) REFERENCES lesson_sentence(id) ON DELETE CASCADE
);

-- Bảng suggest_vocabulary (Gợi ý từ vựng theo từng câu)
CREATE TABLE suggest_vocabulary (
                                    id SERIAL PRIMARY KEY,
                                    lesson_sentence_id INT,
                                    term VARCHAR(100),
                                    vietnamese TEXT,
                                    type VARCHAR(50),
                                    pronunciation VARCHAR(100),
                                    example TEXT,
                                    CONSTRAINT fk_vocab_sentence FOREIGN KEY (lesson_sentence_id) REFERENCES lesson_sentence(id) ON DELETE CASCADE
);