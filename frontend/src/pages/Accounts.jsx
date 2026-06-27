import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, IconButton, Tooltip, Avatar, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  ArrowUpward as DepositIcon,
  ReceiptLong as StatementIcon,
  AccountBalanceWallet as WalletIcon,
  MoreVert as MoreVertIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { inrFmt } from '../utils/currency';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccount, setDepositAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  
  const fetchAccounts = async () => {
    if (user?.userId) {
      try {
        const response = await api.get(`/accounts/user/${user.userId}`);
        setAccounts(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch accounts');
      }
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const handleOpenAccount = async () => {
    try {
      await api.post(`/accounts/user/${user.userId}?accountType=SAVINGS`);
      toast.success('Account created successfully');
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handleViewDetails = (account) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAccount(null);
  };

  const handleOpenDeposit = (account) => {
    setDepositAccount(account);
    setDepositOpen(true);
  };

  const handleCloseDeposit = () => {
    setDepositOpen(false);
    setDepositAmount('');
    setDepositAccount(null);
    setLoading(false);
  };

  const handlePayDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    setLoading(true);
    try {
      const orderResponse = await api.post('/transactions/deposit/order', {
        userId: user.userId,
        accountNumber: depositAccount.accountNumber,
        amount: parseFloat(depositAmount)
      });

      const { orderId, amount, currency, keyId } = orderResponse.data.data;

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'DigiBank Premium',
        description: `Fund Account ${depositAccount.accountNumber}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await api.post('/transactions/deposit/verify', {
              userId: user.userId,
              accountNumber: depositAccount.accountNumber,
              amount: parseFloat(depositAmount),
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            toast.success('Funds added successfully!');
            handleCloseDeposit();
            fetchAccounts();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: user.username,
          email: user.email || `${user.username}@example.com`
        },
        theme: {
          color: '#0f172a'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response.error.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate deposit');
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard', { icon: '📋' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
            My Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="500">
            Manage your finances across all your active accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAccount}
        >
          Open New Account
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {accounts.map((row) => (
          <Grid item xs={12} md={6} lg={4} key={row.accountNumber}>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 24px -6px rgba(148, 163, 184, 0.15)',
                  borderColor: '#e2e8f0',
                },
              }}
            >
              <Box sx={{ p: 3, pb: 2, flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 42, height: 42, borderRadius: 2,
                        bgcolor: '#e0e7ff', color: '#4338ca', flexShrink: 0,
                      }}
                    >
                      <WalletIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight="700"
                        color="text.primary"
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}
                      >
                        {row.accountType === 'SAVINGS' ? 'Savings Account' : 'Current Account'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DotIcon sx={{ fontSize: 10, color: row.status === 'ACTIVE' ? '#10b981' : '#ef4444' }} />
                        {row.status}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small" sx={{ color: '#94a3b8' }}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Balance */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Available Balance
                  </Typography>
                  <Tooltip title={inrFmt(row.balance)} placement="top">
                    <Typography
                      variant="h5"
                      fontWeight="700"
                      color="text.primary"
                      sx={{ letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {inrFmt(row.balance)}
                    </Typography>
                  </Tooltip>
                </Box>

                {/* Account Number */}
                <Box
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 1.5, py: 1, borderRadius: 2.5,
                    bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="600"
                    color="text.primary"
                    sx={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
                  >
                    {row.accountNumber.replace(/(.{4})/g, '$1 ').trim()}
                  </Typography>
                  <Tooltip title="Copy Account Number">
                    <IconButton size="small" onClick={() => copyToClipboard(row.accountNumber)} sx={{ color: '#64748b' }}>
                      <CopyIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Action bar */}
              <Box
                sx={{
                  display: 'flex',
                  borderTop: '1px solid #f1f5f9',
                  bgcolor: '#f8fafc',
                }}
              >
                <Button
                  fullWidth
                  onClick={() => handleViewDetails(row)}
                  startIcon={<StatementIcon />}
                  sx={{
                    borderRadius: 0, py: 1.5,
                    color: '#475569', fontWeight: 600, fontSize: '0.82rem',
                    borderRight: '1px solid #f1f5f9',
                    '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' },
                  }}
                >
                  Statement
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleOpenDeposit(row)}
                  startIcon={<DepositIcon />}
                  sx={{
                    borderRadius: 0, py: 1.5,
                    color: '#4338ca', fontWeight: 700, fontSize: '0.82rem',
                    '&:hover': { bgcolor: '#eff6ff', color: '#2563eb' },
                  }}
                >
                  Add Funds
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}

        {accounts.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#ffffff', border: '1px dashed #cbd5e1' }}>
              <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: '#f1f5f9', color: '#94a3b8', mx: 'auto', mb: 3 }}>
                <WalletIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" color="text.primary" fontWeight="700" mb={1}>
                No Accounts Yet
              </Typography>
              <Typography color="text.secondary" mb={4} variant="body1">
                Open a premium savings account to start your modern banking journey.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenAccount}
                startIcon={<AddIcon />}
                size="large"
              >
                Open Savings Account
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Account Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
          Account Insight
        </DialogTitle>
        <DialogContent sx={{ py: 4, px: { xs: 2, sm: 4 } }}>
          {selectedAccount && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available Balance
                </Typography>
                <Typography variant="h3" fontWeight="800" color="text.primary" sx={{ mt: 1 }}>
                  {inrFmt(selectedAccount.balance)}
                </Typography>
              </Box>
              
              <Divider sx={{ borderStyle: 'dashed' }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight="500">Account Number</Typography>
                <Typography variant="body1" fontWeight="600" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                  {selectedAccount.accountNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight="500">Account Type</Typography>
                <Typography variant="body2" fontWeight="700" color="text.primary">{selectedAccount.accountType}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight="500">Status</Typography>
                <Chip
                  label={selectedAccount.status}
                  size="small"
                  sx={{
                    fontWeight: 700, fontSize: '0.65rem',
                    bgcolor: selectedAccount.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2',
                    color: selectedAccount.status === 'ACTIVE' ? '#059669' : '#dc2626',
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Button onClick={handleCloseDialog} color="primary" fullWidth variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onClose={handleCloseDeposit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
          Add Funds
        </DialogTitle>
        <DialogContent sx={{ py: 4, px: { xs: 2, sm: 4 } }}>
          {depositAccount && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#2563eb' }}><WalletIcon /></Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Depositing to
                  </Typography>
                  <Typography variant="body1" color="text.primary" fontWeight="700" sx={{ fontFamily: 'monospace', mt: 0.25 }}>
                    {depositAccount.accountNumber}
                  </Typography>
                </Box>
              </Paper>
              
              <Box>
                <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>
                  Enter Amount
                </Typography>
                <TextField
                  autoFocus
                  placeholder="0.00"
                  type="number"
                  fullWidth
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={loading}
                  inputProps={{ min: "1", step: "0.01" }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: '700', fontSize: '1.25rem' }}>₹</Typography>,
                    sx: { fontSize: '1.5rem', fontWeight: '700', color: 'text.primary', py: 1 }
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', gap: 2 }}>
          <Button onClick={handleCloseDeposit} color="inherit" disabled={loading} sx={{ flex: 1, fontWeight: 600 }}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayDeposit} 
            color="primary" 
            variant="contained" 
            disabled={loading || !depositAmount}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ flex: 2, py: 1.5 }}
          >
            {loading ? 'Processing...' : 'Proceed to Pay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Accounts;
