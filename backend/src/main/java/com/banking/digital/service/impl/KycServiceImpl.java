package com.banking.digital.service.impl;
import com.banking.digital.entity.KycDocument;
import com.banking.digital.entity.User;
import com.banking.digital.repository.KycDocumentRepository;
import com.banking.digital.repository.UserRepository;
import com.banking.digital.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.util.Map;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;

@Service
@RequiredArgsConstructor
public class KycServiceImpl implements KycService {

    private final KycDocumentRepository kycDocumentRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;


    private static final String UPLOAD_DIR = "uploads/kyc/";

    
    private static final java.util.Set<String> SUPPORTED_TYPES = java.util.Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif",
            "image/bmp", "image/tiff", "image/webp"
    );

    @Override
    public KycDocument uploadDocument(Long userId, MultipartFile file, String documentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

       
        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        boolean isSupportedType = (contentType != null && SUPPORTED_TYPES.contains(contentType.toLowerCase()))
                || originalName.endsWith(".jpg") || originalName.endsWith(".jpeg")
                || originalName.endsWith(".png") || originalName.endsWith(".bmp")
                || originalName.endsWith(".gif") || originalName.endsWith(".tiff")
                || originalName.endsWith(".tif") || originalName.endsWith(".webp");

        if (!isSupportedType) {
            throw new RuntimeException(
                "Unsupported file format: '" + contentType + "'. " +
                "Please upload a JPG, PNG, TIFF, BMP, or WebP image for OCR processing. " +
                "AVIF and PDF formats are not supported."
            );
        }

        File ocrTargetFile = null;
        File tempPngFile = null;
        try {
            
            
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", "kyc"));
            String fileUrl = (String) uploadResult.get("secure_url");

            
            ocrTargetFile = File.createTempFile("kyc_ocr_", "_" + file.getOriginalFilename());
            Files.write(ocrTargetFile.toPath(), file.getBytes());

            
            

            try {
                BufferedImage bufferedImage = ImageIO.read(ocrTargetFile);

                if (bufferedImage != null) {
                    tempPngFile = File.createTempFile("kyc_ocr_", ".png");
                    ImageIO.write(bufferedImage, "PNG", tempPngFile);
                    ocrTargetFile = tempPngFile;
                } else {
                    
                    throw new RuntimeException(
                        "Could not decode the uploaded image. Please upload a JPG, PNG, TIFF, or BMP file."
                    );
                }
            } catch (IOException imgEx) {
                throw new RuntimeException("Failed to read the uploaded image: " + imgEx.getMessage(), imgEx);
            }

            
            String extractedText = "";
            try {
                Tesseract tesseract = new Tesseract();
                
                String tessDataPath = System.getenv("TESSDATA_PREFIX");
                if (tessDataPath == null || tessDataPath.isBlank()) {
                    tessDataPath = "C:/Program Files/Tesseract-OCR/tessdata"; 
                }
                tesseract.setDatapath(tessDataPath);

                extractedText = tesseract.doOCR(ocrTargetFile);
                System.out.println("[KYC OCR] Extracted text for " + documentType + ": " + extractedText);
            } catch (TesseractException e) {
                System.err.println("[KYC OCR] Tesseract failed for file: " + file.getOriginalFilename() + " — " + e.getMessage());
                
            } finally {
                
                if (tempPngFile != null && tempPngFile.exists()) {
                    tempPngFile.delete();
                }
            }

            String status = "REJECTED";
            String documentNumber = "N/A";

            // Clean extracted text for pattern matching
            String cleaned = extractedText.replaceAll("[\\s\\-]", "").toUpperCase();

            // Try to detect document type and extract number
            Pattern panPattern = Pattern.compile("[A-Z]{5}[0-9]{4}[A-Z]");
            Matcher panMatcher = panPattern.matcher(cleaned);
            if (panMatcher.find()) {
                documentNumber = panMatcher.group();
                documentType = "PAN";
                status = "VERIFIED";
                System.out.println("[KYC OCR] Detected PAN: " + documentNumber);
            } else {
                Pattern aadhaarPattern = Pattern.compile("\\d{12}");
                Matcher aadhaarMatcher = aadhaarPattern.matcher(cleaned);
                if (aadhaarMatcher.find()) {
                    documentNumber = aadhaarMatcher.group();
                    documentType = "AADHAAR";
                    status = "VERIFIED";
                    System.out.println("[KYC OCR] Detected Aadhaar: " + documentNumber);
                } else {
                    Pattern passportPattern = Pattern.compile("[A-Z][0-9]{7}");
                    Matcher passportMatcher = passportPattern.matcher(cleaned);
                    if (passportMatcher.find()) {
                        documentNumber = passportMatcher.group();
                        documentType = "PASSPORT";
                        status = "VERIFIED";
                        System.out.println("[KYC OCR] Detected Passport: " + documentNumber);
                    } else {
                        Pattern dlPattern = Pattern.compile("[A-Z]{2}[0-9]{2}[A-Z0-9]{11}");
                        Matcher dlMatcher = dlPattern.matcher(cleaned);
                        if (dlMatcher.find()) {
                            documentNumber = dlMatcher.group();
                            documentType = "DRIVING_LICENSE";
                            status = "VERIFIED";
                            System.out.println("[KYC OCR] Detected Driving Licence: " + documentNumber);
                        } else {
                            // No valid pattern found
                            status = "REJECTED";
                            System.out.println("[KYC OCR] No valid document patterns detected; rejecting.");
                        }
                    }
                }
            }

            KycDocument doc = KycDocument.builder()
                    .user(user)
                    .documentType(documentType)
                    .documentNumber(documentNumber)
                    .fileUrl(fileUrl)
                    .status(status)
                    .build();

            return kycDocumentRepository.save(doc);

        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + e.getMessage(), e);
        } finally {
            
            if (ocrTargetFile != null && ocrTargetFile.exists()) {
                ocrTargetFile.delete();
            }
            if (tempPngFile != null && tempPngFile.exists()) {
                tempPngFile.delete();
            }
        }
    }

    @Override
    public List<KycDocument> getDocumentsByUser(Long userId) {
        return kycDocumentRepository.findByUserId(userId);
    }

    @Override
    public List<KycDocument> getPendingDocuments() {
        return kycDocumentRepository.findByStatus("PENDING");
    }

    @Override
    public void approveDocument(Long documentId) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus("VERIFIED");
        kycDocumentRepository.save(doc);
    }

    @Override
    public void rejectDocument(Long documentId) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        doc.setStatus("REJECTED");
        kycDocumentRepository.save(doc);
    }
}
