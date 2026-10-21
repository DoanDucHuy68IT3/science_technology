package com.medisense.service;

import com.medisense.entity.CameraSchedule;
import com.medisense.repository.CameraScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CameraScheduleService {

    @Autowired
    private CameraScheduleRepository scheduleRepository;

    public List<CameraSchedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public List<CameraSchedule> getSchedulesByCameraId(Long cameraId) {
        return scheduleRepository.findByCameraId(cameraId);
    }

    public Optional<CameraSchedule> getScheduleById(Long id) {
        return scheduleRepository.findById(id);
    }

    public CameraSchedule createSchedule(CameraSchedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public CameraSchedule updateSchedule(Long id, CameraSchedule scheduleDetails) {
        CameraSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch trình với ID: " + id));

        schedule.setCameraId(scheduleDetails.getCameraId());
        schedule.setScheduleName(scheduleDetails.getScheduleName());
        schedule.setStartTime(scheduleDetails.getStartTime());
        schedule.setEndTime(scheduleDetails.getEndTime());
        schedule.setDaysOfWeek(scheduleDetails.getDaysOfWeek());
        schedule.setActive(scheduleDetails.isActive());

        return scheduleRepository.save(schedule);
    }

    public void deleteSchedule(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy lịch trình để xóa với ID: " + id);
        }
        scheduleRepository.deleteById(id);
    }
}