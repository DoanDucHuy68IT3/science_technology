package com.medisense.controller;

import com.medisense.entity.User;
import com.medisense.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // <-- BẮT BUỘC PHẢI CÓ để Spring nhận diện là Controller xử lý API
@CrossOrigin
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;
    // POST: Đăng ký tài khoản -> Endpoint: POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User newUser = userService.register(user);
            return ResponseEntity.ok(newUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST: Đăng nhập -> Endpoint: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        User user = userService.login(loginRequest.getUsername(), loginRequest.getPasswordHash());
        if (user != null) {
            return ResponseEntity.ok(user); // Đăng nhập thành công, trả về thông tin user
        }
        return ResponseEntity.status(401).body("Sai tên đăng nhập hoặc mật khẩu!");
    }
}