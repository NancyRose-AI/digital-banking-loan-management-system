package com.banking.digital.controller;
import com.banking.digital.entity.KycDocument;
import com.banking.digital.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
public class KycController {

    private final KycService kycService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadKyc(
            @RequestParam("userId") Long userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType) {
        
        KycDocument doc = kycService.uploadDocument(userId, file, documentType);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", doc.getId());
        response.put("message", "Upload successful");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<List<KycDocument>> listUserDocuments(@PathVariable Long userId) {
        return ResponseEntity.ok(kycService.getDocumentsByUser(userId));
    }

    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<KycDocument>> getPendingDocuments() {
        return ResponseEntity.ok(kycService.getPendingDocuments());
    }

    @PutMapping("/{documentId}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> approveDocument(@PathVariable Long documentId) {
        kycService.approveDocument(documentId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Document approved successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{documentId}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> rejectDocument(@PathVariable Long documentId) {
        kycService.rejectDocument(documentId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Document rejected successfully");
        return ResponseEntity.ok(response);
    }
}
