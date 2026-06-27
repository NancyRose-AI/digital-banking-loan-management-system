package com.banking.digital.service.impl;
import com.banking.digital.dto.EmiScheduleDTO;
import com.banking.digital.dto.LoanDTO;
import com.banking.digital.dto.LoanRequest;
import com.banking.digital.entity.EmiSchedule;
import com.banking.digital.entity.Loan;
import com.banking.digital.entity.LoanStatus;
import com.banking.digital.entity.User;
import com.banking.digital.repository.EmiScheduleRepository;
import com.banking.digital.repository.KycDocumentRepository;
import com.banking.digital.repository.LoanRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.repository.TransactionRepository;
import com.banking.digital.repository.AccountRepository;
import com.banking.digital.entity.Transaction;
import com.banking.digital.dto.EmiPaymentVerifyRequest;
import com.banking.digital.service.AccountService;
import com.banking.digital.service.CreditScoreService;
import com.banking.digital.service.FraudDetectionService;
import com.banking.digital.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final AccountService accountService;
    private final EmiScheduleRepository emiScheduleRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CreditScoreService creditScoreService;
    private final FraudDetectionService fraudDetectionService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private LoanDTO toDTO(Loan loan) {
        List<EmiScheduleDTO> emiDTOs = emiScheduleRepository.findByLoanId(loan.getId())
                .stream()
                .map(this::toEmiDTO)
                .collect(Collectors.toList());

        return LoanDTO.builder()
                .id(loan.getId())
                .loanReference(loan.getLoanReference())
                .principalAmount(loan.getPrincipalAmount())
                .interestRate(loan.getInterestRate())
                .tenureMonths(loan.getTenureMonths())
                .status(loan.getStatus())
                .createdAt(loan.getCreatedAt())
                .emiSchedules(emiDTOs)
                .build();
    }

    private EmiScheduleDTO toEmiDTO(EmiSchedule e) {
        return EmiScheduleDTO.builder()
                .id(e.getId())
                .installmentNumber(e.getInstallmentNumber())
                .emiAmount(e.getEmiAmount())
                .principalComponent(e.getPrincipalComponent())
                .interestComponent(e.getInterestComponent())
                .outstandingBalance(e.getOutstandingBalance())
                .dueDate(e.getDueDate())
                .status(e.getStatus())
                .build();
    }

    @Override
    @Transactional
    public LoanDTO applyForLoan(Long userId, LoanRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean kycVerified = kycDocumentRepository.findByUserId(userId)
                .stream().anyMatch(doc -> "VERIFIED".equals(doc.getStatus()));
        if (!kycVerified) {
            throw new RuntimeException("KYC verification is required to apply for a loan");
        }

        Loan loan = Loan.builder()
                .loanReference(UUID.randomUUID().toString())
                .user(user)
                .principalAmount(request.getPrincipalAmount())
                .interestRate(new BigDecimal("10.5"))
                .tenureMonths(request.getTenureMonths())
                .status(LoanStatus.PENDING)
                .build();
        Loan saved = loanRepository.save(loan);
        
       
        fraudDetectionService.checkLoanApplication(userId, request.getPrincipalAmount());
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public LoanDTO approveLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
        if (!LoanStatus.PENDING.equals(loan.getStatus())) {
            throw new RuntimeException("Only PENDING loans can be approved. Current status: " + loan.getStatus());
        }
        
        String accountNumber = accountService.getUserAccounts(loan.getUser().getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User has no bank account. Cannot disburse loan."))
                .getAccountNumber();
        accountService.updateBalance(accountNumber, loan.getPrincipalAmount());
        
        Transaction transaction = Transaction.builder()
                .transactionReference(UUID.randomUUID().toString())
                .sourceAccount(null)
                .destinationAccount(accountRepository.findByAccountNumber(accountNumber).orElse(null))
                .amount(loan.getPrincipalAmount())
                .type("LOAN_CREDIT")
                .status("COMPLETED")
                .description("Loan disbursement for reference: " + loan.getLoanReference())
                .build();
        transactionRepository.save(transaction);
        
        loan.setStatus(LoanStatus.ACTIVE);
        Loan saved = loanRepository.save(loan);
        generateEmiSchedule(saved);
        
        
        creditScoreService.calculateAndSaveCreditScore(saved.getUser().getId());
        
        return toDTO(saved);
    }

    @Override
    @Transactional
    public Map<String, Object> createEmiPaymentOrder(Long loanId, int installmentNumber) {
        EmiSchedule schedule = emiScheduleRepository.findByLoanIdAndInstallmentNumber(loanId, installmentNumber)
                .orElseThrow(() -> new RuntimeException("EMI installment not found"));
        
        if (!"PENDING".equals(schedule.getStatus())) {
            throw new RuntimeException("EMI already paid or overdue");
        }

        long amountInPaise = schedule.getEmiAmount().multiply(new BigDecimal(100)).longValue();

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBasicAuth(keyId, keySecret);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountInPaise);
        body.put("currency", "INR");
        body.put("receipt", "emi_" + loanId + "_" + installmentNumber);

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
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Razorpay: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void verifyAndPayEmi(Long loanId, int installmentNumber, EmiPaymentVerifyRequest request) {
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
            Long userId = null;
            try {
                Loan loan = loanRepository.findById(loanId).orElse(null);
                if (loan != null && loan.getUser() != null) {
                    userId = loan.getUser().getId();
                    fraudDetectionService.logFraudEvent(userId, "EMI_PAYMENT_FAILURE", "Invalid signature during EMI payment for loan " + loanId, "LOW");
                    fraudDetectionService.checkEmiFailure(userId);
                }
            } catch (Exception ex) {}
            throw new RuntimeException("Invalid signature: Payment verification failed");
        }

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found"));
        EmiSchedule schedule = emiScheduleRepository.findByLoanIdAndInstallmentNumber(loanId, installmentNumber)
                .orElseThrow(() -> new RuntimeException("EMI installment not found"));
        
        if (!"PENDING".equals(schedule.getStatus())) {
            throw new RuntimeException("EMI already paid or overdue");
        }
        
        String accountNumber = accountService.getUserAccounts(loan.getUser().getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User has no account"))
                .getAccountNumber();
                
        accountService.updateBalance(accountNumber, schedule.getEmiAmount().negate());
        
        schedule.setStatus("PAID");
        emiScheduleRepository.save(schedule);
        
        Transaction transaction = Transaction.builder()
                .transactionReference(request.getRazorpayPaymentId())
                .sourceAccount(null)
                .destinationAccount(accountRepository.findByAccountNumber(accountNumber).orElse(null))
                .amount(schedule.getEmiAmount().negate())
                .type("EMI_PAYMENT")
                .status("COMPLETED")
                .description("EMI #" + installmentNumber + " Payment via Razorpay (Order: " + request.getRazorpayOrderId() + ")")
                .build();
        transactionRepository.save(transaction);

        long pendingCount = emiScheduleRepository.countByLoanIdAndStatus(loanId, "PENDING");
        if (pendingCount == 0) {
            loan.setStatus(LoanStatus.CLOSED);
            loanRepository.save(loan);
        }

        
        creditScoreService.calculateAndSaveCreditScore(loan.getUser().getId());
    }

    @Override
    public List<LoanDTO> getUserLoans(Long userId) {
        return loanRepository.findByUserId(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<EmiScheduleDTO> getEmiSchedule(Long loanId) {
        return emiScheduleRepository.findByLoanId(loanId)
                .stream()
                .map(this::toEmiDTO)
                .collect(Collectors.toList());
    }

    private void generateEmiSchedule(Loan loan) {
        int n = loan.getTenureMonths();
        BigDecimal principal = loan.getPrincipalAmount();
        BigDecimal annualRate = loan.getInterestRate();

        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_EVEN);

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal onePlusRPowN = onePlusR.pow(n, new MathContext(15, RoundingMode.HALF_EVEN));
        BigDecimal emi = principal.multiply(monthlyRate).multiply(onePlusRPowN)
                .divide(onePlusRPowN.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_EVEN);

        BigDecimal outstanding = principal;
        LocalDate dueDate = LocalDate.now().plusMonths(1);

        for (int i = 1; i <= n; i++) {
            BigDecimal interestComp = outstanding.multiply(monthlyRate).setScale(2, RoundingMode.HALF_EVEN);
            BigDecimal principalComp = emi.subtract(interestComp).setScale(2, RoundingMode.HALF_EVEN);
            outstanding = outstanding.subtract(principalComp).setScale(2, RoundingMode.HALF_EVEN);
            if (outstanding.compareTo(BigDecimal.ZERO) < 0) outstanding = BigDecimal.ZERO;

            EmiSchedule emiSchedule = EmiSchedule.builder()
                    .loan(loan)
                    .installmentNumber(i)
                    .emiAmount(emi)
                    .principalComponent(principalComp)
                    .interestComponent(interestComp)
                    .outstandingBalance(outstanding)
                    .dueDate(dueDate)
                    .status("PENDING")
                    .build();
            emiScheduleRepository.save(emiSchedule);
            dueDate = dueDate.plusMonths(1);
        }
    }
}
