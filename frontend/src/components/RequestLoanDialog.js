import { useState } from 'react';
import { ethers } from 'ethers';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useWeb3 } from '../context/Web3Context';
import LoadingSpinner from './LoadingSpinner';

const RequestLoanDialog = ({ open, onClose, offer, onRequestLoan }) => {
  const { contract, provider } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');

  const handleChange = (e) => {
    const { value } = e.target;
    setAmount(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offer) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Validate amount
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Convert amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Request the loan
      const tx = await contract.requestLoan(offer.id, amountWei);
      await tx.wait();

      onRequestLoan(offer.id, amountWei, tx.hash);
      onClose();
      setAmount('');
    } catch (error) {
      setError(error.message || 'Failed to request loan');
    } finally {
      setIsLoading(false);
    }
  };

  if (!offer) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Request Loan</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body1" gutterBottom>
              Offer Details:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography>Interest Rate: {(Number(offer.interestRate) / 100).toFixed(2)}%</Typography>
              <Typography>Duration: {Number(offer.duration)} days</Typography>
              <Typography>Penalty Rate: {(Number(offer.penaltyRate) / 100).toFixed(2)}%</Typography>
            </Box>

            <TextField
              label="Amount (ETH)"
              name="amount"
              type="number"
              value={amount}
              onChange={handleChange}
              required
              fullWidth
              helperText="Enter the amount you want to borrow"
              disabled={isLoading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size={24} message="Requesting..." variant="inline" />
            ) : (
              'Request Loan'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RequestLoanDialog; 