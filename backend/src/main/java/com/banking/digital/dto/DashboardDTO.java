package com.banking.digital.dto;
import com.banking.digital.dto.TransactionDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private BigDecimal totalBalance;
    private int activeLoans;
    private int recentTransactionsCount;
    private List<TransactionDTO> recentTransactions;
    private BigDecimal savingsBalance;
    private BigDecimal checkingBalance;
    private BigDecimal loanEmiBalance;
    private int creditScore;
    private String creditScoreRating;
    private List<String> creditScoreFactors;
    
    
    private BigDecimal activeLoanAmount;
    private BigDecimal totalPendingEmiAmount;
    private BigDecimal availableFunds;
    
    
    private BigDecimal upcomingEmiAmount;
    private LocalDate upcomingEmiDueDate;
    private Long upcomingEmiLoanId;
    private Integer upcomingEmiInstallmentNumber;
    private int upcomingEmiCount;
    private String kycStatus;
    
    
    private List<String> activityLabels;
    private List<Integer> activityTodayData;
    private List<Integer> activityYesterdayData;
}




