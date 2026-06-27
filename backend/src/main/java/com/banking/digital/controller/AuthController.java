package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.AuthRequest;
import com.banking.digital.dto.AuthResponse;
import com.banking.digital.dto.RegisterRequest;
import com.banking.digital.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Registration successful", authService.register(request)));
    }

    /**
     * Validates the current JWT token against the live database.
     * Called by the frontend on app startup to detect stale/invalidated tokens
     * (e.g. after a server restart with an in-memory DB).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Not authenticated"));
        }
        String username = auth.getName();
        Long userId = authService.getUserIdByUsername(username);
        return ResponseEntity.ok(ApiResponse.success("Token valid",
                Map.of("username", username, "userId", userId)));
    }
}
