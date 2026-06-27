import { useState, useEffect, useRef } from 'react';
import KycUpload from './KycUpload';
import KycList from './KycList';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Grid, Paper, Typography, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, LinearProgress, List, ListItem, Tooltip,
  ListItemIcon, ListItemText, Divider, Avatar, Dialog, DialogContent, DialogActions, DialogTitle, CircularProgress,
} from '@mui/material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip as ChartTooltip, Legend,
  ArcElement, BarElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AccountBalance, CreditCard, SwapHoriz, TrendingUp,
  VerifiedUser, RequestQuote, Receipt, Payment,
  AddCircleOutline, RemoveCircleOutline, Warning, CheckCircle,
  ErrorOutline, Refresh as RefreshIcon, Security as SecurityIcon,
  Timeline as TimelineIcon, ChevronRight as ChevronRightIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { inrFmt } from '../utils/currency';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, ChartTooltip, Legend, Filler
);

const RISK_CONFIG = {
  HIGH: { color: 'error', hex: '#f43f5e', label: 'HIGH RISK', icon: <ErrorOutline fontSize="small" /> },
  MEDIUM: { color: 'warning', hex: '#f59e0b', label: 'MEDIUM RISK', icon: <Warning fontSize="small" /> },
  LOW: { color: 'info', hex: '#38bdf8', label: 'LOW RISK', icon: <Warning fontSize="small" /> },
  SAFE: { color: 'success', hex: '#10b981', label: 'SECURE', icon: <CheckCircle fontSize="small" /> },
};


const StatCard = ({ icon, label, value, iconBg, iconColor, sub, actionLabel, onAction }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 4,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      background: '#ffffff',
      transition: 'all 0.2s ease-in-out',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      '&:hover': {
        boxShadow: '0 6px 20px -6px rgba(148, 163, 184, 0.14)',
        borderColor: '#e2e8f0',
        transform: 'translateY(-2px)',
      },
    }}
  >
    {/* Icon row */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 38, height: 38, borderRadius: 2,
        bgcolor: iconBg, color: iconColor, flexShrink: 0,
      }}>
        {icon}
      </Box>
    </Box>

    {/* Label */}
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight="600"
      sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', lineHeight: 1 }}
    >
      {label}
    </Typography>

    {/* Value */}
    <Tooltip title={String(value)} placement="top">
      <Typography
        variant="subtitle1"
        fontWeight="700"
        color="text.primary"
        sx={{
          letterSpacing: '-0.3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.25,
        }}
      >
        {value}
      </Typography>
    </Tooltip>

    {/* Sub-label */}
    {sub && (
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="500"
        sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1 }}
      >
        {sub}
      </Typography>
    )}

    {/* Optional action button (e.g. Update KYC) */}
    {actionLabel && onAction && (
      <Button
        size="small"
        variant="outlined"
        onClick={onAction}
        sx={{
          mt: 'auto',
          pt: 0.5,
          fontSize: '0.7rem',
          fontWeight: 700,
          borderRadius: 2,
          borderColor: iconColor,
          color: iconColor,
          textTransform: 'none',
          '&:hover': { bgcolor: iconBg, borderColor: iconColor },
        }}
      >
        {actionLabel}
      </Button>
    )}
  </Paper>
);

const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [fraudLoading, setFraudLoading] = useState(true);
  const [fraudRefreshing, setFraudRefreshing] = useState(false);
  const [fraudLastUpdated, setFraudLastUpdated] = useState(null);
  const [kycRefresh, setKycRefresh] = useState(0);
  const [showKycForm, setShowKycForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const fraudPollRef = useRef(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.userId) return;
      try {
        const res = await api.get(`/dashboard/user/${user.userId}`);
        setDashboardData(res.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };
    fetchDashboard();
  }, [user, kycRefresh]);

  const fetchFraudAlerts = async (isManualRefresh = false) => {
    if (!user?.userId) return;
    if (isManualRefresh) setFraudRefreshing(true);
    else setFraudLoading(true);
    try {
      const res = await api.get(`/fraud/user/${user.userId}`);
      setFraudAlerts(res.data.data || []);
      setFraudLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch fraud alerts', error);
    } finally {
      setFraudLoading(false);
      setFraudRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user?.userId) return;
    fetchFraudAlerts(false);
    fraudPollRef.current = setInterval(() => fetchFraudAlerts(false), 30000);
    return () => clearInterval(fraudPollRef.current);
  }, [user]);

  const getOverallRisk = () => {
    if (!fraudAlerts || fraudAlerts.length === 0) return RISK_CONFIG.SAFE;
    const levels = fraudAlerts.map(a => a.riskLevel);
    if (levels.includes('HIGH')) return RISK_CONFIG.HIGH;
    if (levels.includes('MEDIUM')) return RISK_CONFIG.MEDIUM;
    if (levels.includes('LOW')) return RISK_CONFIG.LOW;
    return RISK_CONFIG.SAFE;
  };

  const riskStatus = getOverallRisk();

  if (!dashboardData) {
    return (
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 15 }}>
        <CircularProgress size={40} thickness={4} sx={{ color: '#3b82f6' }} />
        <Typography variant="body1" color="text.secondary" fontWeight="600">Preparing your pastel workspace...</Typography>
      </Box>
    );
  }


  const activityBarData = {
    labels: dashboardData.activityLabels || ['Deposits', 'Transfers', 'Loans', 'EMI'],
    datasets: [
      {
        label: 'Today',
        data: dashboardData.activityTodayData || [0, 0, 0, 0],
        backgroundColor: '#60a5fa',
        borderRadius: 8,
        barThickness: 20,
      },
      {
        label: 'Yesterday',
        data: dashboardData.activityYesterdayData || [0, 0, 0, 0],
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { family: 'Inter', weight: '600', size: 12 }, usePointStyle: true, pointStyleWidth: 10, color: '#64748b' } },
      tooltip: {
        backgroundColor: '#ffffff', titleColor: '#1e293b', bodyColor: '#475569',
        borderColor: '#e2e8f0', borderWidth: 1,
        titleFont: { family: 'Inter', size: 13, weight: '700' }, bodyFont: { family: 'Inter', size: 13 }, padding: 12, cornerRadius: 12,
        callbacks: { label: (ctx) => ` ₹${parseFloat(ctx.raw || 0).toLocaleString('en-IN')}` }
      }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Inter', weight: '600', size: 11 }, color: '#94a3b8' } },
      y: { border: { display: false }, ticks: { font: { family: 'Inter', weight: '600', size: 11 }, color: '#94a3b8', callback: (val) => val > 1000 ? (val / 1000) + 'k' : val }, grid: { color: '#f8fafc', drawBorder: false } },
    },
  };

  const doughnutData = {
    labels: ['Available', 'Loan', 'EMI'],
    datasets: [{
      data: [
        dashboardData.availableFunds || 0,
        dashboardData.activeLoanAmount || 0,
        dashboardData.totalPendingEmiAmount || 0,
      ],
      backgroundColor: ['#34d399', '#7dd3fc', '#fca5a5'], // Mint, Light Blue, Light Pink
      hoverOffset: 6,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'right', labels: { font: { family: 'Inter', weight: '600', size: 12 }, color: '#64748b', usePointStyle: true, padding: 20 } },
      tooltip: {
        backgroundColor: '#ffffff', titleColor: '#1e293b', bodyColor: '#475569',
        borderColor: '#e2e8f0', borderWidth: 1,
        titleFont: { family: 'Inter', size: 13, weight: '700' }, bodyFont: { family: 'Inter', size: 13 }, padding: 12, cornerRadius: 12,
      }
    },
  };

  const creditColor = (score) => {
    if (score >= 800) return '#10b981';
    if (score >= 740) return '#38bdf8';
    if (score >= 670) return '#8b5cf6';
    if (score >= 580) return '#f59e0b';
    return '#f43f5e';
  };

  const creditProgress = (score) => Math.max(0, Math.min(100, ((score - 300) / 600) * 100));

  return (
    <Box>
      <Box sx={{
        display: 'flex', flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' },
        gap: 2, mb: 4,
      }}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
            Welcome back, {user?.username}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight="500">
            Here's your personal financial overview
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/transfers')}
            startIcon={<SwapHoriz />}
            sx={{ bgcolor: '#ffffff', color: '#1e293b', borderColor: '#e2e8f0', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}
          >
            Transfer
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/loans')}
            startIcon={<RequestQuote />}
          >
            Apply Loan
          </Button>
        </Box>
      </Box>


      <Grid container spacing={2} sx={{ mb: 4, alignItems: 'stretch' }}>
        {/* Total Balance */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<WalletIcon sx={{ fontSize: 20 }} />}
            label="Total Balance"
            value={inrFmt(dashboardData.totalBalance)}
            iconBg="#e0e7ff" iconColor="#4338ca"
          />
        </Grid>

        {/* Active Loans */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<CreditCard sx={{ fontSize: 20 }} />}
            label="Active Loans"
            value={dashboardData.activeLoans || 0}
            iconBg="#e0f2fe" iconColor="#0369a1"
          />
        </Grid>

        {/* Credit Score */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            label="Credit Score"
            value={dashboardData.creditScore || 0}
            sub={dashboardData.creditScoreRating || '—'}
            iconBg="#f3e8ff" iconColor="#7e22ce"
          />
        </Grid>

        {/* Upcoming EMI */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<Receipt sx={{ fontSize: 20 }} />}
            label="Upcoming EMI"
            value={dashboardData.upcomingEmiAmount > 0 ? inrFmt(dashboardData.upcomingEmiAmount) : '₹0'}
            sub={
              dashboardData.upcomingEmiDueDate
                ? `Due ${new Date(dashboardData.upcomingEmiDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${dashboardData.upcomingEmiCount > 1 ? ` (${dashboardData.upcomingEmiCount} loans)` : ''}`
                : 'No upcoming EMI'
            }
            iconBg="#ccfbf1" iconColor="#0f766e"
          />
        </Grid>

        {/* Transactions */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<Payment sx={{ fontSize: 20 }} />}
            label="Transactions"
            value={dashboardData.recentTransactionsCount || 0}
            sub="Last 30 days"
            iconBg="#fce7f3" iconColor="#be185d"
          />
        </Grid>

        {/* KYC Status */}
        <Grid item xs={6} sm={4} md={4} lg={2} sx={{ display: 'flex' }}>
          <StatCard
            icon={<VerifiedUser sx={{ fontSize: 20 }} />}
            label="KYC Status"
            value={dashboardData.kycStatus || '—'}
            sub={
              dashboardData.kycStatus === 'VERIFIED'
                ? 'Identity verified'
                : dashboardData.kycStatus === 'PENDING'
                  ? 'Under review'
                  : 'Action required'
            }
            iconBg={dashboardData.kycStatus === 'VERIFIED' ? '#dcfce7' : dashboardData.kycStatus === 'PENDING' ? '#fef9c3' : '#ffedd5'}
            iconColor={dashboardData.kycStatus === 'VERIFIED' ? '#15803d' : dashboardData.kycStatus === 'PENDING' ? '#a16207' : '#c2410c'}
            actionLabel={
              dashboardData.kycStatus !== 'VERIFIED' && dashboardData.kycStatus !== 'PENDING'
                ? 'Update KYC'
                : undefined
            }
            onAction={
              dashboardData.kycStatus !== 'VERIFIED' && dashboardData.kycStatus !== 'PENDING'
                ? () => setShowKycForm(true)
                : undefined
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, border: '1px solid #f1f5f9' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Avatar variant="rounded" sx={{ bgcolor: '#f1f5f9', color: '#1e293b', width: 36, height: 36 }}>
                <TimelineIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Credit Insights
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ flex: 1, textAlign: 'center', p: 3, bgcolor: '#ffffff', borderRadius: 4, border: '1px solid #f8fafc' }}>
                <Typography variant="h4" fontWeight="700" sx={{ color: creditColor(dashboardData.creditScore || 300), letterSpacing: '-0.5px', mb: 0.5 }}>
                  {dashboardData.creditScore || 300}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight="500" sx={{ mb: 2 }}>
                  Out of 900
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={creditProgress(dashboardData.creditScore || 300)}
                  sx={{
                    height: 8, borderRadius: 4,
                    bgcolor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      bgcolor: creditColor(dashboardData.creditScore || 300),
                    },
                  }}
                />
                <Chip
                  label={dashboardData.creditScoreRating || 'Poor'}
                  size="small"
                  sx={{
                    mt: 2, fontWeight: 700, fontSize: '0.75rem', borderRadius: 2,
                    bgcolor: creditColor(dashboardData.creditScore || 300) + '20',
                    color: creditColor(dashboardData.creditScore || 300),
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant="caption" fontWeight="700" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                  Key Factors
                </Typography>
                <List dense disablePadding>
                  {(dashboardData.creditScoreFactors || []).slice(0, 3).map((factor, i) => {
                    const isPos = factor.includes('+');
                    return (
                      <ListItem key={i} sx={{ py: 1, px: 0, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 28, mt: 0.5 }}>
                          <Avatar variant="rounded" sx={{ width: 20, height: 20, bgcolor: isPos ? '#d1fae5' : '#ffe4e6', color: isPos ? '#10b981' : '#f43f5e' }}>
                            {isPos ? <AddCircleOutline sx={{ fontSize: 14 }} /> : <RemoveCircleOutline sx={{ fontSize: 14 }} />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={factor}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
                        />
                      </ListItem>
                    );
                  })}
                  {(!dashboardData.creditScoreFactors || dashboardData.creditScoreFactors.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No data available.</Typography>
                  )}
                </List>
              </Box>
            </Box>
          </Paper>
        </Grid>


        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 4, border: '1px solid #f1f5f9' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar variant="rounded" sx={{ bgcolor: riskStatus.hex + '15', color: riskStatus.hex, width: 36, height: 36 }}>
                  <SecurityIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                    Security Shield
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    {fraudLastUpdated ? `Checked: ${fraudLastUpdated.toLocaleTimeString('en-IN')}` : 'Active Monitoring'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={<Box sx={{ pl: 0.5 }}>{riskStatus.icon}</Box>}
                  label={riskStatus.label}
                  sx={{
                    fontWeight: 700, fontSize: '0.7rem', height: 24, borderRadius: 2,
                    bgcolor: riskStatus.hex + '15',
                    color: riskStatus.hex,
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => fetchFraudAlerts(true)}
                  disabled={fraudRefreshing || fraudLoading}
                  sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}
                >
                  <RefreshIcon fontSize="small" className={(fraudRefreshing || fraudLoading) ? 'animate-spin-custom' : ''} sx={{ color: '#64748b' }} />
                </IconButton>
              </Box>
            </Box>

            {fraudLoading && fraudAlerts.length === 0 ? (
              <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#94a3b8', mb: 2 }} />
                <Typography variant="body2" fontWeight="600" color="text.secondary">Scanning transactions...</Typography>
              </Box>
            ) : fraudAlerts.length > 0 ? (
              <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                {fraudAlerts.map(alert => (
                  <Box key={alert.id} sx={{ p: 2, mb: 1.5, borderRadius: 3, bgcolor: alert.riskLevel === 'HIGH' ? '#fff1f2' : alert.riskLevel === 'MEDIUM' ? '#fffbeb' : '#f0f9ff' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="700" color={alert.riskLevel === 'HIGH' ? '#e11d48' : alert.riskLevel === 'MEDIUM' ? '#d97706' : '#0284c7'}>
                        {alert.eventType?.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="caption" fontWeight="600" color="text.secondary">
                        {alert.createdAt ? new Date(alert.createdAt).toLocaleDateString() : '—'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary" fontWeight="500">
                      {alert.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, p: 3, borderRadius: 4, bgcolor: '#f0fdf4', border: '1px dashed #a7f3d0' }}>
                <Avatar variant="rounded" sx={{ bgcolor: '#d1fae5', color: '#10b981', width: 48, height: 48 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="800" color="#065f46" sx={{ mb: 0.5 }}>
                    Clear & Secure
                  </Typography>
                  <Typography variant="body2" color="#047857" fontWeight="500" sx={{ lineHeight: 1.4 }}>
                    No suspicious patterns found. We are continuously monitoring your account.
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>


      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, height: 360, borderRadius: 4, border: '1px solid #f1f5f9' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Activity Flow
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Transaction volume over the last 48 hours
              </Typography>
            </Box>
            <Box sx={{ height: 250 }}>
              <Bar data={activityBarData} options={barOptions} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, height: 360, borderRadius: 4, border: '1px solid #f1f5f9' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Fund Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Visual breakdown of balances
              </Typography>
            </Box>
            <Box sx={{ height: 230, display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>


      <Box sx={{ mb: 4 }}>
        <KycList refreshTrigger={kycRefresh} />
      </Box>


      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Recent Transactions
              </Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 700 }} onClick={() => navigate('/reports')}>
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Ref ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(dashboardData.recentTransactions || []).slice(0, 5).map((tx) => {
                    const isMinus = tx.type === 'TRANSFER' || tx.type === 'WITHDRAWAL';
                    return (
                      <TableRow key={tx.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>
                          {tx.transactionReference?.substring(0, 8)}…
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                          {tx.description || tx.type}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.9rem', color: isMinus ? '#1e293b' : '#10b981' }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: isMinus ? '#f8fafc' : '#f0fdf4', px: 1, py: 0.5, borderRadius: 2 }}>
                            {isMinus ? '-' : '+'}{inrFmt(tx.amount)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!dashboardData.recentTransactions || dashboardData.recentTransactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        No transactions to show.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {dashboardData.upcomingEmiAmount > 0 && (
            <Paper
              elevation={0}
              sx={{
                mb: 2.5, p: 2.5, borderRadius: 4,
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { boxShadow: '0 6px 20px -6px rgba(148,163,184,0.14)', borderColor: '#e2e8f0' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 2, bgcolor: '#ccfbf1', color: '#0f766e', flexShrink: 0 }}>
                  <Receipt sx={{ fontSize: 18 }} />
                </Box>
                <Typography variant="caption" fontWeight="600" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Next EMI Liability
                </Typography>
              </Box>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.3px', mb: 0.25 }}>
                {inrFmt(dashboardData.upcomingEmiAmount)}
              </Typography>
              {dashboardData.upcomingEmiDueDate && (
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block', mb: 2 }}>
                  Due {new Date(dashboardData.upcomingEmiDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{dashboardData.upcomingEmiCount > 1 ? ` (${dashboardData.upcomingEmiCount} loans)` : ''}
                </Typography>
              )}
              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={() => navigate('/loans')}
                sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.8rem', borderColor: '#e2e8f0', color: '#475569', '&:hover': { borderColor: '#0f766e', color: '#0f766e', bgcolor: '#f0fdfa' } }}
              >
                Manage Payment
              </Button>
            </Paper>
          )}

          <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Quick Shortcuts
              </Typography>
            </Box>
            <List disablePadding>
              {[
                { label: 'View Accounts', path: '/accounts' },
                { label: 'Apply for Loan', path: '/loans' },
                { label: 'Financial Reports', path: '/reports' },
              ].map((item, i) => (
                <ListItem key={i} disablePadding sx={{ borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                  <Button
                    fullWidth
                    onClick={() => navigate(item.path)}
                    endIcon={<ChevronRightIcon sx={{ color: '#cbd5e1' }} />}
                    sx={{
                      justifyContent: 'space-between',
                      px: 3, py: 2,
                      color: '#475569',
                      fontWeight: 600,
                      borderRadius: 0,
                      '&:hover': { bgcolor: '#f8fafc', color: '#2563eb' },
                    }}
                  >
                    {item.label}
                  </Button>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={showKycForm} onClose={() => setShowKycForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', borderBottom: '1px solid #f1f5f9', pb: 2 }}>
          KYC Verification
        </DialogTitle>
        <DialogContent sx={{ py: 4 }}>
          <KycUpload onUploadSuccess={() => { setKycRefresh(p => p + 1); setShowKycForm(false); }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
          <Button onClick={() => setShowKycForm(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDashboard;
