package com.medisense.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "camera_devices")
public class CameraDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "camera_code", nullable = false, unique = true, length = 50)
    private String cameraCode;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "camera_name", nullable = false, length = 100)
    private String cameraName;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "stream_url", length = 500)
    private String streamUrl;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "offline";

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public CameraDevice() {}

    // Getters and Setters đầy đủ
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCameraCode() { return cameraCode; }
    public void setCameraCode(String cameraCode) { this.cameraCode = cameraCode; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCameraName() { return cameraName; }
    public void setCameraName(String cameraName) { this.cameraName = cameraName; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getStreamUrl() { return streamUrl; }
    public void setStreamUrl(String streamUrl) { this.streamUrl = streamUrl; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}