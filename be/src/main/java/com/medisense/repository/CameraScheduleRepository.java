package com.medisense.repository;

import com.medisense.entity.CameraSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CameraScheduleRepository extends JpaRepository<CameraSchedule, Long> {
    
    // Lấy tất cả lịch trình theo camera_id
    List<CameraSchedule> findByCameraId(Long cameraId);
    
    // Lấy danh sách lịch trình đang hoạt động của một camera
    List<CameraSchedule> findByCameraIdAndIsActive(Long cameraId, boolean isActive);
}