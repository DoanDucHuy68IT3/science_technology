package com.medisense.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisense.entity.PersonFaceEmbedding;
import com.medisense.repository.PersonFaceEmbeddingRepository;
import com.medisense.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class FaceRegisterService {

    private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;

    private final PersonRepository personRepository;
    private final PersonFaceEmbeddingRepository faceEmbeddingRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    /** Chỉ cho 1 tiến trình Python chạy cùng lúc để tối ưu tài nguyên RAM. */
    private final Semaphore gate = new Semaphore(1);

    @Value("${face.python:python3}") 
    private String pythonBin;        // Đường dẫn python trong .venv

    @Value("${face.script:face_embed.py}") 
    private String scriptPath;       // Đường dẫn file face_embed.py

    @Value("${face.upload-dir:faces}") 
    private String uploadDir;        // Thư mục lưu ảnh mẫu

    @Value("${face.threshold:0.5}") 
    private double threshold;        // Ngưỡng trùng khớp khuôn mặt (cosine similarity)

    @Value("${face.timeout-seconds:120}") 
    private long timeoutSeconds;

    public FaceRegisterService(PersonRepository personRepository,
                               PersonFaceEmbeddingRepository faceEmbeddingRepository) {
        this.personRepository = personRepository;
        this.faceEmbeddingRepository = faceEmbeddingRepository;
    }

    @Transactional
    public Map<String, Object> register(long personId, MultipartFile image) {

        // 1. Kiểm tra thông tin trong Database
        if (!personRepository.existsById(personId)) {
            throw err(HttpStatus.NOT_FOUND, "person_id " + personId + " not found in persons");
        }

        if (faceEmbeddingRepository.existsByPersonId(personId)) {
            throw err(HttpStatus.CONFLICT, "person_id " + personId + " already has a face registered");
        }

        if (image == null || image.isEmpty() || image.getSize() > MAX_IMAGE_BYTES) {
            throw err(HttpStatus.BAD_REQUEST, "Image is empty or too large");
        }

        Path tmp = null;
        Path saved = null;
        try {
            // 2. Lưu ảnh tạm ra đĩa
            tmp = Files.createTempFile("face_", ".img");
            image.transferTo(tmp);

            // 3. Thực thi Python Script và nhận JSON kết quả
            JsonNode res = runPython(tmp);
            String modelName = res.path("model_name").asText();
            String modelVersion = res.path("model_version").asText(null);
            double[] emb = toArray(res.path("embedding"));

            // 4. So sánh khuôn mặt với các dữ liệu embedding đã lưu thuộc cùng model_name
            long bestPid = -1;
            double best = -1;
            List<PersonFaceEmbedding> existingEmbeddings = faceEmbeddingRepository.findByModelName(modelName);

            for (PersonFaceEmbedding row : existingEmbeddings) {
                double[] other = toArray(mapper.readTree(row.getEmbeddingJson()));
                if (other.length != emb.length) continue;

                double sim = dot(emb, other); // Vector đã L2-normalize -> dot = cosine similarity
                if (sim > best) {
                    best = sim;
                    bestPid = row.getPersonId();
                }
            }

            if (bestPid >= 0 && best >= threshold) {
                throw err(HttpStatus.CONFLICT, String.format(
                        "Face already registered by person_id %d (similarity %.4f, threshold %.2f)",
                        bestPid, best, threshold));
            }

            // 5. Lưu ảnh mẫu vào thư mục lưu trữ
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            saved = dir.resolve(personId + extensionOf(image.getOriginalFilename()));
            Files.copy(tmp, saved, StandardCopyOption.REPLACE_EXISTING);
            String url = "/faces/" + saved.getFileName();

            // 6. Lưu Record vào MySQL thông qua JPA
            try {
                PersonFaceEmbedding embeddingEntity = new PersonFaceEmbedding();
                embeddingEntity.setPersonId(personId);
                embeddingEntity.setModelName(modelName);
                embeddingEntity.setModelVersion(modelVersion);
                embeddingEntity.setEmbeddingJson(mapper.writeValueAsString(emb));
                embeddingEntity.setSampleImageUrl(url);

                faceEmbeddingRepository.save(embeddingEntity);
            } catch (DataAccessException e) {
                Files.deleteIfExists(saved);
                throw err(HttpStatus.INTERNAL_SERVER_ERROR, "Database error: " + e.getMostSpecificCause().getMessage());
            }

            // 7. Tạo Response trả về cho Client
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", 200);
            out.put("message", "OK");
            out.put("person_id", personId);
            out.put("sample_image_url", url);
            out.put("max_similarity", best < 0 ? 0.0 : Math.round(best * 10000.0) / 10000.0);
            return out;

        } catch (IOException e) {
            throw err(HttpStatus.INTERNAL_SERVER_ERROR, "I/O error: " + e.getMessage());
        } finally {
            if (tmp != null) {
                try { Files.deleteIfExists(tmp); } catch (IOException ignored) { }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllRegisteredFaces() {
        List<PersonFaceEmbedding> list = faceEmbeddingRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (PersonFaceEmbedding item : list) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", item.getId());
            map.put("person_id", item.getPersonId());
            map.put("model_name", item.getModelName());
            map.put("model_version", item.getModelVersion());
            map.put("sample_image_url", item.getSampleImageUrl());
            map.put("created_at", item.getCreatedAt() != null ? item.getCreatedAt().toString() : null);
            result.add(map);
        }
        return result;
    }

    // ---------------------------------------------------------------- Python Runner
    private JsonNode runPython(Path img) throws IOException {
        boolean acquired;
        try {
            acquired = gate.tryAcquire(30, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw err(HttpStatus.SERVICE_UNAVAILABLE, "Interrupted");
        }
        if (!acquired) {
            throw err(HttpStatus.SERVICE_UNAVAILABLE, "Server is busy, please try again");
        }

        Process p = null;
        try {
            ProcessBuilder pb = new ProcessBuilder(pythonBin, scriptPath, img.toString());
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);   // Log của Python hiển thị trực tiếp ở Console Spring Boot
            p = pb.start();

            final Process proc = p;
            CompletableFuture<String> stdoutF = CompletableFuture.supplyAsync(() -> {
                try {
                    return new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                }
            });

            if (!p.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                throw err(HttpStatus.GATEWAY_TIMEOUT, "Face processing timed out");
            }

            String stdout = stdoutF.get(10, TimeUnit.SECONDS);
            String line = Arrays.stream(stdout.split("\\R"))
                    .filter(s -> !s.isBlank())
                    .reduce((a, b) -> b)
                    .orElse("");

            if (line.isEmpty()) {
                throw err(HttpStatus.INTERNAL_SERVER_ERROR, "Python returned no result");
            }

            JsonNode root = mapper.readTree(line);
            if (!root.path("ok").asBoolean()) {
                HttpStatus st = HttpStatus.resolve(root.path("code").asInt(500));
                throw err(st == null ? HttpStatus.INTERNAL_SERVER_ERROR : st,
                        root.path("message").asText("Face processing failed"));
            }
            return root;

        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            if (p != null) p.destroyForcibly();
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            throw err(HttpStatus.INTERNAL_SERVER_ERROR, "Face processing failed: " + e.getMessage());
        } finally {
            gate.release();
        }
    }

    // ---------------------------------------------------------------- Helpers
    private static String extensionOf(String filename) {
        if (filename != null) {
            String l = filename.toLowerCase();
            for (String e : List.of(".jpeg", ".jpg", ".png", ".webp")) {
                if (l.endsWith(e)) return e;
            }
        }
        return ".jpg";
    }

    private static double[] toArray(JsonNode node) {
        double[] a = new double[node.size()];
        for (int i = 0; i < a.length; i++) {
            a[i] = node.get(i).asDouble();
        }
        return a;
    }

    private static double dot(double[] a, double[] b) {
        double s = 0;
        for (int i = 0; i < a.length; i++) {
            s += a[i] * b[i];
        }
        return s;
    }

    private static ResponseStatusException err(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}