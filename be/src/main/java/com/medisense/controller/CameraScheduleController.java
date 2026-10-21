package com.medisense.controller;

import com.medisense.entity.CameraSchedule;
import com.medisense.service.CameraScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camera-schedules")
@CrossOrigin 
public class CameraScheduleController {

    @Autowired
    private CameraScheduleService scheduleService;

    // 1. Lấy danh sách tất cả lịch trình
    @GetMapping
    public ResponseEntity<List<CameraSchedule>> getAllSchedules() {
        return ResponseEntity.ok(scheduleService.getAllSchedules());
    }

    // 2. Lấy danh sách lịch trình theo ID của Camera
    @GetMapping("/camera/{cameraId}")
    public ResponseEntity<List<CameraSchedule>> getSchedulesByCamera(@PathVariable Long cameraId) {
        return ResponseEntity.ok(scheduleService.getSchedulesByCameraId(cameraId));
    }

    // 3. Xem chi tiết 1 lịch trình theo ID
    @GetMapping("/{id}")
    public ResponseEntity<CameraSchedule> getScheduleById(@PathVariable Long id) {
        return scheduleService.getScheduleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Tạo mới 1 lịch trình
    @PostMapping
    public ResponseEntity<CameraSchedule> createSchedule(@RequestBody CameraSchedule schedule) {
        CameraSchedule newSchedule = scheduleService.createSchedule(schedule);
        return ResponseEntity.ok(newSchedule);
    }

    // 5. Cập nhật lịch trình theo ID
    @PutMapping("/{id}")
    public ResponseEntity<CameraSchedule> updateSchedule(@PathVariable Long id, @RequestBody CameraSchedule scheduleDetails) {
        try {
            CameraSchedule updated = scheduleService.updateSchedule(id, scheduleDetails);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 6. Xóa lịch trình
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        try {
            scheduleService.deleteSchedule(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}