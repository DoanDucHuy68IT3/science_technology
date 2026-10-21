package com.medisense.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "camera_logs")
@Getter
@Setter
public class CameraLog {

    public static final String PENDING = "pending";
    public static final String APPROVED = "approved";
    public static final String REJECTED = "rejected";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "camera_id", nullable = false)
    private Long cameraId;

    /** NULL = người lạ / chưa nhận diện */
    @Column(name = "person_id")
    private Long personId;

    @NotNull
    @Column(name = "violation_type_id", nullable = false)
    private Integer violationTypeId;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    @Column(name = "confidence", precision = 5, scale = 4)
    private BigDecimal confidence;

    @Size(max = 500)
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "review_status", nullable = false, length = 20)
    private String reviewStatus = PENDING;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Size(max = 500)
    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Size(max = 100)
    @Column(name = "source_event_id", length = 100, unique = true)
    private String sourceEventId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (detectedAt == null) detectedAt = now;
        if (createdAt == null) createdAt = now;
        if (reviewStatus == null) reviewStatus = PENDING;
    }
}