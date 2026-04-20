package com.ptit.mobile.backend.dto.request.writing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateLessonRequest {

    @NotBlank(message = "Tên nháp cho bài học không được để trống")
    private String draftName; // Tên tạm thời do admin đặt trước khi AI tạo tên chính thức

    @NotNull(message = "Chủ đề không được để trống")
    private Integer topicId;

    @NotNull(message = "Trình độ không được để trống")
    private Integer levelId;

    @NotBlank(message = "Mô tả chi tiết không được để trống")
    private String description; // Mô tả chi tiết về nội dung mong muốn
}