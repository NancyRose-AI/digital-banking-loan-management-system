package com.banking.digital.controller;
import com.banking.digital.dto.AccountDTO;
import com.banking.digital.dto.ApiResponse;
import com.banking.digital.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> createAccount(@PathVariable Long userId, @RequestParam String accountType) {
        return ResponseEntity.ok(ApiResponse.success("Account created", accountService.createAccount(userId, accountType)));
    }

    @GetMapping("/{accountNumber}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AccountDTO>> getAccount(@PathVariable String accountNumber) {
        return ResponseEntity.ok(ApiResponse.success("Account found", accountService.getAccountByNumber(accountNumber)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getUserAccounts(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Accounts found", accountService.getUserAccounts(userId)));
    }
}
