package com.ptit.mobile.backend.service;

import com.ptit.mobile.backend.dto.response.BaseResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface AdminDictationService {

    /** Danh sách tất cả dictations (cho admin, không lọc user) */
    BaseResponse getAllForAdmin();

    /** Tạo dictation từ YouTube URL + file SRT upload */
    BaseResponse createFromSrtFile(String title, String youtubeUrl, MultipartFile srtFile);

    /** Xoá dictation + segments */
    BaseResponse delete(UUID id);
}
