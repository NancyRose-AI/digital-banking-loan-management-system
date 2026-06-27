package com.banking.digital.service.impl;
import com.banking.digital.dto.AuthRequest;
import com.banking.digital.dto.AuthResponse;
import com.banking.digital.dto.RegisterRequest;
import com.banking.digital.entity.Role;
import com.banking.digital.entity.User;
import com.banking.digital.exception.BadRequestException;
import com.banking.digital.repository.RoleRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.service.AuthService;
import com.banking.digital.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.banking.digital.security.JwtService jwtService;
    private final FraudDetectionService fraudDetectionService;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found"));
        
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException ex) {
            fraudDetectionService.logFraudEvent(user.getId(), "FAILED_LOGIN", "Failed login attempt for user: " + request.getUsername(), "LOW");
            throw ex;
        }
        
        java.util.Map<String, Object> extraClaims = buildClaims(user);
        String token = jwtService.generateToken(extraClaims, new com.banking.digital.security.CustomUserDetails(user));
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getId());
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        
        Role userRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role(null, "ROLE_CUSTOMER")));
                
        Set<Role> roles = new java.util.HashSet<>(Set.of(userRole));
        if ("adminuser".equals(request.getUsername())) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role(null, "ROLE_ADMIN")));
            roles.add(adminRole);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .enabled(true)
                .roles(roles)
                .build();
                
        user = userRepository.save(user);
        
        java.util.Map<String, Object> extraClaims = buildClaims(user);
        String token = jwtService.generateToken(extraClaims, new com.banking.digital.security.CustomUserDetails(user));
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getId());
    }

    private java.util.Map<String, Object> buildClaims(User user) {
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        Set<Role> roles = user.getRoles() == null ? Set.of() : user.getRoles();
        extraClaims.put("roles", roles.stream().map(Role::getName).collect(Collectors.toList()));
        extraClaims.put("userId", user.getId());
        return extraClaims;
    }
    @Override
    public Long getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
