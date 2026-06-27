package com.banking.digital.service.impl;
import com.banking.digital.dto.TransactionRequest;
import com.banking.digital.dto.DepositRequest;
import com.banking.digital.dto.DepositVerifyRequest;
import com.banking.digital.entity.Account;
import com.banking.digital.entity.Transaction;
import com.banking.digital.repository.AccountRepository;
import com.banking.digital.repository.TransactionRepository;
import com.banking.digital.service.AccountService;
import com.banking.digital.service.FraudDetectionService;
import com.banking.digital.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AccountService accountService;
    private final FraudDetectionService fraudDetectionService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Override
    @Transactional
    public Map<String, Object> createDepositOrder(DepositRequest request) {
        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Account not found"));

        BigDecimal rawAmount = request.getAmount();
        if (rawAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid deposit amount");
        }
        long amountInPaise = rawAmount.multiply(new BigDecimal(100)).longValue();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(keyId, keySecret);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountInPaise);
        body.put("currency", "INR");
        body.put("receipt", "rcpt_" + UUID.randomUUID().toString().substring(0, 8));

        HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.razorpay.com/v1/orders",
                    httpEntity,
                    Map.class
            );

            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> orderDetails = response.getBody();
                Map<String, Object> result = new HashMap<>();
                result.put("orderId", orderDetails.get("id"));
                result.put("amount", orderDetails.get("amount"));
                result.put("currency", orderDetails.get("currency"));
                result.put("keyId", keyId);
                return result;
            } else {
                throw new RuntimeException("Failed to create Razorpay order: empty response body");
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            
            throw new RuntimeException("Razorpay rejected the order request: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Razorpay: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void verifyAndCompleteDeposit(DepositVerifyRequest request) {
        String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
        boolean isSignatureValid = false;
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(
                    keySecret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            isSignatureValid = hexString.toString().equals(request.getRazorpaySignature());
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify payment signature: " + e.getMessage());
        }

        if (!isSignatureValid) {
            throw new RuntimeException("Invalid signature: Payment verification failed");
        }

        Account account = accountRepository.findByAccountNumber(request.getAccountNumber())
                .orElseThrow(() -> new RuntimeException("Target account not found"));

        accountService.updateBalance(account.getAccountNumber(), request.getAmount());

        Transaction transaction = Transaction.builder()
                .transactionReference(request.getRazorpayPaymentId())
                .sourceAccount(null)
                .destinationAccount(account)
                .amount(request.getAmount())
                .type("DEPOSIT")
                .status("COMPLETED")
                .description("Deposit via Razorpay (Order: " + request.getRazorpayOrderId() + ")")
                .build();

        transactionRepository.save(transaction);

        
        if (account.getUser() != null) {
            fraudDetectionService.checkDeposit(account.getUser().getId(), request.getAmount());
        }
    }

    @Override
    @Transactional
    public void transfer(TransactionRequest request) {
        Account sourceAccount = accountRepository.findByAccountNumber(request.getSourceAccountNumber())
                .orElseThrow(() -> new RuntimeException("Source account not found"));
        Account destinationAccount = accountRepository.findByAccountNumber(request.getDestinationAccountNumber())
                .orElseThrow(() -> new RuntimeException("Destination account not found"));

        if (sourceAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        accountService.updateBalance(sourceAccount.getAccountNumber(), request.getAmount().negate());
        accountService.updateBalance(destinationAccount.getAccountNumber(), request.getAmount());

        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .sourceAccount(sourceAccount)
                .destinationAccount(destinationAccount)
                .amount(request.getAmount())
                .type("TRANSFER")
                .status("COMPLETED")
                .description(request.getDescription())
                .build();
                
        transactionRepository.save(transaction);

        
        Long sourceUserId = sourceAccount.getUser() != null ? sourceAccount.getUser().getId() : null;
        if (sourceUserId != null) {
            fraudDetectionService.checkTransfer(sourceUserId, request.getAmount());
        }
    }

    @Override
    public java.util.List<com.banking.digital.dto.TransactionDTO> getUserTransactions(Long userId) {
        java.util.List<Transaction> transactions = transactionRepository.findRecentTransactionsByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 100));
        return transactions.stream().map(t -> 
            com.banking.digital.dto.TransactionDTO.builder()
                .id(t.getId())
                .transactionReference(t.getTransactionReference())
                .sourceAccountNumber(t.getSourceAccount() != null ? t.getSourceAccount().getAccountNumber() : null)
                .destinationAccountNumber(t.getDestinationAccount() != null ? t.getDestinationAccount().getAccountNumber() : null)
                .amount(t.getAmount())
                .type(t.getType())
                .status(t.getStatus())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build()
        ).collect(java.util.stream.Collectors.toList());
    }
}
