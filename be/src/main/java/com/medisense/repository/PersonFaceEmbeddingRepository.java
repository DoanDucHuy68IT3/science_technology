package com.medisense.repository;

import com.medisense.entity.PersonFaceEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonFaceEmbeddingRepository extends JpaRepository<PersonFaceEmbedding, Long> {
    
    boolean existsByPersonId(Long personId);

    boolean existsByPersonIdAndModelName(Long personId, String modelName);

    List<PersonFaceEmbedding> findByModelName(String modelName);
}