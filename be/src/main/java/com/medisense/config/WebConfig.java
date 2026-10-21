package com.medisense.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Đọc đường dẫn thư mục faces từ application.properties
    @Value("${face.upload-dir}")
    private String faceUploadDir;

    // Đọc đường dẫn thư mục images/violations từ application.properties
    @Value("${violation.upload-dir}")
    private String violationUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Áp dụng cho ảnh khuôn mặt: /faces/** -> trỏ tới thư mục facesUploadDir
        Path facePath = Paths.get(faceUploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/faces/**")
                .addResourceLocations(facePath.toUri().toString() + "/");

        // 2. Áp dụng cho ảnh vi phạm: /images/** -> trỏ tới thư mục violationUploadDir
        Path violationPath = Paths.get(violationUploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/images/**")
                .addResourceLocations(violationPath.toUri().toString() + "/");
    }
}