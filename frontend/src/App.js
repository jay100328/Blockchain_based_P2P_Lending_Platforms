import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import { Web3Provider } from './context/Web3Context';

// Import pageszzzzzzzzzzzzzzzzz
import Home from './pages/Home';
import BorrowerDashboard from './pages/BorrowerDashboard';
import LenderDashboard from './pages/LenderDashboard';

function App() {
  return (
    <Web3Provider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_startTransition: true }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/borrower" element={<BorrowerDashboard />} />
              <Route path="/lender" element={<LenderDashboard />} />
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </Web3Provider>
  );
}

export default App;
