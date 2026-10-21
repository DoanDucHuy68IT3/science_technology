package com.medisense.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.medisense.entity.ViolationType;
import com.medisense.service.ViolationTypeService;

@RestController
@CrossOrigin
@RequestMapping("/api/violation-types")
public class ViolationTypeController {

    @Autowired
    private ViolationTypeService violationTypeService;

    @GetMapping
    public ResponseEntity<List<ViolationType>> getAllViolationTypes() {
        return ResponseEntity.ok(violationTypeService.getAllViolationTypes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ViolationType> getViolationTypeById(@PathVariable Integer id) {
        return violationTypeService.getViolationTypeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ViolationType> getViolationTypeByCode(@PathVariable String code) {
        return violationTypeService.getViolationTypeByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ViolationType> createViolationType(@RequestBody ViolationType violationType) {
        ViolationType created = violationTypeService.createViolationType(violationType);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ViolationType> updateViolationType(@PathVariable Integer id, @RequestBody ViolationType details) {
        ViolationType updated = violationTypeService.updateViolationType(id, details);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteViolationType(@PathVariable Integer id) {
        violationTypeService.deleteViolationType(id);
        return ResponseEntity.noContent().build();
    }
}