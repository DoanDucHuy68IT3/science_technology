                                            package com.medisense.service;

                                            import com.medisense.entity.CameraDevice;
                                            import com.medisense.repository.CameraRepository;
                                            import jakarta.annotation.PostConstruct;
                                            import org.springframework.beans.factory.annotation.Autowired;
                                            import org.springframework.http.HttpStatus;
                                            import org.springframework.stereotype.Service;
                                            import org.springframework.transaction.annotation.Transactional;
                                            import org.springframework.web.server.ResponseStatusException;

                                            import java.util.List;
                                            import java.util.Optional;

                                            @Service
                                            public class CameraService {

                                                @Autowired
                                                private CameraRepository cameraRepository;

                                                @Autowired
                                                private MediaMtxClient mediaMtx;

                                                // GET /cameras
                                                public List<CameraDevice> findAll() {
                                                    return cameraRepository.findAll();
                                                }

                                                // GET /cameras/{id}
                                                public Optional<CameraDevice> findById(Long id) {
                                                    return cameraRepository.findById(id);
                                                }

                                                // GET /cameras/user/{userId}
                                                public List<CameraDevice> findByUserId(Long userId) {
                                                    return cameraRepository.findByUserId(userId);
                                                }

                                                // POST /cameras
                                                @Transactional
                                                public CameraDevice create(CameraDevice cameraDevice) {
                                                    mediaMtx.toPath(cameraDevice.getCameraCode());               // validate mã
                                                    if (cameraRepository.existsByCameraCode(cameraDevice.getCameraCode())) {
                                                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã camera đã tồn tại");
                                                    }
                                                    if (cameraDevice.getStatus() == null || cameraDevice.getStatus().isEmpty()) {
                                                        cameraDevice.setStatus("offline");
                                                    }
                                                    CameraDevice saved = cameraRepository.save(cameraDevice);    // 1. MySQL
                                                    callMediaMtx(() -> mediaMtx.upsert(saved.getCameraCode(), saved.getStreamUrl())); // 2. MediaMTX
                                                    return saved;
                                                }

                                                // PUT /cameras/{id}
                                                @Transactional
                                                public CameraDevice update(Long id, CameraDevice details) {
                                                    CameraDevice camera = cameraRepository.findById(id)
                                                            .orElseThrow(() -> new RuntimeException("Camera not found with id: " + id));
                                                    String oldCode = camera.getCameraCode();

                                                    mediaMtx.toPath(details.getCameraCode());                    // validate mã mới

                                                    camera.setCameraCode(details.getCameraCode());
                                                    camera.setCameraName(details.getCameraName());
                                                    camera.setUserId(details.getUserId());
                                                    camera.setIpAddress(details.getIpAddress());
                                                    camera.setStreamUrl(details.getStreamUrl());
                                                    camera.setLocation(details.getLocation());
                                                    camera.setStatus(details.getStatus());
                                                    camera.setLastSeen(details.getLastSeen());

                                                    CameraDevice saved = cameraRepository.save(camera);

                                                    // tạo path mới trước, xóa path cũ sau
                                                    callMediaMtx(() -> mediaMtx.upsert(saved.getCameraCode(), saved.getStreamUrl()));
                                                    if (!oldCode.equals(saved.getCameraCode())) {
                                                        callMediaMtx(() -> mediaMtx.delete(oldCode));
                                                    }
                                                    return saved;
                                                }

                                                // DELETE /cameras/{id}
                                                @Transactional
                                                public void delete(Long id) {
                                                    CameraDevice camera = cameraRepository.findById(id)
                                                            .orElseThrow(() -> new RuntimeException("Camera not found with id: " + id));
                                                    cameraRepository.delete(camera);
                                                    callMediaMtx(() -> mediaMtx.delete(camera.getCameraCode()));
                                                }

                                                /** Java khởi động: nạp lại toàn bộ path vào MediaMTX (MediaMTX restart là mất path). */
                                                @PostConstruct
                                                public void syncAllOnStartup() {
                                                    try {
                                                        for (CameraDevice c : cameraRepository.findAll()) {
                                                            try {
                                                                mediaMtx.upsert(c.getCameraCode(), c.getStreamUrl());
                                                            } catch (Exception e) {
                                                                System.err.println("[MTX] bỏ qua " + c.getCameraCode() + ": " + e.getMessage());
                                                            }
                                                        }
                                                    } catch (Exception e) {
                                                        System.err.println("[MTX] không nạp được path: " + e.getMessage());
                                                    }
                                                }

                                                private void callMediaMtx(Runnable r) {
                                                    try {
                                                        r.run();
                                                    } catch (Exception e) {
                                                        // ném lỗi để @Transactional rollback DB
                                                        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MediaMTX lỗi: " + e.getMessage());
                                                    }
                                                }
                                            }