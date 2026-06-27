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
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const nextErrors = {};
    const payload = {
      username: formData.username.trim(),
      password: formData.password,
      email: formData.email.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phoneNumber.trim()
    };

    if (!payload.firstName) nextErrors.firstName = 'First name is required';
    if (!payload.lastName)  nextErrors.lastName  = 'Last name is required';
    if (!payload.username)  nextErrors.username  = 'Username is required';
    if (!payload.password)  nextErrors.password  = 'Password is required';
    if (!payload.email) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (payload.password && payload.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, payload };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, payload } = validateForm();
    if (!isValid) return;

    setSubmitting(true);
    try {
      await register(payload);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      if (!err.response) {
        toast.error('Network Error: Unable to reach the server. Please check your connection or try again later.');
      } else if (err.response.status === 504 || err.response.status === 502) {
        toast.error('Server is currently offline or unreachable (Gateway Error).');
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 },
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fill in the details below to get started with DigiBank
        </Typography>
      </Box>

      {errors.form && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {errors.form}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              First Name
            </Typography>
            <TextField
              required
              fullWidth
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              Last Name
            </Typography>
            <TextField
              required
              fullWidth
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              Email Address
            </Typography>
            <TextField
              required
              fullWidth
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(errors.email)}
              helperText={errors.email}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              Username
            </Typography>
            <TextField
              required
              fullWidth
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              error={Boolean(errors.username)}
              helperText={errors.username}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              Password
            </Typography>
            <TextField
              required
              fullWidth
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(errors.password)}
              helperText={errors.password}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mb: 0.6 }}>
              Phone Number <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
            </Typography>
            <TextField
              fullWidth
              name="phoneNumber"
              placeholder="+91 9876543210"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={submitting}
              size="medium"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          sx={{
            mt: 3.5,
            mb: 2,
            py: 1.4,
            borderRadius: 2,
            fontSize: '0.95rem',
            fontWeight: 700,
          }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
        </Button>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="500">
            Already have an account?
          </Typography>
        </Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              color: '#1d4ed8',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Sign in instead →
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

export default Register;
