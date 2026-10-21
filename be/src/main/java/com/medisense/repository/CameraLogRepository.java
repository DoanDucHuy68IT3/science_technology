package com.medisense.repository;

import com.medisense.entity.CameraLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
 import java.util.List;
public interface CameraLogRepository extends JpaRepository<CameraLog, Long> {

    Optional<CameraLog> findBySourceEventId(String sourceEventId);

 @Query("""
        SELECT c FROM CameraLog c
        WHERE (:cameraId IS NULL OR c.cameraId = :cameraId)
          AND (:personId IS NULL OR c.personId = :personId)
          AND (:violationTypeId IS NULL OR c.violationTypeId = :violationTypeId)
          AND (:reviewStatus IS NULL OR c.reviewStatus = :reviewStatus)
          AND (:fromTime IS NULL OR c.detectedAt >= :fromTime)
          AND (:toTime IS NULL OR c.detectedAt < :toTime)
        ORDER BY c.detectedAt DESC
        """)
List<CameraLog> searchList(@Param("cameraId") Long cameraId,
                           @Param("personId") Long personId,
                           @Param("violationTypeId") Integer violationTypeId,
                           @Param("reviewStatus") String reviewStatus,
                           @Param("fromTime") LocalDateTime fromTime,
                           @Param("toTime") LocalDateTime toTime);
                           }