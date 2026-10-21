package com.medisense.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.medisense.entity.Person;
import com.medisense.repository.PersonFaceEmbeddingRepository;
import com.medisense.repository.PersonRepository;

@Service
public class PersonService {

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private PersonFaceEmbeddingRepository faceEmbeddingRepository;

    // Trả về danh sách person kèm trạng thái khuôn mặt cho Angular
    public List<Map<String, Object>> getAllPersonsWithFaceStatus() {
        List<Person> persons = personRepository.findAll();

        // Lấy danh sách embedding gom vào Map để check nhanh theo personId
        Map<Long, String> faceMap = new HashMap<>();
        faceEmbeddingRepository.findAll().forEach(e -> {
            faceMap.put(e.getPersonId(), e.getSampleImageUrl());
        });

        List<Map<String, Object>> result = new ArrayList<>();
        for (Person p : persons) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("personCode", p.getPersonCode());
            map.put("fullName", p.getFullName());
            map.put("location", p.getLocation());
            map.put("userId", p.getUserId());
            map.put("description", p.getDescription());
            map.put("isActive", p.getIsActive());
            map.put("createdAt", p.getCreatedAt());
            map.put("updatedAt", p.getUpdatedAt());

            // Kiểm tra xem person này đã đăng ký mặt chưa
            boolean hasFace = faceMap.containsKey(p.getId());
            map.put("faceRegistered", hasFace);
            map.put("sampleImageUrl", faceMap.get(p.getId()));

            result.add(map);
        }
        return result;
    }

    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    public Optional<Person> getPersonById(Long id) {
        return personRepository.findById(id);
    }

    public Optional<Person> getPersonByCode(String personCode) {
        return personRepository.findByPersonCode(personCode);
    }

    @Transactional
    public Person createPerson(Person person) {
        if (personRepository.existsByPersonCode(person.getPersonCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã nhân sự / học sinh đã tồn tại: " + person.getPersonCode());
        }
        if (person.getIsActive() == null) {
            person.setIsActive(true);
        }
        return personRepository.save(person);
    }

    @Transactional
    public Person updatePerson(Long id, Person personDetails) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Person với ID: " + id));

        if (!person.getPersonCode().equals(personDetails.getPersonCode()) &&
            personRepository.existsByPersonCode(personDetails.getPersonCode())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã nhân sự / học sinh mới đã tồn tại: " + personDetails.getPersonCode());
        }

        person.setPersonCode(personDetails.getPersonCode());
        person.setFullName(personDetails.getFullName());
        person.setLocation(personDetails.getLocation());
        person.setUserId(personDetails.getUserId());
        person.setDescription(personDetails.getDescription());
        if (personDetails.getIsActive() != null) {
            person.setIsActive(personDetails.getIsActive());
        }

        return personRepository.save(person);
    }

    @Transactional
    public void deletePerson(Long id) {
        if (!personRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Person với ID: " + id);
        }
        personRepository.deleteById(id);
    }
}