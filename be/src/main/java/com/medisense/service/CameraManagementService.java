package com.medisense.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.medisense.entity.CameraDevice;
import com.medisense.entity.Person;
import com.medisense.repository.CameraRepository;
import com.medisense.repository.PersonRepository;

@Service
public class CameraManagementService {

    private final CameraRepository cameraRepository;
    private final PersonRepository personRepository;

    public CameraManagementService(CameraRepository cameraRepository, PersonRepository personRepository) {
        this.cameraRepository = cameraRepository;
        this.personRepository = personRepository;
    }

    /**
     * Lấy danh sách person mà camera này đang quản lý dựa trên ID của camera và trường location.
     */
  public List<Person> getPersonsByCameraCode(String cameraCode) {
    // 1. Tìm thông tin camera theo cameraCode (vd: "CAM01" hoặc "SCH-CAM01")
    CameraDevice camera = cameraRepository.findByCameraCode(cameraCode)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy camera với mã: " + cameraCode));

    // 2. Kiểm tra location
    if (camera.getLocation() == null || camera.getLocation().isEmpty()) {
        return Collections.emptyList();
    }

    // 3. Lấy danh sách person theo location
    return personRepository.findByLocation(camera.getLocation());
}
}