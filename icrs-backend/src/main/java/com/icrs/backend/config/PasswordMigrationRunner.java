package com.icrs.backend.config;

import com.icrs.backend.model.entity.User;

import com.icrs.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder encoder;

    public PasswordMigrationRunner(UserRepository userRepository,
                                   BCryptPasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {

        userRepository.findAll().forEach(user -> {

            // if password is not encoded yet
            if (!user.getPassword().startsWith("$2a$")) {

                String encoded = encoder.encode(user.getPassword());
                user.setPassword(encoded);
                userRepository.save(user);

                System.out.println("Migrated password for: " + user.getEmail());
            }
        });

        System.out.println("Password migration completed.");
    }
}