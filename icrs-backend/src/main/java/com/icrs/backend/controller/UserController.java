package com.icrs.backend.controller;

import com.icrs.backend.model.entity.User;
import com.icrs.backend.model.projection.UserSummary;
import com.icrs.backend.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.saveUser(user);
    }

    // 🔥 NEW ENDPOINT (OPTIMIZED: NO PASSWORD RETURNED)
    @GetMapping("/me")
    public UserSummary getCurrentUser(Authentication authentication) {

        // This gets email from JWT (sub)
        String email = authentication.getName();

        return userService.getUserSummaryByEmail(email);
    }
}