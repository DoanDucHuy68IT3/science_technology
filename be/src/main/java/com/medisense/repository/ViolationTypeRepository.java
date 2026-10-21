package com.medisense.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.medisense.entity.ViolationType;

@Repository
public interface ViolationTypeRepository extends JpaRepository<ViolationType, Integer> {
    Optional<ViolationType> findByCode(String code);
    boolean existsByCode(String code);
}