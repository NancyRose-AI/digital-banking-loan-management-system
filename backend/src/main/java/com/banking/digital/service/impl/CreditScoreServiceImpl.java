package com.banking.digital.service.impl;
import com.banking.digital.entity.User;
import com.banking.digital.entity.KycDocument;
import com.banking.digital.entity.Transaction;
import com.banking.digital.entity.Loan;
import com.banking.digital.entity.LoanStatus;
import com.banking.digital.entity.EmiSchedule;
import com.banking.digital.repository.KycDocumentRepository;
import com.banking.digital.repository.TransactionRepository;
import com.banking.digital.repository.LoanRepository;
import com.banking.digital.repository.EmiScheduleRepository;

import com.banking.digital.repository.CreditScoreRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.dto.CreditScoreResultDTO;
import com.banking.digital.entity.*;
import com.banking.digital.repository.CreditScoreRepository;
import com.banking.digital.service.CreditScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CreditScoreServiceImpl implements CreditScoreService {

    private final UserRepository userRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final TransactionRepository transactionRepository;
    private final LoanRepository loanRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final CreditScoreRepository creditScoreRepository;

    @Override
    public CreditScoreResultDTO calculateAndSaveCreditScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int score = 300; 
        List<String> factors = new ArrayList<>();
        factors.add("Base Score: 300");

        
        List<KycDocument> kycDocs = kycDocumentRepository.findByUserId(userId);
        boolean isKycVerified = kycDocs != null && kycDocs.stream().anyMatch(d -> "VERIFIED".equals(d.getStatus()));
        if (isKycVerified) {
            score += 100;
            factors.add("KYC Verified: +100");
        }

       
        long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt().toLocalDate(), LocalDate.now());
        int ageBonus = Math.min(50, (int) daysSinceCreation);
        if (ageBonus > 0) {
            score += ageBonus;
            factors.add("Account Age Bonus: +" + ageBonus);
        }

        
        List<Transaction> transactions = transactionRepository.findAllByUserId(userId);
        BigDecimal totalDeposits = transactions.stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()) && "DEPOSIT".equals(t.getType()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int depositBonus = totalDeposits.divide(new BigDecimal("10000"), java.math.RoundingMode.DOWN).intValue() * 10;
        int actualDepositBonus = Math.min(100, depositBonus);
        if (actualDepositBonus > 0) {
            score += actualDepositBonus; 
            factors.add("Deposit Volume Bonus: +" + actualDepositBonus);
        }

       
        long successfulTransfers = transactions.stream()
                .filter(t -> "COMPLETED".equals(t.getStatus()) && "TRANSFER".equals(t.getType()))
                .count();
        int transferBonus = Math.min(50, (int) successfulTransfers * 2);
        if (transferBonus > 0) {
            score += transferBonus;
            factors.add("Active Transfers Bonus: +" + transferBonus);
        }

        
        List<Loan> loans = loanRepository.findByUserId(userId);
        int activeLoansCount = 0;
        
        for (Loan loan : loans) {
            if (LoanStatus.ACTIVE.equals(loan.getStatus())) {
                activeLoansCount++;
            }
            
            List<EmiSchedule> emis = emiScheduleRepository.findByLoanId(loan.getId());
            for (EmiSchedule emi : emis) {
                if ("PAID".equals(emi.getStatus())) {
                    score += 15; 
                    factors.add("Paid EMI: +15");
                } else if ("PENDING".equals(emi.getStatus()) && emi.getDueDate().isBefore(LocalDate.now())) {
                    score -= 20; 
                    factors.add("Overdue EMI Penalty: -20");
                }
            }
        }

        
        if (activeLoansCount > 0) {
            score += 50;
            factors.add("Active Loan Status: +50");
        }

        
        if (score < 300) score = 300;
        if (score > 900) score = 900;

        
        String ratingCategory;
        if (score >= 800) {
            ratingCategory = "Excellent";
        } else if (score >= 740) {
            ratingCategory = "Very Good";
        } else if (score >= 670) {
            ratingCategory = "Good";
        } else if (score >= 580) {
            ratingCategory = "Fair";
        } else {
            ratingCategory = "Poor";
        }

        
        String riskCategory;
        if (score >= 750) {
            riskCategory = "LOW";
        } else if (score >= 600) {
            riskCategory = "MEDIUM";
        } else {
            riskCategory = "HIGH";
        }

        
        CreditScore creditScore = creditScoreRepository.findByUserId(userId).orElse(
                CreditScore.builder().user(user).build()
        );
        creditScore.setScore(score);
        creditScore.setRiskCategory(riskCategory);

        CreditScore savedScore = creditScoreRepository.save(creditScore);
        
        return CreditScoreResultDTO.builder()
                .creditScore(savedScore)
                .ratingCategory(ratingCategory)
                .factors(factors)
                .build();
    }
}
