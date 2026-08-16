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

const CreateOfferDialog = ({ open, onClose, onCreateOffer }) => {
  const { contract } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    interestRate: '',
    duration: '',
    penaltyRate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!formData.interestRate || !formData.duration || !formData.penaltyRate) {
        throw new Error('Please fill in all fields');
      }

      const interestRate = ethers.parseUnits(formData.interestRate, 0);
      const duration = ethers.parseUnits(formData.duration, 0);
      const penaltyRate = ethers.parseUnits(formData.penaltyRate, 0);

      console.log('Creating offer with:', { interestRate, duration, penaltyRate }); // Debug log

      const tx = await contract.createOffer(
        interestRate,
        duration,
        penaltyRate
      );
      
      console.log('Transaction sent:', tx.hash); // Debug log
      await tx.wait();
      console.log('Transaction confirmed'); // Debug log

      onCreateOffer(tx.hash);
      onClose();
      setFormData({
        interestRate: '',
        duration: '',
        penaltyRate: '',
      });
    } catch (error) {
      console.error('Error creating offer:', error); // Debug log
      setError(error.message || 'Failed to create offer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create New Loan Offer</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              label="Interest Rate (%)"
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              required
              fullWidth
              helperText="Annual interest rate for the loan"
              disabled={isLoading}
            />
            <TextField
              label="Duration (days)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              required
              fullWidth
              helperText="Loan duration in days"
              disabled={isLoading}
            />
            <TextField
              label="Penalty Rate (%)"
              name="penaltyRate"
              type="number"
              value={formData.penaltyRate}
              onChange={handleChange}
              required
              fullWidth
              helperText="Penalty rate for late payments"
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
              <LoadingSpinner size={24} message="Creating..." variant="inline" />
            ) : (
              'Create Offer'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateOfferDialog; 