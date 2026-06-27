import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box, Grid, Paper, Typography, Button, ButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider, LinearProgress, CircularProgress, Tooltip, Avatar, Stack,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip as ChartTooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  AccountBalance, TrendingUp, TrendingDown, SwapHoriz,
  CreditCard, Payment, Assessment, PictureAsPdf, TableChart,
  Refresh as RefreshIcon, ArrowUpward as UpIcon, ArrowDownward as DownIcon,
} from '@mui/icons-material';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, ChartTooltip, Legend,
);

const fmt = (val) =>
  `₹${parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const creditColor = (score) => {
  if (score >= 800) return '#16a34a';
  if (score >= 740) return '#0284c7';
  if (score >= 670) return '#1d4ed8';
  if (score >= 580) return '#d97706';
  return '#dc2626';
};

const PERIOD_LABELS = { TODAY: 'Today', THIS_MONTH: 'This Month', ALL_TIME: 'All Time' };


const MetricCard = ({ icon, label, value, accent, sub }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 4,
      border: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 24px -6px rgba(148, 163, 184, 0.12)',
        borderColor: '#e2e8f0',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar variant="rounded" sx={{ bgcolor: accent + '15', color: accent, width: 36, height: 36 }}>
          {icon}
        </Avatar>
        <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </Typography>
      </Box>
    </Box>
    <Box>
      <Tooltip title={value} placement="top">
        <Typography 
          variant="subtitle1" 
          fontWeight="700" 
          color="text.primary" 
          sx={{ 
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            lineHeight: 1.2
          }}
        >
          {value}
        </Typography>
      </Tooltip>
      {sub && (
        <Typography variant="caption" color="text.secondary" fontWeight="500" sx={{ display: 'block', mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
  </Paper>
);


const FinancialReports = () => {
  const { user } = useAuth();
  const [period, setPeriod]   = useState('ALL_TIME');
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchReport = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/reports/user/${user.userId}?period=${period}`);
      setReport(res.data.data || null);
    } catch (err) {
      console.error('Failed to fetch report', err);
      setError('Could not load your report. Please try refreshing.');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);


  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const now = new Date().toLocaleString('en-IN');

    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text('DigiBank – Financial Report', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${PERIOD_LABELS[period]}   |   Generated: ${now}`, 14, 26);
    doc.setDrawColor(220);
    doc.line(14, 30, 196, 30);

    const rows = [
      ['Current Balance',   fmt(report.currentBalance)],
      ['Total Deposits',    fmt(report.totalDeposits)],
      ['Total Withdrawals', fmt(report.totalWithdrawals)],
      ['Total Transfers',   fmt(report.totalTransfers)],
      ['Total Loan Amount', fmt(report.totalLoanAmount)],
      ['Total EMI Paid',    fmt(report.totalEmiPaid)],
      ['Credit Score',      `${report.creditScore} (${report.creditScoreRating})`],
      ['Deposit Count',     report.depositCount],
      ['Withdrawal Count',  report.withdrawalCount],
      ['Transfer Count',    report.transferCount],
      ['EMI Payment Count', report.emiPaymentCount],
      ['Active Loans',      report.loanCount],
    ];

    let y = 38;
    doc.setFontSize(11);
    rows.forEach(([label, val]) => {
      doc.setTextColor(60);
      doc.text(label, 14, y);
      doc.setTextColor(0);
      doc.text(String(val), 110, y);
      y += 8;
    });

    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Transaction History', 14, y + 6);
    y += 14;

    doc.setFontSize(9);
    doc.setTextColor(80);
    const headers = ['Date', 'Type', 'Amount', 'Status', 'Description'];
    const colX = [14, 45, 95, 130, 158];
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    y += 5;
    doc.setDrawColor(180);
    doc.line(14, y, 196, y);
    y += 4;

    doc.setTextColor(40);
    (report.transactions || []).slice(0, 40).forEach((t) => {
      if (y > 270) { doc.addPage(); y = 14; }
      const date = t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '-';
      doc.text(date,                               colX[0], y);
      doc.text(t.type || '-',                      colX[1], y);
      doc.text(fmt(t.amount),                      colX[2], y);
      doc.text(t.status || '-',                    colX[3], y);
      doc.text((t.description || '-').substring(0, 20), colX[4], y);
      y += 7;
    });

    doc.save(`financial_report_${period.toLowerCase()}_${Date.now()}.pdf`);
  };


  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const summary = [
      ['Period', PERIOD_LABELS[period]],
      ['Current Balance',   parseFloat(report.currentBalance  || 0)],
      ['Total Deposits',    parseFloat(report.totalDeposits   || 0)],
      ['Total Withdrawals', parseFloat(report.totalWithdrawals || 0)],
      ['Total Transfers',   parseFloat(report.totalTransfers  || 0)],
      ['Total Loan Amount', parseFloat(report.totalLoanAmount || 0)],
      ['Total EMI Paid',    parseFloat(report.totalEmiPaid    || 0)],
      ['Credit Score',      report.creditScore],
      ['Credit Rating',     report.creditScoreRating],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

    const txHeader = [['ID', 'Date', 'Type', 'Amount', 'Status', 'Description', 'Reference']];
    const txRows = (report.transactions || []).map(t => [
      t.id,
      t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '',
      t.type,
      parseFloat(t.amount || 0),
      t.status,
      t.description || '',
      t.transactionReference || '',
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...txHeader, ...txRows]), 'Transactions');

    const monthHeader = [['Month', 'Deposits (₹)', 'Withdrawals (₹)', 'Transfers (₹)']];
    const monthRows = (report.monthlyLabels || []).map((lbl, i) => [
      lbl,
      parseFloat(report.monthlyDepositAmounts?.[i]    || 0),
      parseFloat(report.monthlyWithdrawalAmounts?.[i] || 0),
      parseFloat(report.monthlyTransferAmounts?.[i]   || 0),
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...monthHeader, ...monthRows]), 'Monthly');

    XLSX.writeFile(wb, `financial_report_${period.toLowerCase()}_${Date.now()}.xlsx`);
  };


  const monthlyBarData = report ? {
    labels: report.monthlyLabels || [],
    datasets: [
      {
        label: 'Deposits',
        data: (report.monthlyDepositAmounts || []).map(v => parseFloat(v)),
        backgroundColor: '#34d399',
        borderRadius: 3,
        borderSkipped: false,
      },
      {
        label: 'Withdrawals',
        data: (report.monthlyWithdrawalAmounts || []).map(v => parseFloat(v)),
        backgroundColor: '#f87171',
        borderRadius: 3,
        borderSkipped: false,
      },
      {
        label: 'Transfers',
        data: (report.monthlyTransferAmounts || []).map(v => parseFloat(v)),
        backgroundColor: '#60a5fa',
        borderRadius: 3,
        borderSkipped: false,
      },
    ],
  } : null;

  const donutData = report ? {
    labels: ['Deposits', 'Withdrawals', 'Transfers', 'EMI Paid'],
    datasets: [{
      data: [
        parseFloat(report.totalDeposits   || 0),
        parseFloat(report.totalWithdrawals || 0),
        parseFloat(report.totalTransfers  || 0),
        parseFloat(report.totalEmiPaid    || 0),
      ],
      backgroundColor: ['#34d399', '#f87171', '#60a5fa', '#fbbf24'],
      borderWidth: 3,
      borderColor: '#ffffff',
    }],
  } : null;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { family: 'Inter', weight: '600', size: 12 }, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (c) => ` ₹${parseFloat(c.raw || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        border: { display: false },
        grid: { color: '#f3f4f6' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          callback: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return value;
            return num >= 1000 ? `₹${(num / 1000).toFixed(0)}k` : `₹${num}`;
          },
        },
      },
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Inter', weight: '600', size: 12 }, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (c) => ` ${c.label}: ₹${parseFloat(c.raw || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  return (
    <Box>

      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        mb: 3.5, flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            Financial Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }} fontWeight="500">
            Detailed analytics and transaction history for your account
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Period filter */}
          <ButtonGroup variant="outlined" size="small" sx={{ bgcolor: '#ffffff', borderRadius: 2 }}>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <Button
                key={key}
                variant={period === key ? 'contained' : 'outlined'}
                onClick={() => setPeriod(key)}
                sx={{ fontWeight: 600, px: 2 }}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>

          <Tooltip title="Refresh">
            <Button
              variant="outlined"
              size="small"
              onClick={fetchReport}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 600, bgcolor: '#ffffff' }}
            >
              Refresh
            </Button>
          </Tooltip>

          {report && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download PDF">
                <Button size="small" variant="outlined" color="error" startIcon={<PictureAsPdf />} onClick={exportPDF} sx={{ fontWeight: 600, bgcolor: '#ffffff' }}>
                  PDF
                </Button>
              </Tooltip>
              <Tooltip title="Download Excel">
                <Button size="small" variant="outlined" color="success" startIcon={<TableChart />} onClick={exportExcel} sx={{ fontWeight: 600, bgcolor: '#ffffff' }}>
                  Excel
                </Button>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
          <CircularProgress size={36} thickness={4} sx={{ color: '#1d4ed8' }} />
          <Typography variant="body2" color="text.secondary">Loading your report…</Typography>
        </Box>
      ) : error ? (
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2.5, textAlign: 'center' }}>
          <Typography color="error.main" fontWeight="600" sx={{ mb: 1.5 }}>{error}</Typography>
          <Button variant="contained" onClick={fetchReport} startIcon={<RefreshIcon />}>
            Try Again
          </Button>
        </Paper>
      ) : report ? (
        <>

          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<AccountBalance sx={{ fontSize: 17 }} />}
                label="Balance"
                value={fmt(report.currentBalance)}
                accent="#1d4ed8"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<TrendingUp sx={{ fontSize: 17 }} />}
                label="Deposits"
                value={fmt(report.totalDeposits)}
                accent="#16a34a"
                sub={`${report.depositCount} transactions`}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<TrendingDown sx={{ fontSize: 17 }} />}
                label="Withdrawals"
                value={fmt(report.totalWithdrawals)}
                accent="#dc2626"
                sub={`${report.withdrawalCount} transactions`}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<SwapHoriz sx={{ fontSize: 17 }} />}
                label="Transfers"
                value={fmt(report.totalTransfers)}
                accent="#0891b2"
                sub={`${report.transferCount} transactions`}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<CreditCard sx={{ fontSize: 17 }} />}
                label="Loans"
                value={fmt(report.totalLoanAmount)}
                accent="#1d4ed8"
                sub={`${report.loanCount} active`}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <MetricCard
                icon={<Payment sx={{ fontSize: 17 }} />}
                label="EMI Paid"
                value={fmt(report.totalEmiPaid)}
                accent="#d97706"
                sub={`${report.emiPaymentCount} payments`}
              />
            </Grid>
          </Grid>


          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: '100%', border: '1px solid #f1f5f9' }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 2 }}>
                  Credit Score Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
                  <Typography variant="h4" fontWeight="700" sx={{ color: creditColor(report.creditScore), letterSpacing: '-1px' }}>
                    {report.creditScore}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" fontWeight="500">/ 900</Typography>
                  <Chip
                    label={report.creditScoreRating}
                    size="small"
                    sx={{
                      ml: 1, fontWeight: 700,
                      bgcolor: creditColor(report.creditScore) + '15',
                      color: creditColor(report.creditScore),
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, Math.min(100, (((report.creditScore || 300) - 300) / 600) * 100))}
                  sx={{
                    height: 10, borderRadius: 3,
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: creditColor(report.creditScore),
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">300 Poor</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">670 Good</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">900 Excellent</Typography>
                </Box>
              </Paper>
            </Grid>


            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, height: 240, border: '1px solid #f1f5f9' }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 0.5 }}>
                  Exposure Distribution
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  {PERIOD_LABELS[period]}
                </Typography>
                <Box sx={{ height: 155, display: 'flex', justifyContent: 'center' }}>
                  {donutData && <Doughnut data={donutData} options={donutOptions} />}
                </Box>
              </Paper>
            </Grid>
          </Grid>


          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, mb: 3.5, height: 360, border: '1px solid #f1f5f9' }}>
            <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ mb: 0.5 }}>
              Monthly Activity Overview
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              6-month comparison of deposits, withdrawals, and transfers
            </Typography>
            <Box sx={{ height: 268 }}>
              {monthlyBarData && <Bar data={monthlyBarData} options={barOptions} />}
            </Box>
          </Paper>


          <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
            <Box sx={{
              px: 3, py: 2,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                Transaction Ledger — {PERIOD_LABELS[period]}
              </Typography>
              <Chip
                label={`${report.transactions?.length || 0} records`}
                size="small"
                sx={{ fontSize: '0.72rem', fontWeight: 600, bgcolor: '#f3f4f6', color: '#6b7280', height: 24 }}
              />
            </Box>
            <TableContainer sx={{ maxHeight: 420 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report.transactions || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                        <Assessment sx={{ fontSize: 32, color: '#d1d5db', mb: 1 }} />
                        <Typography variant="body2" fontWeight="600" color="text.secondary">No transactions in this period</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (report.transactions || []).map((t, idx) => {
                      const isMinus = t.type === 'WITHDRAWAL' || t.type === 'TRANSFER' || t.type === 'EMI_PAYMENT';
                      return (
                        <TableRow key={t.id}>
                          <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'text.secondary' }}>
                            {t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.type?.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.68rem', height: 22,
                                bgcolor:
                                  t.type === 'DEPOSIT'     ? '#f0fdf4' :
                                  t.type === 'WITHDRAWAL'  ? '#fef2f2' :
                                  t.type === 'TRANSFER'    ? '#eff6ff' : '#fffbeb',
                                color:
                                  t.type === 'DEPOSIT'     ? '#16a34a' :
                                  t.type === 'WITHDRAWAL'  ? '#dc2626' :
                                  t.type === 'TRANSFER'    ? '#1d4ed8' : '#d97706',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: isMinus ? '#dc2626' : '#16a34a' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                              {isMinus
                                ? <DownIcon sx={{ fontSize: 13 }} />
                                : <UpIcon sx={{ fontSize: 13 }} />}
                              {fmt(t.amount)}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.status}
                              size="small"
                              color={t.status === 'COMPLETED' ? 'success' : t.status === 'FAILED' ? 'error' : 'warning'}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.85rem' }}>
                            {t.description || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {t.transactionReference || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : (
        <Paper elevation={1} sx={{ p: 5, borderRadius: 2.5, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 40, color: '#d1d5db', mb: 1.5 }} />
          <Typography variant="body1" fontWeight="600" color="text.secondary">
            No report data available for this period.
          </Typography>
          <Button variant="contained" onClick={fetchReport} startIcon={<RefreshIcon />} sx={{ mt: 2.5 }}>
            Retry
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default FinancialReports;
