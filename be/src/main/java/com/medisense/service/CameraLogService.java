package com.medisense.service;

import com.medisense.entity.CameraLog;
import com.medisense.repository.CameraLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraLogService {

    private final CameraLogRepository repository;

    @Transactional
    public CameraLog create(CameraLog log) {
        if (log.getSourceEventId() != null) {
            var existing = repository.findBySourceEventId(log.getSourceEventId());
            if (existing.isPresent()) return existing.get();
        }
        log.setId(null);
        log.setCreatedAt(null);
        log.setReviewStatus(CameraLog.PENDING);
        log.setReviewedBy(null);
        log.setReviewedAt(null);
        log.setReviewNote(null);
        return repository.save(log);
    }

    @Transactional(readOnly = true)
    public CameraLog getById(Long id) {
        return repository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy camera log " + id));
    }

  @Transactional(readOnly = true)
public List<CameraLog> searchList(Long cameraId, Long personId, Integer violationTypeId,
                                  String reviewStatus, LocalDateTime from, LocalDateTime to) {
    String status = (reviewStatus == null || reviewStatus.isBlank()) ? null : reviewStatus.toUpperCase();
    // Frontend gửi VERIFIED, nhưng DB lưu CameraLog.APPROVED (xem hàm review)
    if ("VERIFIED".equals(status)) status = CameraLog.APPROVED;
    return repository.searchList(cameraId, personId, violationTypeId, status, from, to);
}

    @Transactional
    public CameraLog review(Long id, CameraLog body) {
        String status = body.getReviewStatus();
        if (status == null || (!status.equalsIgnoreCase("VERIFIED") && 
                               !status.equalsIgnoreCase("APPROVED") && 
                               !status.equalsIgnoreCase("REJECTED"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "reviewStatus phải là 'VERIFIED', 'APPROVED' hoặc 'REJECTED'");
        }

        String normalizedStatus = status.equalsIgnoreCase("VERIFIED") ? CameraLog.APPROVED : status.toUpperCase();
        Long reviewedBy = body.getReviewedBy() != null ? body.getReviewedBy() : 1L;

        CameraLog log = getById(id);
        if (!CameraLog.PENDING.equals(log.getReviewStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Log đã được duyệt trước đó");
        }

        log.setReviewStatus(normalizedStatus);
        log.setReviewedBy(reviewedBy);
        log.setReviewedAt(LocalDateTime.now());
        log.setReviewNote(body.getReviewNote());
        
        return repository.save(log);
    }
}