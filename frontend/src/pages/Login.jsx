import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter your credentials');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (!err.response) {
        toast.error('Network Error: Unable to reach the server. Please check your connection or try again later.');
      } else if (err.response.status === 504 || err.response.status === 502) {
        toast.error('Server is currently offline or unreachable (Gateway Error).');
      } else if (err.response.status === 401) {
        toast.error('Invalid username or password.');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: { xs: 3.5, sm: 4.5 },
        borderRadius: 3,
        bgcolor: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
          Sign in to your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your credentials to access your banking dashboard
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.75 }}>
            Username
          </Typography>
          <TextField
            required
            fullWidth
            id="username"
            name="username"
            placeholder="Enter your username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: '#9ca3af', fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.75 }}>
            Password
          </Typography>
          <TextField
            required
            fullWidth
            name="password"
            placeholder="Enter your password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#9ca3af', fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 3.5,
            mb: 2,
            py: 1.4,
            borderRadius: 2,
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
          }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="500">
            New to DigiBank?
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Link
            to="/register"
            style={{
              color: '#1d4ed8',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Create a free account →
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

export default Login;
