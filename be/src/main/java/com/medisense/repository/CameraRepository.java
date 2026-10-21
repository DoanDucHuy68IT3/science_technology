    package com.medisense.repository;

    import java.util.List;
    import java.util.Optional;

    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.stereotype.Repository;

    import com.medisense.entity.CameraDevice;
    import com.medisense.entity.Person;

    @Repository
    public interface CameraRepository extends JpaRepository<CameraDevice, Long> {
        
        // Tìm kiếm theo mã camera (do có ràng buộc unique)
        Optional<CameraDevice> findByCameraCode(String cameraCode);
        
        // Lấy danh sách camera thuộc về một user cụ thể
        List<CameraDevice> findByUserId(Long userId);
        
        // Kiểm tra mã camera đã tồn tại hay chưa
        boolean existsByCameraCode(String cameraCode); 
    }