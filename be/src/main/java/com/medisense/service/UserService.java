    package com.medisense.service;

    import com.medisense.entity.User;
    import com.medisense.repository.UserRepository;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.stereotype.Service;

    import java.util.List;
    import java.util.Optional;

    @Service
    public class UserService {

        @Autowired
        private UserRepository userRepository;

        // Khởi tạo BCryptPasswordEncoder để mã hóa mật khẩu
        private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        // --- Tính năng Đăng ký tài khoản ---
        public User register(User user) {
            if (userRepository.findByUsername(user.getUsername()).isPresent()) {
                throw new RuntimeException("Tên đăng nhập đã tồn tại!");
            }
            // Mã hóa mật khẩu thô trước khi lưu vào database
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
            return userRepository.save(user);
        }

        // --- Tính năng Đăng nhập ---
        public User login(String username, String rawPassword) {
            Optional<User> optionalUser = userRepository.findByUsername(username);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                // Sử dụng passwordEncoder.matches() để so sánh mật khẩu nhập vào (raw) với hash trong DB
                if (passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
                    return user; // Đăng nhập thành công
                }
            }
            return null; // Sai tài khoản hoặc mật khẩu
        }

        // --- Các chức năng quản lý khác (CRUD cơ bản) ---
        public List<User> getAllUsers() {
            return userRepository.findAll();
        }

        public User getUserById(Long id) {
            return userRepository.findById(id).orElse(null);
        }

        public User createUser(User user) {
            // Nếu tạo user mới từ trang quản trị, cũng cần mã hóa mật khẩu nếu có truyền vào
            if (user.getPasswordHash() != null && !user.getPasswordHash().isEmpty()) {
                user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
            }
            return userRepository.save(user);
        }

        public User updateUser(Long id, User userDetails) {
            Optional<User> optionalUser = userRepository.findById(id);
            if (optionalUser.isPresent()) {
                User user = optionalUser.get();
                user.setUsername(userDetails.getUsername());
                
                // Chỉ mã hóa và cập nhật lại mật khẩu nếu người dùng có nhập mật khẩu mới
                if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isEmpty()) {
                    user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
                }
                
                user.setFullName(userDetails.getFullName());
                user.setEmail(userDetails.getEmail());
                user.setPhone(userDetails.getPhone());
                user.setAvatarUrl(userDetails.getAvatarUrl());
                user.setRole(userDetails.getRole());
                user.setTokenTele(userDetails.getTokenTele());
                user.setIdChatTele(userDetails.getIdChatTele());
                user.setIsActive(userDetails.getIsActive());
                
                return userRepository.save(user);
            }
            return null;
        }

        public boolean deleteUser(Long id) {
            if (userRepository.existsById(id)) {
                userRepository.deleteById(id);
                return true;
            }
            return false;
        }
    }