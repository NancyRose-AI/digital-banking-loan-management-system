import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Accordion, AccordionSummary, AccordionDetails,
  Alert, CircularProgress, Divider, Tooltip, Avatar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { inrFmt } from '../utils/currency';

const statusColor = (s) => {
  switch (s) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'PAID':
      return { bg: '#d1fae5', color: '#059669' };
    case 'PENDING':
      return { bg: '#fef3c7', color: '#d97706' };
    case 'OVERDUE':
    case 'REJECTED':
      return { bg: '#fee2e2', color: '#dc2626' };
    default:
      return { bg: '#f1f5f9', color: '#475569' };
  }
};

const Loans = () => {
  const { user } = useAuth();
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [loanData, setLoanData] = useState({ principalAmount: '', tenureMonths: '' });

  const activeLoans  = loans.filter(l => l.status === 'ACTIVE');
  const pendingLoans = loans.filter(l => l.status === 'PENDING');
  const totalEmi     = activeLoans.reduce((sum, l) => {
    const nextEmi = (l.emiSchedules || []).find(e => e.status === 'PENDING');
    return sum + (nextEmi ? parseFloat(nextEmi.emiAmount) : 0);
  }, 0);

  const fetchLoans = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const response = await api.get(`/loans/user/${user.userId}`);
      setLoans(response.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch loans.');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const principal = parseFloat(loanData.principalAmount);
    const tenure    = parseInt(loanData.tenureMonths, 10);
    if (principal < 1000) { toast.error('Minimum loan amount is ₹1,000'); return; }
    if (tenure < 6)        { toast.error('Minimum tenure is 6 months'); return; }

    setSubmitting(true);
    try {
      await api.post(`/loans/apply/${user.userId}`, { principalAmount: principal, tenureMonths: tenure });
      toast.success('Loan application submitted successfully!');
      setLoanData({ principalAmount: '', tenureMonths: '' });
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelfApprove = async (loanId) => {
    try {
      await api.put(`/loans/${loanId}/self-approve`);
      toast.success('Loan approved! EMI schedule generated.');
      fetchLoans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handlePayEmi = async (loanId, installmentNumber) => {
    try {
      const orderResponse = await api.post(`/loans/${loanId}/emi/${installmentNumber}/order`);
      const orderData = orderResponse.data.data;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DigiBank Premium',
        description: `EMI Payment #${installmentNumber}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await api.put(`/loans/${loanId}/emi/${installmentNumber}/pay`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success(`EMI paid successfully!`);
            fetchLoans();
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || ''
        },
        theme: { color: '#0f172a' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mb: 0.5, letterSpacing: '-1px' }}>
          Loans & EMI
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Premium financing options with transparent repayment tracking
        </Typography>
      </Box>

      {/* Summary Cards */}
      {loans.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5, height: '100%' }}>
              <Avatar variant="rounded" sx={{ bgcolor: '#f1f5f9', color: '#0f172a', width: 56, height: 56 }}>
                <AccountBalanceIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Loans</Typography>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mt: 0.5 }}>{loans.length}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5, height: '100%' }}>
              <Avatar variant="rounded" sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 56, height: 56 }}>
                <PendingIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active / Pending</Typography>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mt: 0.5 }}>{activeLoans.length} <Typography component="span" variant="h5" color="text.secondary">/ {pendingLoans.length}</Typography></Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 2.5, height: '100%' }}>
              <Avatar variant="rounded" sx={{ bgcolor: '#ecfdf5', color: '#10b981', width: 56, height: 56 }}>
                <ScheduleIcon fontSize="medium" />
              </Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Next EMI Liability</Typography>
                <Typography variant="h4" fontWeight="800" color="text.primary" sx={{ mt: 0.5, wordBreak: 'break-word', letterSpacing: '-1px' }}>{inrFmt(totalEmi)}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Apply Form */}
      <Paper elevation={1} sx={{ p: 4, mb: 6, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight="800" color="text.primary" sx={{ mb: 3 }}>
          Request Premium Financing
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Principal Amount</Typography>
              <TextField
                fullWidth
                placeholder="e.g. 100000"
                type="number"
                value={loanData.principalAmount}
                onChange={(e) => setLoanData({ ...loanData, principalAmount: e.target.value })}
                inputProps={{ min: 1000, step: 500 }}
                helperText="Minimum application ₹1,000"
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: '700' }}>₹</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1.5 }}>Tenure (Months)</Typography>
              <TextField
                fullWidth
                placeholder="e.g. 12"
                type="number"
                value={loanData.tenureMonths}
                onChange={(e) => setLoanData({ ...loanData, tenureMonths: e.target.value })}
                inputProps={{ min: 6, max: 360, step: 6 }}
                helperText="Minimum period 6 months"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: '0.05em' }}>
                    INTEREST RATE
                  </Typography>
                  <Typography variant="body2" fontWeight="800" color="#10b981">
                    10.5% p.a. Fixed
                  </Typography>
                </Box>
                
                {loanData.principalAmount && loanData.tenureMonths && (
                  <>
                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: '0.05em' }}>
                        ESTIMATED EMI
                      </Typography>
                      <Typography variant="h5" color="#0f172a" fontWeight="800" sx={{ letterSpacing: '-0.5px' }}>
                        {inrFmt(calcEmi(parseFloat(loanData.principalAmount), parseInt(loanData.tenureMonths)))}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={submitting || !loanData.principalAmount || !loanData.tenureMonths}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                sx={{ px: 4, py: 1.5 }}
              >
                {submitting ? 'Processing...' : 'Submit Application'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Loans List */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight="800" color="text.primary">
          Loan Portfolio
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={6}><CircularProgress size={40} /></Box>
      ) : loans.length === 0 ? (
        <Paper elevation={1} sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
          <Typography variant="h6" color="text.primary" fontWeight="700" mb={1}>No Active Loans</Typography>
          <Typography color="text.secondary">Apply for a premium loan using the section above to see your portfolio here.</Typography>
        </Paper>
      ) : (
        loans.map((loan) => {
          const sColor = statusColor(loan.status);
          return (
            <Accordion
              key={loan.id}
              expanded={expandedLoan === loan.id}
              onChange={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
              elevation={1}
              sx={{
                mb: 2.5,
                borderRadius: 2,
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0f172a' }} />} sx={{ p: 3 }}>
                <Grid container alignItems="center" spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>LOAN ID</Typography>
                    <Typography variant="body1" fontWeight="800" color="text.primary" sx={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>#{loan.id}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>PRINCIPAL</Typography>
                    <Typography variant="body1" fontWeight="800" color="text.primary">{inrFmt(loan.principalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>TENURE</Typography>
                    <Typography variant="body1" fontWeight="700" color="text.primary">{loan.tenureMonths} Mos</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ display: 'block', mb: 0.5, letterSpacing: '0.05em' }}>RATE</Typography>
                    <Typography variant="body1" fontWeight="700" color="text.primary">{loan.interestRate}%</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip
                      label={loan.status}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.7rem', borderRadius: 2, bgcolor: sColor.bg, color: sColor.color, height: 26, px: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1} align="right">
                    {loan.status === 'PENDING' && (
                      <Tooltip title="Approve this loan (Simulated)">
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={(e) => { e.stopPropagation(); handleSelfApprove(loan.id); }}
                          sx={{ fontSize: '0.75rem', px: 2 }}
                        >
                          Approve
                        </Button>
                      </Tooltip>
                    )}
                  </Grid>
                </Grid>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 4, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                <Box>
                  {loan.status === 'PENDING' && (
                    <Alert severity="info" sx={{ mb: 4, borderRadius: 3, '& .MuiAlert-message': { fontWeight: 600 } }}>
                      This loan application is currently under review. Use the simulated 'Approve' action to process it immediately.
                    </Alert>
                  )}
                  {(loan.emiSchedules || []).length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography color="text.secondary" variant="body1" fontWeight="600">
                        Repayment schedule will be generated upon approval.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="subtitle1" fontWeight="800" color="text.primary" sx={{ mb: 3 }}>
                        Amortization Schedule
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>No.</TableCell>
                              <TableCell>Due Date</TableCell>
                              <TableCell align="right">EMI</TableCell>
                              <TableCell align="right">Principal</TableCell>
                              <TableCell align="right">Interest</TableCell>
                              <TableCell align="right">Balance</TableCell>
                              <TableCell align="center">Status</TableCell>
                              <TableCell align="center">Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {loan.emiSchedules.map((emi) => {
                              const emiColor = statusColor(emi.status);
                              return (
                                <TableRow key={emi.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                  <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>{emi.installmentNumber}</TableCell>
                                  <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{new Date(emi.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>{inrFmt(emi.emiAmount)}</TableCell>
                                  <TableCell align="right" sx={{ color: '#64748b', fontWeight: 500 }}>{inrFmt(emi.principalComponent)}</TableCell>
                                  <TableCell align="right" sx={{ color: '#64748b', fontWeight: 500 }}>{inrFmt(emi.interestComponent)}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#334155' }}>{inrFmt(emi.outstandingBalance)}</TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={emi.status}
                                      size="small"
                                      icon={emi.status === 'PAID' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined}
                                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 24, bgcolor: emiColor.bg, color: emiColor.color, borderRadius: 1.5 }}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    {emi.status === 'PENDING' && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => handlePayEmi(loan.id, emi.installmentNumber)}
                                        sx={{ py: 0.5, px: 2, fontSize: '0.75rem' }}
                                      >
                                        Pay Now
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
};

function calcEmi(principal, months) {
  if (!principal || !months || months < 1) return 0;
  const r = 10.5 / 12 / 100;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

export default Loans;
