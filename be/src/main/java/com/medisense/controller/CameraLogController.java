    package com.medisense.controller;

    import com.medisense.entity.CameraLog;
    import com.medisense.service.CameraLogService;
    import jakarta.validation.Valid;
    import lombok.RequiredArgsConstructor;
    import org.springframework.format.annotation.DateTimeFormat;
    import org.springframework.http.HttpStatus;
    import org.springframework.web.bind.annotation.*;

    import java.time.LocalDate;
    import java.time.LocalDateTime;
    import java.util.List;

    @RestController
    @CrossOrigin 
    @RequestMapping("/api/camera-logs")
    @RequiredArgsConstructor
    public class CameraLogController {

        private final CameraLogService service;

        @PostMapping
        @ResponseStatus(HttpStatus.CREATED)
        public CameraLog create(@Valid @RequestBody CameraLog body) {
            return service.create(body);
        }

        @GetMapping("/{id}")
        public CameraLog get(@PathVariable Long id) {
            return service.getById(id);
        }

        @GetMapping
        public List<CameraLog> search(
                @RequestParam(required = false) Long cameraId,
                @RequestParam(required = false) Long personId,
                @RequestParam(required = false) Integer violationTypeId,
                @RequestParam(required = false) String reviewStatus,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
            
            LocalDateTime fromTime = (from != null) ? from.atStartOfDay() : null;
            LocalDateTime toTime = (to != null) ? to.plusDays(1).atStartOfDay() : null;

            // Trả về danh sách thẳng, không bắt buộc truyền from/to hay phân trang
            return service.searchList(cameraId, personId, violationTypeId, reviewStatus, fromTime, toTime);
        }

        @PatchMapping("/{id}/review")
        public CameraLog review(@PathVariable Long id, @RequestBody CameraLog body) {
            return service.review(id, body);
        }
    }