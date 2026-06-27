package com.banking.digital.entity;
import com.banking.digital.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FraudLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String eventType; 

    @Column(nullable = false, length = 2000)
    private String description;

    /** LOW | MEDIUM | HIGH */
    @Column(nullable = false)
    @Builder.Default
    private String riskLevel = "LOW";

    /** Whether an admin has marked this alert as resolved */
    @Column(nullable = false)
    @Builder.Default
    private Boolean resolved = false;

    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (riskLevel == null) riskLevel = "LOW";
        if (resolved == null) resolved = false;
    }
}



