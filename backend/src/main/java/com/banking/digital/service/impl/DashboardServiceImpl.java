package com.banking.digital.service.impl;
import com.banking.digital.dto.DashboardDTO;
import com.banking.digital.dto.TransactionDTO;
import com.banking.digital.entity.Account;
import com.banking.digital.entity.EmiSchedule;
import com.banking.digital.entity.Loan;
import com.banking.digital.entity.Transaction;
import com.banking.digital.repository.AccountRepository;
import com.banking.digital.repository.EmiScheduleRepository;
import com.banking.digital.repository.LoanRepository;
import com.banking.digital.repository.TransactionRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.entity.LoanStatus;
import com.banking.digital.repository.KycDocumentRepository;
import com.banking.digital.service.DashboardService;
import com.banking.digital.repository.FraudLogRepository;
import com.banking.digital.repository.CreditScoreRepository;
import com.banking.digital.entity.CreditScore;
import com.banking.digital.dto.CreditScoreResultDTO;
import com.banking.digital.service.CreditScoreService;
import com.banking.digital.dto.AdminDashboardDTO;
import com.banking.digital.dto.EmployeeDashboardDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DashboardServiceImpl implements DashboardService {

    private final AccountRepository accountRepository;
    private final LoanRepository loanRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final FraudLogRepository fraudLogRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final CreditScoreRepository creditScoreRepository;
    private final CreditScoreService creditScoreService;
    private final EmiScheduleRepository emiScheduleRepository;

    @Override
    public DashboardDTO getCustomerDashboard(Long userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);
        
        BigDecimal totalBalance = BigDecimal.ZERO;
        BigDecimal savingsBalance = BigDecimal.ZERO;
        BigDecimal checkingBalance = BigDecimal.ZERO;

        for (Account account : accounts) {
            totalBalance = totalBalance.add(account.getBalance());
            if ("SAVINGS".equalsIgnoreCase(account.getAccountType())) {
                savingsBalance = savingsBalance.add(account.getBalance());
            } else if ("CHECKING".equalsIgnoreCase(account.getAccountType())) {
                checkingBalance = checkingBalance.add(account.getBalance());
            }
        }

        List<Loan> activeLoans = loanRepository.findByUserId(userId).stream()
                .filter(loan -> LoanStatus.ACTIVE.equals(loan.getStatus()) || LoanStatus.APPROVED.equals(loan.getStatus()))
                .collect(Collectors.toList());

        BigDecimal activeLoanAmount = activeLoans.stream()
                .map(Loan::getPrincipalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        
        BigDecimal loanEmiBalance = BigDecimal.ZERO;

        
        List<EmiSchedule> pendingEmis = emiScheduleRepository.findPendingEmisByUserId(userId);
        BigDecimal upcomingEmiAmount = BigDecimal.ZERO;
        java.time.LocalDate upcomingEmiDueDate = null;
        Long upcomingEmiLoanId = null;
        Integer upcomingEmiInstallmentNumber = null;

        int upcomingEmiCount = 0;

        if (!pendingEmis.isEmpty()) {
            java.util.Map<Long, EmiSchedule> firstEmiPerLoan = pendingEmis.stream()
                .collect(java.util.stream.Collectors.toMap(
                        e -> e.getLoan().getId(),
                        e -> e,
                        (a, b) -> a 
                ));

            
            loanEmiBalance = firstEmiPerLoan.values().stream()
                .map(EmiSchedule::getEmiAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            
            upcomingEmiDueDate = firstEmiPerLoan.values().stream()
                .map(EmiSchedule::getDueDate)
                .min(java.time.LocalDate::compareTo)
                .orElse(null);

            if (upcomingEmiDueDate != null) {
                java.time.LocalDate finalEarliestDate = upcomingEmiDueDate;
                List<EmiSchedule> emisDueOnEarliestDate = firstEmiPerLoan.values().stream()
                    .filter(e -> e.getDueDate().equals(finalEarliestDate))
                    .collect(Collectors.toList());

                upcomingEmiCount = emisDueOnEarliestDate.size();
                upcomingEmiAmount = emisDueOnEarliestDate.stream()
                    .map(EmiSchedule::getEmiAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

                upcomingEmiLoanId = emisDueOnEarliestDate.get(0).getLoan().getId();
                upcomingEmiInstallmentNumber = emisDueOnEarliestDate.get(0).getInstallmentNumber();
            }
        }

        BigDecimal totalPendingEmiAmount = pendingEmis.stream()
                .map(EmiSchedule::getEmiAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal availableFunds = totalBalance;

        
        List<Transaction> transactions = transactionRepository.findRecentTransactionsByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 10));
        
        
        List<Transaction> allTransactions = transactionRepository.findAllByUserId(userId);
        
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate yesterday = today.minusDays(1);
        
        int depositsToday = 0, depositsYesterday = 0;
        int transfersToday = 0, transfersYesterday = 0;
        int loansToday = 0, loansYesterday = 0;
        int emisToday = 0, emisYesterday = 0;
        
        for (Transaction t : allTransactions) {
            if (!"COMPLETED".equals(t.getStatus())) continue;
            
            java.time.LocalDate txDate = t.getCreatedAt().toLocalDate();
            boolean isToday = txDate.equals(today);
            boolean isYesterday = txDate.equals(yesterday);
            
            if (!isToday && !isYesterday) continue;
            
            if ("DEPOSIT".equals(t.getType())) {
                if (isToday) depositsToday++; else depositsYesterday++;
            } else if ("TRANSFER".equals(t.getType())) {
                if (isToday) transfersToday++; else transfersYesterday++;
            } else if ("LOAN_CREDIT".equals(t.getType()) || "LOAN_DISBURSEMENT".equals(t.getType())) {
                if (isToday) loansToday++; else loansYesterday++;
            } else if ("EMI_PAYMENT".equals(t.getType())) {
                if (isToday) emisToday++; else emisYesterday++;
            }
        }
        
        List<String> activityLabels = java.util.Arrays.asList("Deposits", "Transfers", "Loan Activities", "EMI Payments");
        List<Integer> activityTodayData = java.util.Arrays.asList(depositsToday, transfersToday, loansToday, emisToday);
        List<Integer> activityYesterdayData = java.util.Arrays.asList(depositsYesterday, transfersYesterday, loansYesterday, emisYesterday);

        List<TransactionDTO> recentTransactions = transactions.stream().map(t ->
            TransactionDTO.builder()
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
        ).collect(Collectors.toList());

        List<com.banking.digital.entity.KycDocument> docs = kycDocumentRepository.findByUserId(userId);
        String kycStatus = null;
        if (docs != null && !docs.isEmpty()) {
            boolean isVerified = docs.stream().anyMatch(d -> "VERIFIED".equals(d.getStatus()));
            kycStatus = isVerified ? "VERIFIED" : "PENDING";
        }

        
        CreditScoreResultDTO creditScoreResult = creditScoreService.calculateAndSaveCreditScore(userId);

        return DashboardDTO.builder()
                .totalBalance(totalBalance)
                .activeLoans(activeLoans.size())
                .recentTransactionsCount(recentTransactions.size())
                .recentTransactions(recentTransactions)
                .savingsBalance(savingsBalance)
                .checkingBalance(checkingBalance)
                .loanEmiBalance(loanEmiBalance)
                .creditScore(creditScoreResult.getCreditScore().getScore())
                .creditScoreRating(creditScoreResult.getRatingCategory())
                .creditScoreFactors(creditScoreResult.getFactors())
                .upcomingEmiAmount(upcomingEmiAmount)
                .upcomingEmiDueDate(upcomingEmiDueDate)
                .upcomingEmiLoanId(upcomingEmiLoanId)
                .upcomingEmiInstallmentNumber(upcomingEmiInstallmentNumber)
                .upcomingEmiCount(upcomingEmiCount)
                .kycStatus(kycStatus)
                .activityLabels(activityLabels)
                .activityTodayData(activityTodayData)
                .activityYesterdayData(activityYesterdayData)
                .activeLoanAmount(activeLoanAmount)
                .totalPendingEmiAmount(totalPendingEmiAmount)
                .availableFunds(availableFunds)
                .build();
    }

    @Override
    public AdminDashboardDTO getAdminDashboard() {
        long totalCustomers = userRepository.count();
        long totalLoans = loanRepository.count();
        
        BigDecimal totalRevenue = transactionRepository.findAll().stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long fraudAlerts = fraudLogRepository.countByResolved(false);
        long newRegistrations = totalCustomers;

        List<TransactionDTO> recentSystemTransactions = transactionRepository.findAll(org.springframework.data.domain.PageRequest.of(0, 5))
                .stream().map(t -> 
                    TransactionDTO.builder()
                        .id(t.getId())
                        .transactionReference(t.getTransactionReference())
                        .amount(t.getAmount())
                        .type(t.getType())
                        .status(t.getStatus())
                        .createdAt(t.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        return AdminDashboardDTO.builder()
                .totalCustomers(totalCustomers)
                .totalLoans(totalLoans)
                .totalRevenue(totalRevenue)
                .fraudAlertsCount(fraudAlerts)
                .newRegistrationsCount(newRegistrations)
                .recentSystemTransactions(recentSystemTransactions)
                .build();
    }

    @Override
    public EmployeeDashboardDTO getEmployeeDashboard() {
        long pendingLoans = loanRepository.findAll().stream()
                .filter(loan -> LoanStatus.PENDING.equals(loan.getStatus()))
                .count();

        long pendingKyc = kycDocumentRepository.count();
        long dailyOps = transactionRepository.count();

        return EmployeeDashboardDTO.builder()
                .pendingLoanApprovals(pendingLoans)
                .pendingKycVerifications(pendingKyc)
                .dailyOperationsCount(dailyOps)
                .customerRequestsCount(5)
                .build();
    }
}
