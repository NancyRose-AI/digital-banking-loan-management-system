import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const KycList = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    if (user?.userId) {
      try {
        const response = await api.get(`/kyc/list/${user.userId}`);
        setDocuments(response.data);
      } catch (error) {
        console.error('Failed to fetch KYC documents', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user, refreshTrigger]);

  if (loading) {
    return <Typography sx={{ p: 2 }} color="text.secondary">Loading verification history...</Typography>;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3.5, borderRadius: 4 }}>
        <Typography variant="subtitle1" fontWeight="800" color="primary" sx={{ mb: 2 }}>
          Verification Document History
        </Typography>
        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Document Type</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Uploaded Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length > 0 ? (
                documents.map((doc) => {
                  const fileName = doc.fileUrl ? doc.fileUrl.split('/').pop() : 'Unknown';
                  const fileInputRef = useRef(null);
                  const handleReuploadClick = () => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  };
                  const handleReuploadFile = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('userId', user.userId);
                    formData.append('file', file);
                    formData.append('documentType', doc.documentType);
                    try {
                      await api.post('/kyc/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                      // Refresh documents after successful re-upload
                      fetchDocuments();
                    } catch (error) {
                      console.error('Reupload failed', error);
                    }
                  };
                  return (
                    <TableRow key={doc.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{doc.documentType}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.825rem' }}>{fileName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.825rem' }}>
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('en-IN') : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={doc.status} 
                          size="small" 
                          color={doc.status === 'VERIFIED' ? 'success' : doc.status === 'REJECTED' ? 'error' : 'warning'} 
                          sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                        />
                        {doc.status === 'REJECTED' && (
                          <>
                            <Button variant="outlined" size="small" onClick={handleReuploadClick}>Re-upload</Button>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              ref={fileInputRef}
                              onChange={handleReuploadFile}
                            />
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No verification documents uploaded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default KycList;
