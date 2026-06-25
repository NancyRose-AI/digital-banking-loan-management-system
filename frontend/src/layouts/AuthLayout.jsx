import { Outlet } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { AccountBalanceWallet as LogoIcon } from '@mui/icons-material';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f3f4f6',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '44%',
          minHeight: '100vh',
          px: 8,
          background: 'linear-gradient(160deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle geometric decoration */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 340, height: 340, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', top: '40%', right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6, position: 'relative', zIndex: 1 }}>
          <Box sx={{
            p: 1.25, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center',
          }}>
            <LogoIcon sx={{ fontSize: 28, color: '#ffffff' }} />
          </Box>
          <Typography variant="h5" fontWeight="800" sx={{ color: '#ffffff', letterSpacing: '-0.5px' }}>
            DigiBank
          </Typography>
        </Box>

        {/* Tagline */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" fontWeight="700" sx={{ color: '#ffffff', lineHeight: 1.25, mb: 2 }}>
            Your money,<br />smarter banking.
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 360, lineHeight: 1.7 }}>
            Enterprise-grade digital banking with real-time fraud protection,
            instant transfers, and intelligent financial reports.
          </Typography>
        </Box>

        {/* Trust badges */}
        <Box sx={{ display: 'flex', gap: 2.5, mt: 6, position: 'relative', zIndex: 1 }}>
          {['256-bit SSL', 'RBI Compliant', '24/7 Support'].map((badge) => (
            <Box key={badge} sx={{
              px: 1.75, py: 0.75,
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 2,
              backdropFilter: 'blur(4px)',
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.72rem' }}>
                {badge}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 3, sm: 5 },
          py: 5,
        }}
      >
        <Container
          maxWidth="xs"
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            animation: 'slideInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Mobile logo */}
          <Box sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center', gap: 1.25, mb: 4, justifyContent: 'center',
          }}>
            <Box sx={{
              p: 1, borderRadius: 2, bgcolor: '#1d4ed8',
              display: 'flex', alignItems: 'center',
            }}>
              <LogoIcon sx={{ fontSize: 22, color: '#fff' }} />
            </Box>
            <Typography variant="h6" fontWeight="800" color="primary">DigiBank</Typography>
          </Box>

          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;