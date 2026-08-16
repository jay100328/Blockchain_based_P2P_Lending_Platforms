import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Link,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useWeb3 } from '../context/Web3Context';
import LoadingSpinner from '../components/LoadingSpinner';
import Notification from '../components/Notification';
import StatsCard from '../components/StatsCard';
import StatusIndicator from '../components/StatusIndicator';
import RequestLoanDialog from '../components/RequestLoanDialog';
import LoanHistoryChart from '../components/LoanHistoryChart';
import PaymentSchedule from '../components/PaymentSchedule';
import { api } from '../services/api';

function BorrowerDashboard() {
  const { account, contract, provider } = useWeb3();
  const [offers, setOffers] = useState([]);
  const [groupedOffers, setGroupedOffers] = useState({});
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [requestLoanOpen, setRequestLoanOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadOffers = async () => {
    if (!contract || !provider) {
      console.error('Contract or provider not initialized');
      return;
    }

    try {
      console.log('Loading offers...');
      // Get contract address and network
      const contractAddress = await contract.getAddress();
      let networkInfo;
      try {
        networkInfo = await provider.getNetwork();
        console.log('Network info:', networkInfo);
      } catch (error) {
        console.error('Error getting network info:', error);
        networkInfo = { chainId: 0, name: 'unknown' };
      }
      
      console.log('Contract details:', {
        address: contractAddress,
        network: networkInfo
      });
      
      const offerCount = await contract.offerCount();
      console.log('Total offers in contract:', offerCount.toString());
      
      const offersData = [];
      for (let i = 0; i < offerCount; i++) {
        try {
          console.log(`Loading offer ${i}...`);
          const offer = await contract.offers(i);
          console.log(`Offer ${i} details:`, {
            active: offer.active,
            lender: offer.lender,
            interestRate: offer.interestRate.toString(),
            durationDays: offer.durationDays.toString(),
            penaltyRate: offer.penaltyRate.toString()
          });
          
          if (offer.active) {
            offersData.push({
              id: i,
              interestRate: offer.interestRate,
              duration: offer.durationDays,
              penaltyRate: offer.penaltyRate,
              lender: offer.lender,
              active: offer.active
            });
            console.log(`Added active offer ${i} from lender: ${offer.lender}`);
          } else {
            console.log(`Offer ${i} is not active, skipping...`);
          }
        } catch (error) {
          console.error(`Error loading offer ${i}:`, error);
          continue;
        }
      }

      console.log('Active offers found:', offersData.length);
      console.log('Offers data:', offersData);

      const grouped = offersData.reduce((acc, offer) => {
        if (!acc[offer.lender]) {
          acc[offer.lender] = [];
        }
        acc[offer.lender].push(offer);
        return acc;
      }, {});

      console.log('Grouped offers by lender:', Object.keys(grouped).map(lender => ({
        lender,
        count: grouped[lender].length
      })));

      setGroupedOffers(grouped);
      setOffers(offersData);
      return true;
    } catch (error) {
      console.error('Error loading offers:', error);
      setError('Failed to load offers: ' + error.message);
      setNotification({
        open: true,
        message: 'Failed to load offers: ' + error.message,
        severity: 'error'
      });
      return false;
    }
  };

  const loadLoans = async () => {
    if (!contract || !account) {
      console.error('Contract or account not initialized');
      return;
    }

    try {
      console.log('Loading loans...');
      const requestCount = await contract.requestCount();
      console.log('Total requests:', requestCount.toString());
      
      const loansData = [];
      for (let i = 0; i < requestCount; i++) {
        try {
          const request = await contract.requests(i);
          const offer = await contract.offers(request.offerId);
          
          if (request.borrower.toLowerCase() === account.toLowerCase()) {
            let status = 0; // Pending
            if (request.approved) {
              status = request.repaid ? 2 : 1; // 2 = Completed, 1 = Active
            }
            
            loansData.push({
              id: i,
              amount: request.amount,
              interestRate: offer.interestRate,
              duration: offer.durationDays,
              status: status,
              startTimestamp: request.startTimestamp,
              transactionHash: request.transactionHash
            });
          }
        } catch (error) {
          console.error(`Error loading loan ${i}:`, error);
          continue;
        }
      }
      
      setLoans(loansData);
      return true;
    } catch (error) {
      console.error('Error loading loans:', error);
      setError('Failed to load loans: ' + error.message);
      setNotification({
        open: true,
        message: 'Failed to load loans: ' + error.message,
        severity: 'error'
      });
      return false;
    }
  };

  const loadData = async () => {
    if (!contract || !account) {
      console.log('Contract or account not initialized:', {
        contract: contract ? 'Available' : 'Not available',
        account: account ? 'Available' : 'Not available'
      });
      setIsLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoading) {
      console.log('Data load already in progress, skipping...');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Starting data load...', {
        contractAddress: await contract.getAddress(),
        account: account
      });

      // Get network information safely
      let networkInfo = 'Not available';
      try {
        const provider = contract.provider || contract.signer?.provider;
        if (provider) {
          const network = await provider.getNetwork();
          networkInfo = {
            chainId: network.chainId,
            name: network.name
          };
        }
      } catch (error) {
        console.warn('Could not get network information:', error);
      }
      
      console.log('Network information:', networkInfo);
      
      const [offersSuccess, loansSuccess] = await Promise.all([
        loadOffers(),
        loadLoans()
      ]);

      console.log('Data load results:', {
        offersSuccess,
        loansSuccess,
        offersCount: offers.length,
        loansCount: loans.length
      });

      if (!offersSuccess || !loansSuccess) {
        setError('Failed to load some data');
      }
      
      console.log('Data load completed');
    } catch (error) {
      console.error('Error in loadData:', error);
      setError('Failed to load dashboard data: ' + error.message);
      setNotification({
        open: true,
        message: 'Failed to load dashboard data: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestLoan = async (offerId, amount, transactionHash) => {
    try {
      // Store transaction in backend with the transaction hash
      await api.createTransaction({
        transactionHash: transactionHash,
        userAddress: account.toLowerCase(),
        type: 'borrow',
        amount: amount.toString(),
        status: 'pending'
      });

      setNotification({
        open: true,
        message: 'Loan requested successfully!',
        severity: 'success'
      });
      loadOffers();
      loadLoans();
    } catch (error) {
      console.error('Error requesting loan:', error);
      setNotification({
        open: true,
        message: 'Failed to request loan: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleRepayLoan = async (loanId) => {
    try {
      // Get loan details
      const loan = loans.find(l => l.id === loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Calculate the total amount to repay
      const amount = BigInt(loan.amount);
      const interestRate = Number(loan.interestRate) / 100;
      const duration = Number(loan.duration);
      const startTimestamp = Number(loan.startTimestamp);
      
      // Calculate interest
      const interest = (amount * BigInt(Math.floor(interestRate * 100))) / 100n;
      let totalAmount = amount + interest;

      // Check if loan is overdue and add penalty if needed
      const currentTime = Math.floor(Date.now() / 1000);
      const endTime = startTimestamp + (duration * 24 * 60 * 60);
      
      if (currentTime > endTime) {
        const penaltyRate = Number(loan.penaltyRate) / 100;
        const penalty = (amount * BigInt(Math.floor(penaltyRate * 100))) / 100n;
        totalAmount += penalty;
      }

      // Send the transaction with the calculated amount
      const tx = await contract.repayLoan(loanId, {
        value: totalAmount
      });
      await tx.wait();

      // Create new transaction record for repayment
      await api.createTransaction({
        transactionHash: tx.hash,
        userAddress: account.toLowerCase(),
        type: 'repay',
        amount: totalAmount.toString(),
        status: 'completed'
      });

      setNotification({
        open: true,
        message: 'Loan repaid successfully!',
        severity: 'success'
      });
      loadLoans();
    } catch (error) {
      console.error('Error repaying loan:', error);
      setNotification({
        open: true,
        message: 'Failed to repay loan: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Load user transactions from backend
  const loadUserTransactions = async () => {
    if (!account) {
      console.log('Waiting for account initialization...');
      return;
    }

    try {
      console.log('Loading user transactions...');
      const transactions = await api.getUserTransactions(account);
      console.log('User transactions loaded:', transactions.length);
    } catch (error) {
      console.error('Error loading user transactions:', error);
    }
  };

  // Update useEffect to load data when contract and account are available
  useEffect(() => {
    let isMounted = true;
    let loadingTimeout;

    const initializeContract = async () => {
      try {
        console.log('Initializing contract...');
        if (!contract || !account || !provider) {
          console.log('Contract, account, or provider not available:', { 
            contract: !!contract, 
            account: !!account,
            provider: !!provider 
          });
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Verify contract is properly initialized
        const contractAddress = await contract.getAddress();
        let networkInfo;
        try {
          networkInfo = await provider.getNetwork();
          console.log('Network info:', networkInfo);
        } catch (error) {
          console.error('Error getting network info:', error);
          networkInfo = { chainId: 0, name: 'unknown' };
        }

        console.log('Contract initialized:', {
          address: contractAddress,
          network: networkInfo,
          account: account
        });

        // Add a small delay to prevent race conditions
        loadingTimeout = setTimeout(async () => {
          if (isMounted) {
            console.log('Loading data...');
            const offersLoaded = await loadOffers();
            const loansLoaded = await loadLoans();
            console.log('Data loaded:', { offersLoaded, loansLoaded });
            
            if (isMounted) {
              setIsLoading(false);
            }
          }
        }, 500);
      } catch (error) {
        console.error('Error in initializeContract:', error);
        if (isMounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    initializeContract();

    return () => {
      isMounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [contract, account, provider]);

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
    return (Number(rate) / 100).toFixed(2) + '%';
  };

  const formatDuration = (duration) => {
    return Number(duration) + ' days';
  };

  const calculateTotalBorrowed = () => {
    // Include all loans (both active and completed) to maintain historical record
    return loans.reduce((total, loan) => {
      // Only include loans that are either active (status 1) or completed (status 2)
      if (loan.status === 1 || loan.status === 2) {
        return total + BigInt(loan.amount);
      }
      return total;
    }, 0n);
  };

  const calculateTotalRepaid = () => {
    // Only include completed loans (status 2)
    return loans.reduce((total, loan) => {
      if (loan.status === 2) {
        return total + BigInt(loan.amount);
      }
      return total;
    }, 0n);
  };

  const calculateTotalInterest = () => {
    // Calculate interest for both active and completed loans
    return loans.reduce((total, loan) => {
      if (loan.status === 1 || loan.status === 2) {
        const interest = (BigInt(loan.amount) * BigInt(loan.interestRate)) / 100n;
        return total + interest;
      }
      return total;
    }, 0n);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Active';
      case 2:
        return 'Repaid';
      default:
        return 'Unknown';
    }
  };

  const getStatusType = (status) => {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'active';
      case 2:
        return 'completed';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <LoadingSpinner message="Loading dashboard data..." />
        </Box>
      ) : (
        <>
          {/* Title Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Borrower Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Manage your loans and explore available offers
            </Typography>
          </Box>

          {/* Summary Statistics Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Loan Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                {/* Active Loans */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      Active Loans
                    </Typography>
                    <Typography variant="h4">
                      {loans.filter(loan => loan.status === 1).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value: {formatAmount(
                        loans
                          .filter(loan => loan.status === 1)
                          .reduce((total, loan) => total + BigInt(loan.amount), 0n)
                      )} ETH
                    </Typography>
                  </Box>
                </Grid>

                {/* Completed Loans */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      Completed Loans
                    </Typography>
                    <Typography variant="h4">
                      {loans.filter(loan => loan.status === 2).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Repaid: {formatAmount(
                        loans
                          .filter(loan => loan.status === 2)
                          .reduce((total, loan) => total + BigInt(loan.amount), 0n)
                      )} ETH
                    </Typography>
                  </Box>
                </Grid>

                {/* Interest Statistics */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      Interest Overview
                    </Typography>
                    <Typography variant="h4">
                      {formatAmount(calculateTotalInterest())} ETH
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Rate: {loans.length > 0 
                        ? (loans.reduce((total, loan) => total + Number(loan.interestRate), 0) / loans.length / 100).toFixed(2) + '%'
                        : '0%'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Performance Metrics */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Repayment Rate</Typography>
                        <Typography variant="h6">
                          {loans.length > 0 
                            ? ((loans.filter(loan => loan.status === 2).length / loans.length) * 100).toFixed(1) + '%'
                            : '0%'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Average Loan Duration</Typography>
                        <Typography variant="h6">
                          {loans.length > 0 
                            ? (loans.reduce((total, loan) => total + Number(loan.duration), 0) / loans.length).toFixed(1) + ' days'
                            : '0 days'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Total Transactions</Typography>
                        <Typography variant="h6">{loans.length}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2">Success Rate</Typography>
                        <Typography variant="h6">
                          {loans.length > 0 
                            ? ((loans.filter(loan => loan.status !== 0).length / loans.length) * 100).toFixed(1) + '%'
                            : '0%'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Total Borrowed (Historical)"
                value={formatAmount(calculateTotalBorrowed())}
                icon={<AccountBalanceIcon />}
                color="#2196f3"
                subtitle={`Active: ${formatAmount(
                  loans.reduce((total, loan) => {
                    if (loan.status === 1) {
                      return total + BigInt(loan.amount);
                    }
                    return total;
                  }, 0n)
                )} ETH`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Total Repaid"
                value={formatAmount(calculateTotalRepaid())}
                icon={<CheckCircleIcon />}
                color="#4caf50"
                subtitle={`Interest: ${formatAmount(calculateTotalInterest())} ETH`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Active Loans"
                value={loans.filter(loan => loan.status === 1).length.toString()}
                icon={<TrendingUpIcon />}
                color="#ff9800"
                subtitle={`Pending: ${loans.filter(loan => loan.status === 0).length}`}
              />
            </Grid>

            {/* Main Content */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Available Offers" />
                    <Tab label="My Loans" />
                    <Tab label="Payment Schedule" />
                  </Tabs>
                </Box>

                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Available Loan Offers
                    </Typography>
                    {Object.entries(groupedOffers).map(([lender, lenderOffers]) => (
                      <Accordion key={lender} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon />
                            <Typography>
                              Lender: {lender.slice(0, 6)}...{lender.slice(-4)}
                            </Typography>
                            <Chip 
                              label={`${lenderOffers.length} offers`} 
                              size="small" 
                              color="primary" 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={2}>
                            {lenderOffers.map((offer) => (
                              <Grid item xs={12} md={6} key={offer.id}>
                                <Card>
                                  <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                      Offer #{offer.id}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                      <Typography>
                                        Interest Rate: {formatInterestRate(offer.interestRate)}
                                      </Typography>
                                      <Typography>
                                        Duration: {formatDuration(offer.duration)}
                                      </Typography>
                                      <Typography>
                                        Penalty Rate: {formatInterestRate(offer.penaltyRate)}
                                      </Typography>
                                    </Box>
                                  </CardContent>
                                  <CardActions>
                                    <Button
                                      variant="contained"
                                      onClick={() => {
                                        setSelectedOffer(offer);
                                        setRequestLoanOpen(true);
                                      }}
                                    >
                                      Request Loan
                                    </Button>
                                  </CardActions>
                                </Card>
                              </Grid>
                            ))}
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                    {Object.keys(groupedOffers).length === 0 && (
                      <Typography color="text.secondary" align="center">
                        No active loan offers available
                      </Typography>
                    )}
                  </Box>
                )}

                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      My Active Loans
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Amount</TableCell>
                            <TableCell>Interest Rate</TableCell>
                            <TableCell>Duration</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell>{formatAmount(loan.amount)} ETH</TableCell>
                              <TableCell>{formatInterestRate(loan.interestRate)}</TableCell>
                              <TableCell>{formatDuration(loan.duration)}</TableCell>
                              <TableCell>
                                <StatusIndicator 
                                  status={getStatusType(loan.status)} 
                                  label={getStatusLabel(loan.status)}
                                />
                              </TableCell>
                              <TableCell>
                                {loan.status === 1 && (
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleRepayLoan(loan.id)}
                                  >
                                    Repay
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {loans.length === 0 && (
                      <Typography color="text.secondary" align="center">
                        No active loans
                      </Typography>
                    )}
                  </Box>
                )}

                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Payment Schedule
                    </Typography>
                    <PaymentSchedule loans={loans} />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Request Loan Dialog */}
          <RequestLoanDialog
            open={requestLoanOpen}
            onClose={() => setRequestLoanOpen(false)}
            offer={selectedOffer}
            onRequestLoan={handleRequestLoan}
          />

          {/* Notification */}
          <Notification
            open={notification.open}
            message={notification.message}
            severity={notification.severity}
            onClose={handleCloseNotification}
          />
        </>
      )}
    </Container>
  );
}

export default BorrowerDashboard; 