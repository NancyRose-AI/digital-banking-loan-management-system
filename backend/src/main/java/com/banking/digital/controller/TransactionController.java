package com.banking.digital.controller;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.dto.TransactionRequest;
import com.banking.digital.dto.DepositRequest;
import com.banking.digital.dto.DepositVerifyRequest;
import com.banking.digital.service.TransactionService;
import java.util.Map;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> transfer(@Valid @RequestBody TransactionRequest request) {
        transactionService.transfer(request);
        return ResponseEntity.ok(ApiResponse.success("Transfer successful", "Transaction completed"));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<com.banking.digital.dto.TransactionDTO>>> getUserTransactions(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved", transactionService.getUserTransactions(userId)));
    }

    @PostMapping("/deposit/order")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDepositOrder(@Valid @RequestBody DepositRequest request) {
        Map<String, Object> orderData = transactionService.createDepositOrder(request);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", orderData));
    }

    @PostMapping("/deposit/verify")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> verifyAndCompleteDeposit(@Valid @RequestBody DepositVerifyRequest request) {
        transactionService.verifyAndCompleteDeposit(request);
        return ResponseEntity.ok(ApiResponse.success("Deposit completed successfully", "Balance updated"));
    }
}
