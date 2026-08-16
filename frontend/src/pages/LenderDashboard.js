import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import StatsCard from '../components/StatsCard';
import StatusIndicator from '../components/StatusIndicator';
import CreateOfferDialog from '../components/CreateOfferDialog';
import { api } from '../services/api';

function LenderDashboard() {
  const { account, contract, provider } = useWeb3();
  const [offers, setOffers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Load data sequentially to better handle errors
      await loadOffers();
      await loadLoans();
      await loadPendingRequests();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data: ' + error.message);
      setNotification({
        open: true,
        message: 'Failed to refresh data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      // Get the total number of offers
      const offerCount = await contract.offerCount();
      
      // Fetch all offers
      const offersData = [];
      for (let i = 0; i < offerCount; i++) {
        const offer = await contract.offers(i);
        offersData.push({
          id: i,
          interestRate: offer.interestRate,
          duration: offer.durationDays,
          penaltyRate: offer.penaltyRate,
          lender: offer.lender,
          active: offer.active
        });
      }

      // Filter offers for current lender
      const lenderOffers = offersData.filter(
        offer => offer.lender.toLowerCase() === account.toLowerCase()
      );

      console.log('Loaded offers:', lenderOffers);
      setOffers(lenderOffers);
    } catch (error) {
      console.error('Error loading offers:', error);
      throw new Error('Failed to load offers: ' + error.message);
    }
  };

  const loadLoans = async () => {
    try {
      // Get the total number of requests
      const requestCount = await contract.requestCount();
      
      // Fetch all requests
      const loansData = [];
      for (let i = 0; i < requestCount; i++) {
        const request = await contract.requests(i);
        const offer = await contract.offers(request.offerId);
        
        // Only include loans where the current user is the lender
        if (offer.lender.toLowerCase() === account.toLowerCase()) {
          let status = 0; // Pending
          if (request.approved) {
            status = request.repaid ? 2 : 1; // 2 = Completed, 1 = Active
          }
          
          loansData.push({
            id: i,
            amount: request.amount,
            borrower: request.borrower,
            interestRate: offer.interestRate,
            duration: offer.durationDays,
            status: status,
            startTimestamp: request.startTimestamp
          });
        }
      }
      
      setLoans(loansData);
    } catch (error) {
      console.error('Error loading loans:', error);
      throw new Error('Failed to load loans: ' + error.message);
    }
  };

  const loadPendingRequests = async () => {
    try {
      // Get the total number of loan requests
      const requestCount = await contract.requestCount();
      
      // Fetch all requests and filter for pending ones
      const pendingRequestsData = [];
      for (let i = 0; i < requestCount; i++) {
        const request = await contract.requests(i);
        if (!request.approved && !request.repaid) {
          const offer = await contract.offers(request.offerId);
          pendingRequestsData.push({
            id: i,
            amount: request.amount,
            interestRate: offer.interestRate,
            duration: offer.durationDays,
            borrower: request.borrower,
            offerId: request.offerId,
            transactionHash: request.transactionHash
          });
        }
      }

      console.log('Loaded pending requests:', pendingRequestsData);
      setPendingRequests(pendingRequestsData);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      throw new Error('Failed to load pending requests: ' + error.message);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      // Find the request details
      const request = pendingRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Send the transaction with the loan amount
      const tx = await contract.approveRequest(requestId, {
        value: request.amount
      });
      await tx.wait();
      
      // Store lender's transaction in backend
      await api.createTransaction({
        transactionHash: tx.hash,
        userAddress: account.toLowerCase(),
        type: 'lend',
        amount: request.amount.toString(),
        status: 'completed'
      });

      setNotification({
        open: true,
        message: 'Loan request approved successfully!',
        severity: 'success'
      });
      loadPendingRequests();
      loadLoans();
    } catch (error) {
      console.error('Error approving request:', error);
      setNotification({
        open: true,
        message: 'Failed to approve request: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Load user transactions from backend
  const loadUserTransactions = async () => {
    try {
      const transactions = await api.getUserTransactions(account);
      console.log('User transactions from backend:', transactions);
    } catch (error) {
      console.error('Error loading user transactions:', error);
    }
  };

  // Update useEffect to load user transactions
  useEffect(() => {
    if (contract && account) {
      loadData();
      loadUserTransactions();
    }
  }, [contract, account]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const formatAmount = (amount) => {
    return ethers.formatEther(amount);
  };

  const formatInterestRate = (rate) => {
    // Convert BigInt to Number before division
    const rateNumber = Number(rate);
    return (rateNumber / 100).toFixed(2) + '%';
  };

  const formatDuration = (duration) => {
    // Convert BigInt to Number
    return Number(duration) + ' days';
  };

  const handleCreateOffer = async (transactionHash) => {
    try {
      console.log('Creating offer transaction with hash:', transactionHash); // Debug log
      
      // Store transaction in backend
      const transaction = await api.createTransaction({
        transactionHash: transactionHash,
        userAddress: account.toLowerCase(),
        type: 'lend',
        amount: '0', // No amount is locked when creating an offer
        status: 'completed'
      });

      console.log('Transaction stored in backend:', transaction); // Debug log

      setNotification({
        open: true,
        message: 'Offer created successfully!',
        severity: 'success'
      });
      loadOffers();
    } catch (error) {
      console.error('Error creating offer:', error);
      setNotification({
        open: true,
        message: 'Failed to create offer: ' + error.message,
        severity: 'error'
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Lender Dashboard
          </Typography>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadData} sx={{ mr: 2 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOfferOpen(true)}
            >
              Create Offer
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Total Lending"
              value={`${formatAmount(loans.reduce((acc, loan) => acc + loan.amount, 0n))} ETH`}
              icon={<AccountBalanceIcon />}
              subtitle="Total amount lent"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Active Loans"
              value={loans.filter(loan => loan.status === 1).length}
              icon={<TrendingUpIcon />}
              subtitle="Currently active"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Pending Requests"
              value={pendingRequests.length}
              icon={<ScheduleIcon />}
              subtitle="Awaiting approval"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard
              title="Defaulted Loans"
              value={loans.filter(loan => loan.status === 3).length}
              icon={<WarningIcon />}
              subtitle="Failed to repay"
            />
          </Grid>
        </Grid>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Pending Requests" />
          <Tab label="Active Loans" />
          <Tab label="Completed Loans" />
          <Tab label="My Offers" />
        </Tabs>

        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id.toString()}>
                    <TableCell>{request.id.toString()}</TableCell>
                    <TableCell>{formatAmount(request.amount)} ETH</TableCell>
                    <TableCell>{request.borrower}</TableCell>
                    <TableCell>{formatInterestRate(request.interestRate)}</TableCell>
                    <TableCell>{formatDuration(request.duration)}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans
                  .filter(loan => loan.status === 1)
                  .map((loan) => (
                    <TableRow key={loan.id.toString()}>
                      <TableCell>{loan.id.toString()}</TableCell>
                      <TableCell>{formatAmount(loan.amount)} ETH</TableCell>
                      <TableCell>{loan.borrower}</TableCell>
                      <TableCell>{formatInterestRate(loan.interestRate)}</TableCell>
                      <TableCell>{formatDuration(loan.duration)}</TableCell>
                      <TableCell>
                        <StatusIndicator status="active" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 2 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans
                  .filter(loan => loan.status === 2)
                  .map((loan) => (
                    <TableRow key={loan.id.toString()}>
                      <TableCell>{loan.id.toString()}</TableCell>
                      <TableCell>{formatAmount(loan.amount)} ETH</TableCell>
                      <TableCell>{loan.borrower}</TableCell>
                      <TableCell>{formatInterestRate(loan.interestRate)}</TableCell>
                      <TableCell>{formatDuration(loan.duration)}</TableCell>
                      <TableCell>
                        <StatusIndicator status="completed" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 3 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Interest Rate</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Penalty Rate</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id.toString()}>
                    <TableCell>{offer.id.toString()}</TableCell>
                    <TableCell>{formatInterestRate(offer.interestRate)}</TableCell>
                    <TableCell>{formatDuration(offer.duration)}</TableCell>
                    <TableCell>{formatInterestRate(offer.penaltyRate)}</TableCell>
                    <TableCell>
                      <StatusIndicator 
                        status={offer.active ? "active" : "completed"} 
                        label={offer.active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <CreateOfferDialog
        open={createOfferOpen}
        onClose={() => setCreateOfferOpen(false)}
        onCreateOffer={handleCreateOffer}
      />

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Container>
  );
}

export default LenderDashboard; 