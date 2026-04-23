package com.ptit.mobile.backend.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class AudioStorageService {

    private static final String UPLOAD_DIR = "uploads/podcasts";

    /**
     * Lưu file audio MP3 vào thư mục uploads/podcasts.
     * @param audioBytes dữ liệu MP3
     * @return đường dẫn tương đối để truy cập file qua API (e.g. /uploads/podcasts/xxx.mp3)
     */
    public String saveAudio(byte[] audioBytes) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String fileName = UUID.randomUUID() + ".mp3";
            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, audioBytes);

            return "/" + UPLOAD_DIR + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save audio file", e);
        }
    }
}
