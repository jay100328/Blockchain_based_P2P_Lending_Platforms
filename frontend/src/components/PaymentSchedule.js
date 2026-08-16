import { useState } from 'react';
import { ethers } from 'ethers';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Info as InfoIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const PaymentSchedule = ({ loans }) => {
  const calculatePaymentDetails = (loan) => {
    if (!loan || !loan.amount || !loan.interestRate || !loan.duration || !loan.startTimestamp) {
      return null;
    }

    try {
      const amount = Number(ethers.formatEther(loan.amount));
      const interestRate = Number(loan.interestRate) / 100;
      const startDate = new Date(Number(loan.startTimestamp) * 1000);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(loan.duration));
      
      const totalAmount = amount * (1 + interestRate);
      const interestAmount = totalAmount - amount;
      
      return {
        startDate: startDate.toLocaleDateString(),
        endDate: endDate.toLocaleDateString(),
        principal: amount,
        interest: interestAmount,
        total: totalAmount
      };
    } catch (error) {
      console.error('Error calculating payment details:', error);
      return null;
    }
  };

  if (!loans || loans.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Payment Schedule
        </Typography>
        <Typography color="text.secondary" align="center">
          No active loans to display payment schedule
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Payment Schedule
      </Typography>
      {loans.map((loan, index) => {
        const paymentDetails = calculatePaymentDetails(loan);
        if (!paymentDetails) return null;

        return (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>Loan #{loan.id}</Typography>
                <Chip
                  label={`Amount: ${ethers.formatEther(loan.amount)} ETH`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    label={`Principal: ${paymentDetails.principal.toFixed(4)} ETH`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Interest: ${paymentDetails.interest.toFixed(4)} ETH`}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Total: ${paymentDetails.total.toFixed(4)} ETH`}
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    label={`Start Date: ${paymentDetails.startDate}`}
                    variant="outlined"
                  />
                  <Chip
                    label={`Due Date: ${paymentDetails.endDate}`}
                    variant="outlined"
                  />
                </Box>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Principal</TableCell>
                      <TableCell align="right">{paymentDetails.principal.toFixed(4)} ETH</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Interest</TableCell>
                      <TableCell align="right">{paymentDetails.interest.toFixed(4)} ETH</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Total Payment Due</strong></TableCell>
                      <TableCell align="right"><strong>{paymentDetails.total.toFixed(4)} ETH</strong></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

export default PaymentSchedule; 