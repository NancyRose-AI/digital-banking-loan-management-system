package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.FraudAlertDTO;
import com.banking.digital.entity.FraudLog;
import com.banking.digital.repository.FraudLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/fraud")
@RequiredArgsConstructor
public class FraudController {

    private final FraudLogRepository fraudLogRepository;

    @GetMapping("/alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FraudAlertDTO>>> getUnresolvedAlerts() {
        List<FraudAlertDTO> alerts = fraudLogRepository.findByResolved(false).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Fraud alerts retrieved", alerts));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FraudAlertDTO>>> getUserFraudAlerts(@PathVariable Long userId) {
        List<FraudAlertDTO> alerts = fraudLogRepository.findByUserIdAndResolvedOrderByCreatedAtDesc(userId, false).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("User fraud alerts retrieved", alerts));
    }

    @GetMapping("/user/{userId}/all")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FraudAlertDTO>>> getAllUserFraudAlerts(@PathVariable Long userId) {
        List<FraudAlertDTO> alerts = fraudLogRepository.findByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("All user fraud alerts retrieved", alerts));
    }

    @PutMapping("/alerts/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> resolveAlert(@PathVariable Long id) {
        FraudLog log = fraudLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fraud alert not found"));
        log.setResolved(true);
        fraudLogRepository.save(log);
        return ResponseEntity.ok(ApiResponse.success("Fraud alert marked as resolved", null));
    }

    private FraudAlertDTO toDTO(FraudLog log) {
        return FraudAlertDTO.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .username(log.getUser() != null ? log.getUser().getUsername() : "Unknown")
                .eventType(log.getEventType())
                .description(log.getDescription())
                .riskLevel(log.getRiskLevel())
                .resolved(log.getResolved())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
