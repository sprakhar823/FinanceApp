package com.financeflow.backend.config;

import com.financeflow.backend.model.Role;
import com.financeflow.backend.model.User;
import com.financeflow.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            System.out.println("\n------------------------------------------------");
            System.out.println("✅ Created default ADMIN user:");
            System.out.println("   Username: admin");
            System.out.println("   Password: admin");
            System.out.println("------------------------------------------------\n");
        }
    }
}
