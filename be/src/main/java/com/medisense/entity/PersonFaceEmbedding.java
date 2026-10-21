package com.medisense.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "person_face_embeddings", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_person_face_model", columnNames = {"person_id", "model_name"})
}, indexes = {
    @Index(name = "IX_emb_person", columnList = "person_id")
})
public class PersonFaceEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "person_id", nullable = false)
    private Long personId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", referencedColumnName = "id", insertable = false, updatable = false)
    private Person person;

    @Column(name = "model_name", length = 100, nullable = false)
    private String modelName;

    @Column(name = "model_version", length = 50)
    private String modelVersion;

    @Column(name = "embedding_json", columnDefinition = "LONGTEXT", nullable = false)
    private String embeddingJson;

    @Column(name = "sample_image_url", length = 500)
    private String sampleImageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters (Đã lược bỏ updated_at)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPersonId() { return personId; }
    public void setPersonId(Long personId) { this.personId = personId; }
    public Person getPerson() { return person; }
    public void setPerson(Person person) { this.person = person; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }
    public String getEmbeddingJson() { return embeddingJson; }
    public void setEmbeddingJson(String embeddingJson) { this.embeddingJson = embeddingJson; }
    public String getSampleImageUrl() { return sampleImageUrl; }
    public void setSampleImageUrl(String sampleImageUrl) { this.sampleImageUrl = sampleImageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}