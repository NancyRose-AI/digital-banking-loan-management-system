import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Group as GroupIcon,
  AccountBalanceWallet as WalletIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AssignmentInd as KycIcon,
  Inbox as EmptyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import { inrFmt } from '../utils/currency';

const AdminDashboard = () => {
  const [pendingKycs, setPendingKycs] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchData = async () => {
    try {
      const [kycRes, dashboardRes] = await Promise.all([
        api.get('/kyc/pending'),
        api.get('/dashboard/admin')
      ]);
      setPendingKycs(kycRes.data);
      setDashboardData(dashboardRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApproveKyc = async (documentId) => {
    try {
      await api.put(`/kyc/${documentId}/approve`);
      toast.success('KYC document approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve document');
    }
  };

  const handleRejectKyc = async (documentId) => {
    try {
      await api.put(`/kyc/${documentId}/reject`);
      toast.success('KYC document rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject document');
    }
  };

  return (
    <Grid container spacing={3} className="animate-slide-up">
      {/* Page Header */}
      <Grid item xs={12} sx={{ mb: 1 }}>
        <Typography variant="h4" fontWeight="800" color="primary">
          Admin Control Center
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight="500">
          Monitor system metrics and verify customer credentials
        </Typography>
      </Grid>

      {/* KPI Cards */}
      <Grid item xs={12} md={6}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4,
            borderLeft: '4px solid #635bff'
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(99, 91, 255, 0.1)', color: 'secondary.main', width: 56, height: 56, mr: 2.5 }}>
            <GroupIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">Total Verified Customers</Typography>
            <Typography variant="h4" fontWeight="900" color="primary" sx={{ mt: 0.5, letterSpacing: '-1px' }}>
              {dashboardData ? dashboardData.totalCustomers : '...'}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 4,
            borderLeft: '4px solid #10b981'
          }}
        >
          <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: 'success.main', width: 56, height: 56, mr: 2.5 }}>
            <WalletIcon sx={{ fontSize: 30 }} />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">Total System Revenue</Typography>
            <Typography variant="h4" fontWeight="900" color="primary" sx={{ mt: 0.5, letterSpacing: '-1px' }}>
              {dashboardData ? inrFmt(dashboardData.totalRevenue) : '...'}
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* Pending KYC Approvals Section */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <KycIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight="800" color="primary">Pending KYC Approvals</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="500">Verify client credentials to grant system access</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document ID</TableCell>
                  <TableCell>Client ID</TableCell>
                  <TableCell>Document Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingKycs.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{doc.id}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{doc.user?.id || 'Unknown'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Chip label={doc.documentType} size="small" variant="outlined" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color="warning"
                        size="small"
                        sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApproveKyc(doc.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleRejectKyc(doc.id)}
                          sx={{ borderRadius: 2 }}
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingKycs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'grey.100', color: 'text.disabled', width: 64, height: 64 }}>
                          <EmptyIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="700" color="text.secondary">
                            All Caught Up!
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            No pending KYC validation requests.
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AdminDashboard;
