package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.FinancialReportDTO;
import com.banking.digital.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<FinancialReportDTO>> getReport(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "ALL_TIME") String period) {
        FinancialReportDTO report = reportService.getReport(userId, period);
        return ResponseEntity.ok(ApiResponse.success("Report generated successfully", report));
    }
}
