package com.banking.digital.service.impl;
import com.banking.digital.dto.AccountDTO;
import com.banking.digital.entity.Account;
import com.banking.digital.entity.User;
import com.banking.digital.repository.AccountRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.repository.KycDocumentRepository;
import com.banking.digital.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final KycDocumentRepository kycDocumentRepository;

    @Override
    @Transactional
    public AccountDTO createAccount(Long userId, String accountType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean kycVerified = kycDocumentRepository.findByUserId(userId)
                .stream().anyMatch(doc -> "VERIFIED".equals(doc.getStatus()));
                
        if (!kycVerified) {
            throw new RuntimeException("KYC verification is required to open an account");
        }

        String accountNumber = generateAccountNumber();
        
        Account account = Account.builder()
                .accountNumber(accountNumber)
                .user(user)
                .balance(BigDecimal.ZERO)
                .accountType(accountType)
                .status("ACTIVE")
                .build();
                
        accountRepository.save(account);
        return mapToDTO(account);
    }

    @Override
    public AccountDTO getAccountByNumber(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        return mapToDTO(account);
    }

    @Override
    public List<AccountDTO> getUserAccounts(Long userId) {
        return accountRepository.findByUserId(userId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateBalance(String accountNumber, BigDecimal amount) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
    }

    private String generateAccountNumber() {
        return String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 10000000000L);
    }

    private AccountDTO mapToDTO(Account account) {
        return AccountDTO.builder()
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .accountType(account.getAccountType())
                .status(account.getStatus())
                .build();
    }
}
