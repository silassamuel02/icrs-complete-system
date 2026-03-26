package com.icrs.backend.service;

import com.icrs.backend.model.entity.User;
import com.icrs.backend.model.entity.Department;
import com.icrs.backend.model.projection.UserSummary;
import com.icrs.backend.repository.UserRepository;
import com.icrs.backend.repository.DepartmentRepository;
import com.icrs.backend.util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository,
            DepartmentRepository departmentRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    // REGISTER USER
    public User saveUser(User user) {
        System.out.println("DEBUG: Registering user with role: " + user.getRole());

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            System.out.println("DEBUG: Role was null or empty, setting to USER");
            user.setRole("USER");
        } else {
            System.out.println("DEBUG: Keeping existing role: " + user.getRole());
        }

        if (user.getDepartment() != null && user.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(user.getDepartment().getId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }

        return userRepository.save(user);
    }

    // LOGIN USER → RETURN JWT TOKEN
    public String login(String email, String password) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }

    // 🔥 NEW METHOD FOR /api/users/me (PASSWORD-LESS)
    public UserSummary getUserSummaryByEmail(String email) {
        return userRepository.findSummaryByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Still needed for internal logic or initial login
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}