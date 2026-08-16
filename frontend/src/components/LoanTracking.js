import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import { ethers } from 'ethers';

const LoanStatusChip = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Defaulted':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getStatusColor(status)}
      size="small"
      sx={{ minWidth: '80px' }}
    />
  );
};

const LoanTracking = ({ loans, userType, onRepayLoan }) => {
  // Categorize loans
  const categorizedLoans = {
    active: loans.filter(loan => loan.status === 'Active'),
    completed: loans.filter(loan => loan.status === 'Completed'),
    defaulted: loans.filter(loan => loan.status === 'Defaulted'),
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'active':
        return 'Active Loans';
      case 'completed':
        return 'Completed Loans';
      case 'defaulted':
        return 'Defaulted Loans';
      default:
        return '';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const calculateEndDate = (startTimestamp, durationDays) => {
    const start = Number(startTimestamp);
    const duration = Number(durationDays);
    return new Date((start + duration * 24 * 60 * 60) * 1000).toLocaleDateString();
  };

  const calculateRepaymentAmount = (loan) => {
    const amount = BigInt(loan.amount);
    const interestRate = BigInt(loan.interestRate);
    const durationDays = BigInt(loan.durationDays);
    const startTimestamp = BigInt(loan.startTimestamp);
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const hundred = BigInt(100);

    // Calculate interest
    const interest = (amount * interestRate) / hundred;
    let total = amount + interest;

    // Check if loan is late
    const endTimestamp = startTimestamp + (durationDays * BigInt(24 * 60 * 60));
    if (currentTimestamp > endTimestamp) {
      const penaltyRate = BigInt(loan.penaltyRate);
      const penalty = (amount * penaltyRate) / hundred;
      total += penalty;
    }

    return total;
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Loan Tracking
      </Typography>
      
      <Grid container spacing={3}>
        {Object.entries(categorizedLoans).map(([category, categoryLoans]) => (
          <Grid item xs={12} key={category}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {getCategoryTitle(category)} ({categoryLoans.length})
                  </Typography>
                  <LoanStatusChip status={getCategoryTitle(category).replace(' Loans', '')} />
                </Box>

                {categoryLoans.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Interest Rate</TableCell>
                          <TableCell>Duration</TableCell>
                          <TableCell>Start Date</TableCell>
                          <TableCell>End Date</TableCell>
                          {userType === 'lender' && <TableCell>Borrower</TableCell>}
                          {userType === 'borrower' && <TableCell>Lender</TableCell>}
                          {userType === 'borrower' && category === 'active' && <TableCell>Repayment Amount</TableCell>}
                          {userType === 'borrower' && category === 'active' && <TableCell>Actions</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryLoans.map((loan) => (
                          <TableRow key={loan.id.toString()}>
                            <TableCell>{loan.id.toString()}</TableCell>
                            <TableCell>{ethers.formatEther(loan.amount)} ETH</TableCell>
                            <TableCell>{loan.interestRate.toString()}%</TableCell>
                            <TableCell>{loan.durationDays.toString()} days</TableCell>
                            <TableCell>{formatTimestamp(loan.startTimestamp)}</TableCell>
                            <TableCell>{calculateEndDate(loan.startTimestamp, loan.durationDays)}</TableCell>
                            {userType === 'lender' && (
                              <TableCell>
                                {loan.borrower.slice(0, 6)}...{loan.borrower.slice(-4)}
                              </TableCell>
                            )}
                            {userType === 'borrower' && (
                              <TableCell>
                                {loan.lender.slice(0, 6)}...{loan.lender.slice(-4)}
                              </TableCell>
                            )}
                            {userType === 'borrower' && category === 'active' && (
                              <TableCell>
                                {ethers.formatEther(calculateRepaymentAmount(loan))} ETH
                              </TableCell>
                            )}
                            {userType === 'borrower' && category === 'active' && !loan.repaid && (
                              <TableCell>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => onRepayLoan(loan.id, calculateRepaymentAmount(loan))}
                                >
                                  Repay
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No loans in this category
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default LoanTracking; 