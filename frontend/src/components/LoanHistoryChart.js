import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { ethers } from 'ethers';

const LoanHistoryChart = ({ loans }) => {
  // Process loan data for the chart
  const chartData = loans
    .filter(loan => loan.status === 2) // Only completed loans
    .map(loan => {
      const amount = Number(ethers.formatEther(loan.amount));
      const interestRate = Number(loan.interestRate) / 100;
      return {
        id: loan.id.toString(),
        amount: amount,
        interestRate: interestRate,
        duration: Number(loan.duration),
        totalRepayment: amount * (1 + interestRate),
      };
    })
    .sort((a, b) => Number(a.id) - Number(b.id));

  return (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Loan History
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="id" label={{ value: 'Loan ID', position: 'bottom' }} />
          <YAxis yAxisId="left" label={{ value: 'Amount (ETH)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Interest Rate (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="amount"
            name="Borrowed Amount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="interestRate"
            name="Interest Rate"
            stroke="#82ca9d"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default LoanHistoryChart; 