package com.medisense.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medisense.entity.ViolationType;
import com.medisense.repository.ViolationTypeRepository;

@Service
public class ViolationTypeService {

    @Autowired
    private ViolationTypeRepository violationTypeRepository;

    public List<ViolationType> getAllViolationTypes() {
        return violationTypeRepository.findAll();
    }

    public Optional<ViolationType> getViolationTypeById(Integer id) {
        return violationTypeRepository.findById(id);
    }

    public Optional<ViolationType> getViolationTypeByCode(String code) {
        return violationTypeRepository.findByCode(code);
    }

    @Transactional
    public ViolationType createViolationType(ViolationType violationType) {
        if (violationTypeRepository.existsByCode(violationType.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã loại vi phạm đã tồn tại: " + violationType.getCode());
        }
        if (violationType.getIsActive() == null) {
            violationType.setIsActive(true);
        }
        return violationTypeRepository.save(violationType);
    }

    @Transactional
    public ViolationType updateViolationType(Integer id, ViolationType details) {
        ViolationType violationType = violationTypeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại vi phạm với ID: " + id));

        if (!violationType.getCode().equals(details.getCode()) && 
            violationTypeRepository.existsByCode(details.getCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã loại vi phạm mới đã tồn tại: " + details.getCode());
        }

        violationType.setCode(details.getCode());
        violationType.setName(details.getName());
        violationType.setDescription(details.getDescription());
        if (details.getIsActive() != null) {
            violationType.setIsActive(details.getIsActive());
        }

        return violationTypeRepository.save(violationType);
    }

    @Transactional
    public void deleteViolationType(Integer id) {
        if (!violationTypeRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy loại vi phạm với ID: " + id);
        }
        violationTypeRepository.deleteById(id);
    }
}