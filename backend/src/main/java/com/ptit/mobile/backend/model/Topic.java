package com.ptit.mobile.backend.model;


import com.ptit.mobile.backend.common.constant.TypeTopic;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "topic")
@Getter
@Setter
public class Topic {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * Tên của chủ đề.
     * Ví dụ: "Các thì trong tiếng Anh", "Từ vựng về gia đình".
     */
    @Column(length = 100)
    private String name;

    /**
     * Mô tả chi tiết về nội dung của chủ đề.
     * Được lưu dưới dạng TEXT để không giới hạn độ dài.
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Cờ đánh dấu xóa mềm.
     * true: Topic đã bị xóa (ẩn đi).
     * false: Topic đang hoạt động.
     */
    @Column(name = "delete_flag")
    private Boolean deleteFlag;

    /**
     * Phân loại topic để phân biệt nguồn tạo.
     * - DEFAULT: Topic mặc định do Admin tạo.
     * - USER_CREATION: Topic do người dùng thông thường tạo.
     * Được lưu dưới dạng chuỗi trong CSDL.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private TypeTopic type;

    /**
     * Ghi chú nội bộ cho quản trị viên.
     */
    @Column(columnDefinition = "TEXT")
    private String note;

    /**
     * Thời điểm topic được tạo.
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "image_id")
    private String imageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


    /**
     * Mối quan hệ một-nhiều với Lesson.
     * Một topic có thể chứa nhiều bài học.
     * Hành động trên Topic sẽ lan truyền xuống Lesson (ví dụ: xóa Topic sẽ xóa cả Lesson).
     */
    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Lesson> lessons;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "level_id")
//    private Level level;

    public Topic() {
    }

    @Override
    public String toString() {
        return "Topic{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                ", deleteFlag=" + deleteFlag +
                ", type=" + type +
                ", note='" + note + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}

