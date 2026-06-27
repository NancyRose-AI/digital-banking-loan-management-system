package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.EmiScheduleDTO;
import com.banking.digital.dto.LoanDTO;
import com.banking.digital.dto.LoanRequest;
import com.banking.digital.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.banking.digital.dto.EmiPaymentVerifyRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/apply/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanDTO>> applyForLoan(
            @PathVariable Long userId,
            @Valid @RequestBody LoanRequest request) {
        LoanDTO loan = loanService.applyForLoan(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Loan application submitted successfully", loan));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LoanDTO>>> getUserLoans(@PathVariable Long userId) {
        List<LoanDTO> loans = loanService.getUserLoans(userId);
        return ResponseEntity.ok(ApiResponse.success("Loans retrieved successfully", loans));
    }

    @GetMapping("/{loanId}/emi")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EmiScheduleDTO>>> getEmiSchedule(@PathVariable Long loanId) {
        List<EmiScheduleDTO> schedule = loanService.getEmiSchedule(loanId);
        return ResponseEntity.ok(ApiResponse.success("EMI schedule retrieved", schedule));
    }

    @PutMapping("/{loanId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<LoanDTO>> approveLoan(@PathVariable Long loanId) {
        LoanDTO loan = loanService.approveLoan(loanId);
        return ResponseEntity.ok(ApiResponse.success("Loan approved and amount credited to account", loan));
    }

    @PostMapping("/{loanId}/emi/{installmentNumber}/order")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createEmiPaymentOrder(
            @PathVariable Long loanId,
            @PathVariable int installmentNumber) {
        Map<String, Object> orderDetails = loanService.createEmiPaymentOrder(loanId, installmentNumber);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", orderDetails));
    }

    @PutMapping("/{loanId}/emi/{installmentNumber}/pay")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> payEmi(
            @PathVariable Long loanId,
            @PathVariable int installmentNumber,
            @Valid @RequestBody EmiPaymentVerifyRequest request) {
        loanService.verifyAndPayEmi(loanId, installmentNumber, request);
        return ResponseEntity.ok(ApiResponse.success("EMI payment successful", "Installment " + installmentNumber + " paid"));
    }

    @PutMapping("/{loanId}/self-approve")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<LoanDTO>> selfApproveLoan(@PathVariable Long loanId) {
        LoanDTO loan = loanService.approveLoan(loanId);
        return ResponseEntity.ok(ApiResponse.success("Loan approved (self-approval for testing)", loan));
    }
}
