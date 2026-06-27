import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  List, ListItem, Divider, InputAdornment, Avatar, Chip
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  AccountBalance as BankIcon,
  Description as DescIcon,
  History as HistoryIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { inrFmt } from '../utils/currency';

const Transfers = () => {
  const [transferData, setTransferData] = useState({
    sourceAccountNumber: '',
    destinationAccountNumber: '',
    amount: '',
    description: ''
  });
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTransfers = async () => {
    if (user?.userId) {
      try {
        const response = await api.get(`/transactions/user/${user.userId}`);
        setRecentTransfers(response.data.data);
      } catch (err) {
        console.error('Failed to fetch transfers', err);
      }
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [user]);

  const handleChange = (e) => {
    setTransferData({ ...transferData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transactions/transfer', transferData);
      toast.success('Funds transferred successfully!');
      setTransferData({ sourceAccountNumber: '', destinationAccountNumber: '', amount: '', description: '' });
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed. Please check your balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mb: 0.5, letterSpacing: '-1px' }}>
          Fund Transfers
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Move your money instantly and securely
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Form Container */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 4, height: '100%', borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 48, height: 48 }}>
                <SendIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="800" color="text.primary">
                New Transfer
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Source Account</Typography>
                <TextField
                  fullWidth
                  required
                  name="sourceAccountNumber"
                  value={transferData.sourceAccountNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g. 9876543210"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BankIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Destination Account</Typography>
                <TextField
                  fullWidth
                  required
                  name="destinationAccountNumber"
                  value={transferData.destinationAccountNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g. 1234567890"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BankIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Amount (₹)</Typography>
                <TextField
                  fullWidth
                  required
                  name="amount"
                  type="number"
                  value={transferData.amount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '1.25rem' }}>₹</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Remarks (Optional)</Typography>
                <TextField
                  fullWidth
                  name="description"
                  value={transferData.description}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g. Rent Payment"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading || !transferData.sourceAccountNumber || !transferData.destinationAccountNumber || !transferData.amount}
                sx={{ py: 2, fontSize: '1rem' }}
              >
                {loading ? 'Processing Transfer...' : 'Send Money Securely'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent timeline container */}
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: '#f8fafc', color: '#0f172a', width: 48, height: 48, border: '1px solid #e2e8f0' }}>
                <HistoryIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="800" color="text.primary">
                Transfer History
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 540, pr: 1 }}>
              {recentTransfers.length > 0 ? (
                <List disablePadding>
                  {recentTransfers.map((tx, index) => {
                    const isDebit = tx.type === 'TRANSFER' || tx.type === 'WITHDRAWAL';
                    return (
                      <Box key={tx.id}>
                        <ListItem sx={{ py: 3, px: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', gap: 2.5 }}>
                            <Avatar sx={{ width: 44, height: 44, bgcolor: isDebit ? '#fee2e2' : '#d1fae5', color: isDebit ? '#ef4444' : '#10b981' }}>
                              <SwapIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="700" color="text.primary" sx={{ mb: 0.25 }}>
                                {tx.type === 'TRANSFER' ? `To ${tx.destinationAccountNumber || 'Account'}` : tx.type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 0.5 }}>
                                {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </Typography>
                              {tx.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-block', bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                  {tx.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight="800" color={isDebit ? '#0f172a' : '#10b981'} sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
                              {isDebit ? '-' : '+'}{inrFmt(tx.amount)}
                            </Typography>
                            <Chip 
                              label={tx.status} 
                              size="small" 
                              sx={{ 
                                fontWeight: 700, fontSize: '0.65rem', borderRadius: 1.5, height: 22,
                                bgcolor: tx.status === 'COMPLETED' ? '#d1fae5' : '#fef3c7',
                                color: tx.status === 'COMPLETED' ? '#059669' : '#d97706',
                              }} 
                            />
                          </Box>
                        </ListItem>
                        {index < recentTransfers.length - 1 && <Divider sx={{ borderColor: '#f1f5f9' }} />}
                      </Box>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <HistoryIcon sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
                  <Typography color="text.primary" fontWeight="800" variant="h6" mb={1}>No transfers yet</Typography>
                  <Typography color="text.secondary" variant="body1" fontWeight="500">Your recent transfer history will appear here once you make a transaction.</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Transfers;
