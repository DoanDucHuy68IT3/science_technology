package com.medisense.controller;

import com.medisense.entity.CameraDevice;
import com.medisense.entity.Person;
import com.medisense.service.CameraManagementService;
import com.medisense.service.CameraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.medisense.service.CameraManagementService;
import java.util.List;

@RestController
@RequestMapping("/api/cameras")
@CrossOrigin
public class CameraController {
    @Autowired
    private CameraService cameraService;
    private final CameraManagementService cameraManagementService;
    public CameraController(CameraManagementService cameraManagementService) {
        this.cameraManagementService = cameraManagementService;
    }

    // GET /api/cameras - Lấy danh sách tất cả camera
    @GetMapping
    public ResponseEntity<List<CameraDevice>> getAllCameras() {
        return ResponseEntity.ok(cameraService.findAll());
    }

    // GET /api/cameras/{id} - Lấy chi tiết camera theo ID
    @GetMapping("/{id}")
    public ResponseEntity<CameraDevice> getCameraById(@PathVariable Long id) {
        return cameraService.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Camera not found with id: " + id));
    }

    // GET /api/cameras/user/{userId} - Lấy danh sách camera theo userId
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CameraDevice>> getCamerasByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(cameraService.findByUserId(userId));
    }

    // POST /api/cameras - Thêm mới camera (lưu MySQL + tạo path camera/<code> trên MediaMTX)
    @PostMapping
    public ResponseEntity<CameraDevice> createCamera(@RequestBody CameraDevice cameraDevice) {
        CameraDevice created = cameraService.create(cameraDevice);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // PUT /api/cameras/{id} - Cập nhật camera (đổi mã thì path MediaMTX đổi theo)
    @PutMapping("/{id}")
    public ResponseEntity<CameraDevice> updateCamera(@PathVariable Long id,
                                                     @RequestBody CameraDevice cameraDetails) {
        return ResponseEntity.ok(cameraService.update(id, cameraDetails));
    }

    // DELETE /api/cameras/{id} - Xóa camera (xóa cả path trên MediaMTX)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCamera(@PathVariable Long id) {
        cameraService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/code/{cameraCode}/persons")
public ResponseEntity<List<Person>> getPersonsByCameraCode(@PathVariable String cameraCode) {
    List<Person> persons = cameraManagementService.getPersonsByCameraCode(cameraCode);
    return ResponseEntity.ok(persons);
}
}