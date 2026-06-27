import { useAuth } from '../context/AuthContext';
import CustomerDashboard from '../components/CustomerDashboard';
import AdminDashboard from '../components/AdminDashboard';
import { Box, Typography } from '@mui/material';

const Dashboard = () => {
  const { isCustomer, isAdmin, isEmployee } = useAuth();

  return (
    <Box>
      {isCustomer && <CustomerDashboard />}
      {(isAdmin || isEmployee) && <AdminDashboard />}
      {(!isCustomer && !isAdmin && !isEmployee) && (
        <Typography color="text.secondary">No role assigned or loading.</Typography>
      )}
    </Box>
  );
};

export default Dashboard;
