package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.DashboardDTO;
import com.banking.digital.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<DashboardDTO>> getCustomerDashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved successfully", dashboardService.getCustomerDashboard(userId)));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<com.banking.digital.dto.AdminDashboardDTO>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard retrieved", dashboardService.getAdminDashboard()));
    }

    @GetMapping("/employee")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
    public ResponseEntity<ApiResponse<com.banking.digital.dto.EmployeeDashboardDTO>> getEmployeeDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Employee dashboard retrieved", dashboardService.getEmployeeDashboard()));
    }
}
