package com.medisense.controller;

import com.medisense.service.FaceRegisterService;

import org.hibernate.annotations.ConverterRegistration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin 
public class PersonFaceController {

    private final FaceRegisterService service;

    public PersonFaceController(FaceRegisterService service) {
        this.service = service;
    }

    /** Endpoint legacy/Postman test: POST /signup_face (form-data: person_id, image) */
    @PostMapping(value = "/signup_face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> signupFaceLegacy(@RequestParam("person_id") long personId,
                                                @RequestParam("image") MultipartFile image) {
        return service.register(personId, image);
    }

    /** Endpoint RESTful / Angular: POST /api/persons/{id}/face (form-data: image) */
    @PostMapping(value = "/api/persons/{id}/face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> registerFace(@PathVariable("id") long id,
                                            @RequestParam("image") MultipartFile image) {
        return service.register(id, image);
    }

    /** GET /signup_face: Lấy danh sách khuôn mặt đã đăng ký */
    @GetMapping("/signup_face")
    public List<Map<String, Object>> getAll() {
        return service.getAllRegisteredFaces();
    }

    /** Xử lý ngoại lệ trả về định dạng {"detail": "..."} để tương thích tốt với Frontend/Angular */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException e) {
        String detail = e.getReason() == null ? "Error" : e.getReason();
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("detail", detail));
    }
}