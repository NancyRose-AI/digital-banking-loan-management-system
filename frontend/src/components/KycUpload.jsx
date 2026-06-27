import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Snackbar,
  Alert,
  Typography,
  Chip,
  Paper
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'webp', 'gif'];
const ACCEPTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/bmp', 'image/tiff',
  'image/webp', 'image/gif',
];

const KycUpload = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState('success');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const isValidExt = ACCEPTED_EXTENSIONS.includes(ext);
    const isValidMime = ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase());

    if (!isValidExt || !isValidMime) {
      setMsg(
        `Unsupported file format (.${ext}). Please upload a JPG, PNG, TIFF, BMP, WebP, or GIF image. ` +
        `AVIF and PDF formats cannot be processed by OCR.`
      );
      setSeverity('error');
      setOpen(true);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (!selectedDocumentType) {
      setMsg('Please select a document type');
      setSeverity('warning');
      setOpen(true);
      return;
    }
    if (!selectedFile) {
      setMsg('Please select a file');
      setSeverity('warning');
      setOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('userId', user.userId);
    formData.append('file', selectedFile);
    formData.append('documentType', selectedDocumentType);

    setUploading(true);
    try {
      await api.post('/kyc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('Upload successful! Your document is being processed.');
      setSeverity('success');
      setSelectedFile(null);
      setSelectedDocumentType('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setMsg(error.response?.data?.message || 'Upload failed. Please try again.');
      setSeverity('error');
    } finally {
      setUploading(false);
      setOpen(true);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
      <FormControl fullWidth required error={!selectedDocumentType} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}>
        <InputLabel id="doc-type-label">Document Type</InputLabel>
        <Select
          labelId="doc-type-label"
          value={selectedDocumentType}
          label="Document Type"
          onChange={(e) => setSelectedDocumentType(e.target.value)}
        >
          <MenuItem value="AADHAAR">Aadhaar Card</MenuItem>
          <MenuItem value="PAN">PAN Card</MenuItem>
          <MenuItem value="PASSPORT">Passport</MenuItem>
          <MenuItem value="DRIVING_LICENSE">Driving License</MenuItem>
        </Select>
      </FormControl>

      <input
        accept="image/jpeg,image/png,image/bmp,image/tiff,image/webp,image/gif,.jpg,.jpeg,.png,.bmp,.tiff,.tif,.webp,.gif"
        style={{ display: 'none' }}
        id="kyc-file-input"
        type="file"
        onChange={handleFileChange}
      />
      
      <label htmlFor="kyc-file-input" style={{ width: '100%' }}>
        <Paper
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 3.5,
            border: '2px dashed',
            borderColor: dragOver ? 'secondary.main' : 'rgba(99, 91, 255, 0.25)',
            bgcolor: dragOver ? 'rgba(99, 91, 255, 0.08)' : 'rgba(99, 91, 255, 0.02)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'secondary.main',
              bgcolor: 'rgba(99, 91, 255, 0.06)',
            }
          }}
        >
          <UploadIcon sx={{ fontSize: 44, color: 'secondary.main', mb: 1, opacity: 0.85 }} />
          <Typography variant="body2" fontWeight="700" color="text.primary">
            Drag & Drop your document here
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
            or click to browse local files
          </Typography>
        </Paper>
      </label>

      {selectedFile && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={selectedFile.name}
            onDelete={() => setSelectedFile(null)}
            color="secondary"
            variant="filled"
            size="small"
            sx={{ maxWidth: '100%', overflow: 'hidden', fontWeight: 'bold' }}
          />
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Supported formats: JPG, PNG, TIFF, BMP, WebP, GIF. Max size: 10MB.
      </Typography>

      <Button
        variant="contained"
        color="secondary"
        fullWidth
        onClick={handleUpload}
        disabled={!selectedDocumentType || !selectedFile || uploading}
        sx={{ py: 1.25, borderRadius: 2.5, fontWeight: 'bold' }}
      >
        {uploading ? 'Processing OCR & Uploading...' : 'Submit Verification Document'}
      </Button>

      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert severity={severity} sx={{ width: '100%', borderRadius: 2.5 }}>
          {msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KycUpload;
