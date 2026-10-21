package com.medisense.repository;
import com.medisense.entity.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {
    Optional<Person> findByPersonCode(String personCode);
    boolean existsByPersonCode(String personCode);
    List<Person> findByLocation(String location);
}