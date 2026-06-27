package com.banking.digital.service.impl;
import com.banking.digital.dto.FinancialReportDTO;
import com.banking.digital.dto.TransactionDTO;
import com.banking.digital.entity.Loan;
import com.banking.digital.entity.Transaction;
import com.banking.digital.repository.AccountRepository;
import com.banking.digital.repository.TransactionRepository;
import com.banking.digital.repository.EmiScheduleRepository;
import com.banking.digital.repository.LoanRepository;
import com.banking.digital.service.CreditScoreService;
import com.banking.digital.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TransactionRepository transactionRepository;
    private final LoanRepository loanRepository;
    private final EmiScheduleRepository emiScheduleRepository;
    private final AccountRepository accountRepository;
    private final CreditScoreService creditScoreService;

    @Override
    public FinancialReportDTO getReport(Long userId, String period) {


        LocalDateTime from;
        LocalDateTime to = LocalDateTime.now();

        switch (period.toUpperCase()) {
            case "TODAY":
                from = LocalDate.now().atStartOfDay();
                break;
            case "THIS_MONTH":
                from = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                break;
            default: 
                from = LocalDateTime.of(2000, 1, 1, 0, 0);
                break;
        }


        List<Transaction> txns = "ALL_TIME".equalsIgnoreCase(period)
                ? transactionRepository.findAllByUserId(userId)
                : transactionRepository.findByUserIdAndDateRange(userId, from, to);


        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;
        BigDecimal totalTransfers = BigDecimal.ZERO;
        BigDecimal totalEmiPaid = BigDecimal.ZERO;
        int depositCount = 0, withdrawalCount = 0, transferCount = 0, emiCount = 0;

        for (Transaction t : txns) {
            if (!"COMPLETED".equals(t.getStatus())) continue;
            BigDecimal abs = t.getAmount().abs();
            switch (t.getType()) {
                case "DEPOSIT":
                    totalDeposits = totalDeposits.add(abs);
                    depositCount++;
                    break;
                case "WITHDRAWAL":
                    totalWithdrawals = totalWithdrawals.add(abs);
                    withdrawalCount++;
                    break;
                case "TRANSFER":
                    totalTransfers = totalTransfers.add(abs);
                    transferCount++;
                    break;
                case "EMI_PAYMENT":
                    totalEmiPaid = totalEmiPaid.add(abs);
                    emiCount++;
                    break;
                default:
                    break;
            }
        }


        List<Loan> loans = loanRepository.findByUserId(userId);
        BigDecimal totalLoanAmount = loans.stream()
                .map(Loan::getPrincipalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);


        BigDecimal currentBalance = accountRepository.findByUserId(userId).stream()
                .map(a -> a.getBalance() == null ? BigDecimal.ZERO : a.getBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);


        var creditScoreResult = creditScoreService.calculateAndSaveCreditScore(userId);
        int creditScore = creditScoreResult.getCreditScore().getScore();
        String creditRating = creditScoreResult.getRatingCategory();


        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        List<String> monthlyLabels = new ArrayList<>();
        List<BigDecimal> monthlyDeposits = new ArrayList<>();
        List<BigDecimal> monthlyWithdrawals = new ArrayList<>();
        List<BigDecimal> monthlyTransfers = new ArrayList<>();

        
        for (int i = 5; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            String label = month.format(fmt);
            monthlyLabels.add(label);

            int finalI = i;
            LocalDateTime mStart = LocalDate.now().minusMonths(i).withDayOfMonth(1).atStartOfDay();
            LocalDateTime mEnd = mStart.plusMonths(1).minusSeconds(1);

           
            List<Transaction> allTxns = transactionRepository.findAllByUserId(userId);

            BigDecimal dep = allTxns.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()) && "DEPOSIT".equals(t.getType())
                            && !t.getCreatedAt().isBefore(mStart) && !t.getCreatedAt().isAfter(mEnd))
                    .map(t -> t.getAmount().abs())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal with = allTxns.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()) && "WITHDRAWAL".equals(t.getType())
                            && !t.getCreatedAt().isBefore(mStart) && !t.getCreatedAt().isAfter(mEnd))
                    .map(t -> t.getAmount().abs())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal trf = allTxns.stream()
                    .filter(t -> "COMPLETED".equals(t.getStatus()) && "TRANSFER".equals(t.getType())
                            && !t.getCreatedAt().isBefore(mStart) && !t.getCreatedAt().isAfter(mEnd))
                    .map(t -> t.getAmount().abs())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            monthlyDeposits.add(dep);
            monthlyWithdrawals.add(with);
            monthlyTransfers.add(trf);
        }


        List<TransactionDTO> txnDTOs = txns.stream().map(t -> TransactionDTO.builder()
                .id(t.getId())
                .transactionReference(t.getTransactionReference())
                .sourceAccountNumber(t.getSourceAccount() != null ? t.getSourceAccount().getAccountNumber() : null)
                .destinationAccountNumber(t.getDestinationAccount() != null ? t.getDestinationAccount().getAccountNumber() : null)
                .amount(t.getAmount())
                .type(t.getType())
                .status(t.getStatus())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build()).collect(Collectors.toList());

        return FinancialReportDTO.builder()
                .period(period.toUpperCase())
                .totalDeposits(totalDeposits)
                .totalWithdrawals(totalWithdrawals)
                .totalTransfers(totalTransfers)
                .totalLoanAmount(totalLoanAmount)
                .totalEmiPaid(totalEmiPaid)
                .currentBalance(currentBalance)
                .creditScore(creditScore)
                .creditScoreRating(creditRating)
                .depositCount(depositCount)
                .withdrawalCount(withdrawalCount)
                .transferCount(transferCount)
                .emiPaymentCount(emiCount)
                .loanCount(loans.size())
                .monthlyLabels(monthlyLabels)
                .monthlyDepositAmounts(monthlyDeposits)
                .monthlyWithdrawalAmounts(monthlyWithdrawals)
                .monthlyTransferAmounts(monthlyTransfers)
                .transactions(txnDTOs)
                .build();
    }
}
