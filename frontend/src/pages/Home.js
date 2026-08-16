import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';

function Home() {
  const navigate = useNavigate();
  const { account, connectWallet, isLoading, error } = useWeb3();
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setNotification({
        open: true,
        message: 'Wallet connected successfully!',
        severity: 'success'
      });
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Failed to connect wallet',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Welcome to P2P Lending Platform
        </Typography>

        {!account ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleConnectWallet}
              disabled={isLoading}
              sx={{ minWidth: '200px' }}
            >
              {isLoading ? (
                <LoadingSpinner size={24} message="Connecting..." variant="inline" />
              ) : (
                'Connect MetaMask'
              )}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Lender Dashboard
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Create loan offers and manage your lending portfolio.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/lender')}
                  >
                    Go to Lender Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Borrower Dashboard
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Browse loan offers and manage your borrowing requests.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/borrower')}
                  >
                    Go to Borrower Dashboard
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Container>
  );
}

export default Home;