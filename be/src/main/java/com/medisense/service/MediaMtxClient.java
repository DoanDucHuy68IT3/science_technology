package com.medisense.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class MediaMtxClient {

    private static final Pattern CODE = Pattern.compile("^[A-Za-z0-9_-]+$");

    private static final Pattern SOURCE = Pattern.compile(
            "^(rtsp|rtsps|rtmp|rtmps|http|https|udp|srt|whep|wheps)://.+",
            Pattern.CASE_INSENSITIVE);

    private final Path configPath;
    private final String prefix;
    private final String hlsBaseUrl;

    public MediaMtxClient(
            @Value("${mediamtx.config-file}") String configFile,
            @Value("${mediamtx.path-prefix:camera}") String prefix,
            @Value("${mediamtx.hls-base-url:http://localhost:8888}") String hlsBaseUrl
    ) {
        this.configPath = Path.of(configFile).toAbsolutePath().normalize();
        this.prefix = prefix.replaceAll("^/+|/+$", "");
        this.hlsBaseUrl = hlsBaseUrl.replaceAll("/+$", "");

        System.out.println("[MediaMTX] Config : " + configPath);
        System.out.println("[MediaMTX] Prefix : " + this.prefix);
        System.out.println("[MediaMTX] HLS    : " + this.hlsBaseUrl);

        cleanupStaleTempFiles();
    }

    /** CAM001 -> camera/CAM001 */
    public String toPath(String code) {
        if (code == null || !CODE.matcher(code.trim()).matches()) {
            throw new IllegalArgumentException(
                    "cameraCode chỉ gồm chữ, số, dấu gạch dưới và dấu gạch ngang");
        }
        String c = code.trim();
        return prefix.isEmpty() ? c : prefix + "/" + c;
    }

    /** CAM001 -> http://host:8888/camera/CAM001/index.m3u8 */
    public String hlsUrl(String code) {
        return hlsBaseUrl + "/" + toPath(code) + "/index.m3u8";
    }

    /** Kiểm tra mã + streamUrl trước khi lưu DB (ném IllegalArgumentException nếu sai). */
    public void validate(String code, String source) {
        toPath(code);
        String src = source == null ? "" : source.trim();
        if (!src.isEmpty() && !SOURCE.matcher(src).matches()) {
            throw new IllegalArgumentException("streamUrl không đúng định dạng: " + src);
        }
    }

    /** Thêm mới hoặc cập nhật path trong mediamtx.yml. */
    public synchronized void upsert(String code, String source) {
        String pathName = toPath(code);
        validate(code, source);
        String src = source == null ? "" : source.trim();

        Map<String, Object> cameraConfig = new LinkedHashMap<>();
        if (src.isEmpty()) {
            cameraConfig.put("source", "publisher");
        } else {
            cameraConfig.put("source", src);
            cameraConfig.put("sourceOnDemand", true);
        }

        try {
            Map<String, Object> root = readYaml();
            Map<String, Object> paths = getPaths(root);

            boolean existed = paths.containsKey(pathName);
            paths.put(pathName, cameraConfig);
            root.put("paths", paths);

            writeYaml(root);
            System.out.println("[MediaMTX] " + (existed ? "Đã cập nhật path: " : "Đã thêm path: ") + pathName);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể cập nhật mediamtx.yml: " + e.getMessage(), e);
        }
    }

    /** Xóa path khỏi mediamtx.yml. */
    public synchronized void delete(String code) {
        String pathName = toPath(code);
        try {
            Map<String, Object> root = readYaml();
            Map<String, Object> paths = getPaths(root);

            if (!paths.containsKey(pathName)) {
                System.out.println("[MediaMTX] Path không tồn tại: " + pathName);
                return;
            }
            paths.remove(pathName);
            root.put("paths", paths);

            writeYaml(root);
            System.out.println("[MediaMTX] Đã xóa path: " + pathName);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể xóa path khỏi mediamtx.yml: " + e.getMessage(), e);
        }
    }

    // ------------------------------------------------------------------

    private Map<String, Object> getPaths(Map<String, Object> root) throws IOException {
        Object obj = root.get("paths");
        if (obj == null) {
            return new LinkedHashMap<>();
        }
        if (obj instanceof Map<?, ?>) {
            @SuppressWarnings("unchecked")
            Map<String, Object> existing = (Map<String, Object>) obj;
            return new LinkedHashMap<>(existing);
        }
        throw new IOException("Mục paths trong mediamtx.yml không hợp lệ");
    }

    private Map<String, Object> readYaml() throws IOException {
        if (!Files.isRegularFile(configPath)) {
            throw new IOException("Không tìm thấy file: " + configPath);
        }
        String content = Files.readString(configPath, StandardCharsets.UTF_8);
        Object loaded = new Yaml(new SafeConstructor(new LoaderOptions())).load(content);

        if (!(loaded instanceof Map<?, ?>)) {
            throw new IOException("Nội dung mediamtx.yml không hợp lệ");
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> root = new LinkedHashMap<>((Map<String, Object>) loaded);
        return root;
    }

    /** Ghi YAML: backup .bak -> ghi .tmp cố định -> giữ quyền -> thay file (có retry cho Windows). */
    private void writeYaml(Map<String, Object> root) throws IOException {
        DumperOptions options = new DumperOptions();
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        options.setPrettyFlow(true);
        options.setIndent(2);
        String content = new Yaml(options).dump(root);

        Path backup = configPath.resolveSibling(configPath.getFileName() + ".bak");
        Files.copy(configPath, backup, StandardCopyOption.REPLACE_EXISTING);

        Path temp = configPath.resolveSibling(configPath.getFileName() + ".tmp");
        try {
            Files.writeString(temp, content, StandardCharsets.UTF_8);

            try {
                Files.setPosixFilePermissions(temp, Files.getPosixFilePermissions(configPath));
            } catch (UnsupportedOperationException ignored) {
                // Windows
            }

            moveWithRetry(temp, configPath);
            System.out.println("[MediaMTX] Ghi YAML thành công: " + configPath);
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    private void moveWithRetry(Path from, Path to) throws IOException {
        IOException last = null;
        for (int i = 0; i < 5; i++) {
            try {
                try {
                    Files.move(from, to,
                            StandardCopyOption.REPLACE_EXISTING,
                            StandardCopyOption.ATOMIC_MOVE);
                } catch (AtomicMoveNotSupportedException e) {
                    Files.move(from, to, StandardCopyOption.REPLACE_EXISTING);
                }
                return;
            } catch (IOException e) {
                last = e;
                try {
                    Thread.sleep(200);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw e;
                }
            }
        }
        throw last;
    }

    /** Xóa file rác mediamtx-*.tmp của các bản code cũ. */
    private void cleanupStaleTempFiles() {
        Path dir = configPath.getParent();
        if (dir == null || !Files.isDirectory(dir)) return;
        try (var stream = Files.newDirectoryStream(dir, "mediamtx-*.tmp")) {
            for (Path p : stream) {
                try {
                    Files.deleteIfExists(p);
                    System.out.println("[MediaMTX] Đã xóa file rác: " + p.getFileName());
                } catch (IOException e) {
                    System.err.println("[MediaMTX] Không xóa được " + p.getFileName() + ": " + e.getMessage());
                }
            }
        } catch (IOException ignored) {
        }
    }
}