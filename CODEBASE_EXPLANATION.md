# P2P Lending Platform - Codebase Explanation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Smart Contract Architecture](#smart-contract-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Database Structure](#database-structure)
6. [Integration Points](#integration-points)

## Project Overview

The P2P Lending Platform is a decentralized application (DApp) that enables peer-to-peer lending and borrowing of cryptocurrency (ETH) through smart contracts. The platform consists of three main components:

1. **Smart Contracts**: Written in Solidity, handling the core lending logic
2. **Frontend**: React-based web application for user interaction
3. **Backend**: Node.js server for storing transaction history and user data

## Smart Contract Architecture

### Core Contract: P2PLending.sol

The main smart contract (`P2PLending.sol`) implements the core lending functionality. Let's break down its components:

#### Data Structures

```solidity
struct Offer {
    address lender;
    uint256 interestRate;  // in percentage (e.g., 5 for 5%)
    uint256 durationDays;
    uint256 penaltyRate;   // in percentage
    bool active;
}

struct Request {
    address borrower;
    uint256 amount;
    uint256 offerId;
    bool approved;
}

struct Loan {
    address borrower;
    address lender;
    uint256 amount;
    uint256 interestRate;
    uint256 startTime;
    uint256 endTime;
    uint256 penaltyRate;
    bool repaid;
}
```

These structs define the core data models:
- `Offer`: Represents a lending offer created by a lender
- `Request`: Represents a loan request made by a borrower
- `Loan`: Represents an active loan after approval

#### State Variables

```solidity
mapping(uint256 => Offer) public offers;
mapping(uint256 => Request) public requests;
mapping(uint256 => Loan) public loans;
uint256 public offerCount;
uint256 public requestCount;
uint256 public loanCount;
```

The contract uses mappings to store:
- All lending offers
- All loan requests
- All active loans
- Counters to track the number of each type

#### Events

```solidity
event OfferCreated(uint256 indexed offerId, address indexed lender);
event RequestCreated(uint256 indexed requestId, address indexed borrower);
event LoanApproved(uint256 indexed loanId, address indexed borrower, address indexed lender);
event PaymentMade(uint256 indexed loanId, uint256 amount);
event LoanRepaid(uint256 indexed loanId);
```

Events are emitted for important state changes:
- When a new offer is created
- When a new request is made
- When a loan is approved
- When a payment is made
- When a loan is fully repaid

### Core Functions

#### 1. Offer Creation

```solidity
function createOffer(
    uint256 _interestRate,
    uint256 _durationDays,
    uint256 _penaltyRate
) public {
    require(_interestRate > 0, "Interest rate must be positive");
    require(_durationDays > 0, "Duration must be positive");
    require(_penaltyRate > 0, "Penalty rate must be positive");

    uint256 offerId = offerCount++;
    offers[offerId] = Offer({
        lender: msg.sender,
        interestRate: _interestRate,
        durationDays: _durationDays,
        penaltyRate: _penaltyRate,
        active: true
    });

    emit OfferCreated(offerId, msg.sender);
}
```

This function allows lenders to create new lending offers with:
- Interest rate (percentage)
- Duration (in days)
- Penalty rate (percentage)

Key features:
- Validates input parameters
- Increments offer counter
- Stores offer in mapping
- Emits event for frontend tracking

#### 2. Request Creation

```solidity
function createRequest(uint256 _offerId, uint256 _amount) public {
    require(_offerId < offerCount, "Invalid offer ID");
    require(_amount > 0, "Amount must be positive");
    
    Offer storage offer = offers[_offerId];
    require(offer.active, "Offer is not active");
    require(offer.lender != msg.sender, "Cannot request own offer");

    uint256 requestId = requestCount++;
    requests[requestId] = Request({
        borrower: msg.sender,
        amount: _amount,
        offerId: _offerId,
        approved: false
    });

    emit RequestCreated(requestId, msg.sender);
}
```

This function allows borrowers to request loans against existing offers with:
- Offer ID (reference to existing offer)
- Amount to borrow

Key features:
- Validates offer existence and status
- Prevents self-borrowing
- Creates new request record
- Emits event for tracking

#### 3. Loan Approval

```solidity
function approveLoan(uint256 _requestId) public payable {
    require(_requestId < requestCount, "Invalid request ID");
    
    Request storage request = requests[_requestId];
    Offer storage offer = offers[request.offerId];
    
    require(offer.lender == msg.sender, "Only lender can approve");
    require(!request.approved, "Request already approved");
    require(msg.value == request.amount, "Incorrect amount sent");

    // Create loan
    uint256 loanId = loanCount++;
    loans[loanId] = Loan({
        borrower: request.borrower,
        lender: msg.sender,
        amount: request.amount,
        interestRate: offer.interestRate,
        startTime: block.timestamp,
        endTime: block.timestamp + (offer.durationDays * 1 days),
        penaltyRate: offer.penaltyRate,
        repaid: false
    });

    // Mark request as approved
    request.approved = true;

    // Transfer funds to borrower
    payable(request.borrower).transfer(request.amount);

    emit LoanApproved(loanId, request.borrower, msg.sender);
}
```

This function allows lenders to approve loan requests with:
- Request ID (reference to existing request)
- Exact amount of ETH to be sent

Key features:
- Validates request existence and status
- Ensures only lender can approve
- Creates new loan record
- Transfers funds to borrower
- Emits event for tracking

#### 4. Payment Processing

```solidity
function makePayment(uint256 _loanId) public payable {
    require(_loanId < loanCount, "Invalid loan ID");
    
    Loan storage loan = loans[_loanId];
    require(!loan.repaid, "Loan already repaid");
    require(msg.sender == loan.borrower, "Only borrower can make payments");

    uint256 totalAmount = calculateTotalAmount(_loanId);
    require(msg.value >= totalAmount, "Insufficient payment");

    // Transfer payment to lender
    payable(loan.lender).transfer(msg.value);

    // Mark loan as repaid
    loan.repaid = true;

    emit PaymentMade(_loanId, msg.value);
    emit LoanRepaid(_loanId);
}
```

This function allows borrowers to repay their loans with:
- Loan ID (reference to existing loan)
- Payment amount (must cover total amount due)

Key features:
- Validates loan existence and status
- Ensures only borrower can make payments
- Calculates total amount due
- Transfers payment to lender
- Marks loan as repaid
- Emits events for tracking

#### 5. Amount Calculation

```solidity
function calculateTotalAmount(uint256 _loanId) public view returns (uint256) {
    require(_loanId < loanCount, "Invalid loan ID");
    
    Loan storage loan = loans[_loanId];
    uint256 principal = loan.amount;
    uint256 interest = (principal * loan.interestRate) / 100;
    
    if (block.timestamp > loan.endTime) {
        uint256 daysLate = (block.timestamp - loan.endTime) / 1 days;
        uint256 penalty = (principal * loan.penaltyRate * daysLate) / 100;
        return principal + interest + penalty;
    }
    
    return principal + interest;
}
```

This function calculates the total amount due for a loan:
- Principal amount
- Interest (based on interest rate)
- Penalty (if late, based on penalty rate and days late)

Key features:
- Validates loan existence
- Calculates interest
- Calculates penalty if late
- Returns total amount due

#### 6. View Functions

```solidity
function getOffer(uint256 _offerId) public view returns (
    address lender,
    uint256 interestRate,
    uint256 durationDays,
    uint256 penaltyRate,
    bool active
) {
    require(_offerId < offerCount, "Invalid offer ID");
    Offer storage offer = offers[_offerId];
    return (
        offer.lender,
        offer.interestRate,
        offer.durationDays,
        offer.penaltyRate,
        offer.active
    );
}

function getLoan(uint256 _loanId) public view returns (
    address borrower,
    address lender,
    uint256 amount,
    uint256 interestRate,
    uint256 startTime,
    uint256 endTime,
    uint256 penaltyRate,
    bool repaid
) {
    require(_loanId < loanCount, "Invalid loan ID");
    Loan storage loan = loans[_loanId];
    return (
        loan.borrower,
        loan.lender,
        loan.amount,
        loan.interestRate,
        loan.startTime,
        loan.endTime,
        loan.penaltyRate,
        loan.repaid
    );
}
```

These functions provide read-only access to:
- Offer details
- Loan details

Key features:
- Validate ID existence
- Return all relevant fields
- No state modification

## Frontend Architecture

### Web3 Context

The frontend uses a Web3 context to manage blockchain interactions:

```javascript
// frontend/src/context/Web3Context.js
import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import P2PLending from '../contracts/P2PLending.json';

const Web3Context = createContext();

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeWeb3 = async () => {
            if (window.ethereum) {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const contractAddress = getContractAddress();
                    
                    const lendingContract = new ethers.Contract(
                        contractAddress,
                        P2PLending.abi,
                        signer
                    );

                    setContract(lendingContract);
                    setAccount(await signer.getAddress());
                } catch (error) {
                    console.error('Error initializing Web3:', error);
                }
            }
            setLoading(false);
        };

        initializeWeb3();
    }, []);

    return (
        <Web3Context.Provider value={{ account, contract, loading }}>
            {children}
        </Web3Context.Provider>
    );
}
```

Key features:
- Manages Web3 provider and contract instance
- Handles account connection
- Provides context to all components
- Handles network changes

### Frontend Components

#### 1. Borrower Dashboard

```javascript
// frontend/src/pages/BorrowerDashboard.js
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';

function BorrowerDashboard() {
    const { account, contract } = useWeb3();
    const [offers, setOffers] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load available offers
    const loadOffers = async () => {
        try {
            const offerCount = await contract.offerCount();
            const offersData = [];
            
            for (let i = 0; i < offerCount; i++) {
                const offer = await contract.offers(i);
                if (offer.active && offer.lender.toLowerCase() !== account.toLowerCase()) {
                    offersData.push({
                        id: i,
                        lender: offer.lender,
                        interestRate: offer.interestRate,
                        duration: offer.durationDays,
                        penaltyRate: offer.penaltyRate
                    });
                }
            }
            setOffers(offersData);
        } catch (error) {
            console.error('Error loading offers:', error);
        }
    };

    // Load user's loans
    const loadLoans = async () => {
        try {
            const loanCount = await contract.loanCount();
            const loansData = [];
            
            for (let i = 0; i < loanCount; i++) {
                const loan = await contract.loans(i);
                if (loan.borrower.toLowerCase() === account.toLowerCase()) {
                    loansData.push({
                        id: i,
                        lender: loan.lender,
                        amount: loan.amount,
                        interestRate: loan.interestRate,
                        startTime: loan.startTime,
                        endTime: loan.endTime,
                        penaltyRate: loan.penaltyRate,
                        repaid: loan.repaid
                    });
                }
            }
            setLoans(loansData);
        } catch (error) {
            console.error('Error loading loans:', error);
        }
    };

    // Request a loan
    const handleRequestLoan = async (offerId, amount) => {
        try {
            const tx = await contract.createRequest(offerId, amount);
            await tx.wait();

            // Store in backend
            await api.createTransaction({
                transactionHash: tx.hash,
                userAddress: account,
                type: 'request',
                amount: amount.toString(),
                status: 'pending'
            });

            // Reload data
            await loadOffers();
        } catch (error) {
            console.error('Error requesting loan:', error);
        }
    };

    // Make a payment
    const handleMakePayment = async (loanId) => {
        try {
            const totalAmount = await contract.calculateTotalAmount(loanId);
            const tx = await contract.makePayment(loanId, { value: totalAmount });
            await tx.wait();

            // Store in backend
            await api.createTransaction({
                transactionHash: tx.hash,
                userAddress: account,
                type: 'payment',
                amount: totalAmount.toString(),
                status: 'completed'
            });

            // Reload data
            await loadLoans();
        } catch (error) {
            console.error('Error making payment:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await loadOffers();
            await loadLoans();
            setLoading(false);
        };

        if (contract && account) {
            loadData();
        }
    }, [contract, account]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {loading ? (
                <LoadingSpinner message="Loading dashboard data..." />
            ) : (
                <>
                    <Typography variant="h4" gutterBottom>
                        Borrower Dashboard
                    </Typography>
                    
                    {/* Available Offers Section */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Available Offers
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Lender</TableCell>
                                        <TableCell>Interest Rate</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {offers.map((offer) => (
                                        <TableRow key={offer.id}>
                                            <TableCell>
                                                {offer.lender.slice(0, 6)}...{offer.lender.slice(-4)}
                                            </TableCell>
                                            <TableCell>{offer.interestRate}%</TableCell>
                                            <TableCell>{offer.duration} days</TableCell>
                                            <TableCell>
                                                <RequestLoanDialog
                                                    offerId={offer.id}
                                                    onRequest={handleRequestLoan}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Active Loans Section */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            My Loans
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Lender</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Due Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loans.map((loan) => (
                                        <TableRow key={loan.id}>
                                            <TableCell>
                                                {loan.lender.slice(0, 6)}...{loan.lender.slice(-4)}
                                            </TableCell>
                                            <TableCell>{formatAmount(loan.amount)} ETH</TableCell>
                                            <TableCell>
                                                {new Date(loan.endTime * 1000).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <StatusIndicator 
                                                    status={loan.repaid ? 'completed' : 'active'} 
                                                    label={loan.repaid ? 'Repaid' : 'Active'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {!loan.repaid && (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleMakePayment(loan.id)}
                                                    >
                                                        Make Payment
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Container>
    );
}

Key features:
- Displays available lending offers
- Shows user's active loans
- Handles loan requests
- Manages loan payments
- Integrates with backend for transaction history

#### 2. Lender Dashboard

```javascript
// frontend/src/pages/LenderDashboard.js
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';

function LenderDashboard() {
    const { account, contract } = useWeb3();
    const [offers, setOffers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load lender's offers
    const loadOffers = async () => {
        try {
            const offerCount = await contract.offerCount();
            const offersData = [];
            
            for (let i = 0; i < offerCount; i++) {
                const offer = await contract.offers(i);
                if (offer.lender.toLowerCase() === account.toLowerCase()) {
                    offersData.push({
                        id: i,
                        interestRate: offer.interestRate,
                        duration: offer.durationDays,
                        penaltyRate: offer.penaltyRate,
                        active: offer.active
                    });
                }
            }
            setOffers(offersData);
        } catch (error) {
            console.error('Error loading offers:', error);
        }
    };

    // Load pending requests
    const loadRequests = async () => {
        try {
            const requestCount = await contract.requestCount();
            const requestsData = [];
            
            for (let i = 0; i < requestCount; i++) {
                const request = await contract.requests(i);
                const offer = await contract.offers(request.offerId);
                
                if (offer.lender.toLowerCase() === account.toLowerCase() && !request.approved) {
                    requestsData.push({
                        id: i,
                        borrower: request.borrower,
                        amount: request.amount,
                        offerId: request.offerId
                    });
                }
            }
            setRequests(requestsData);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    // Create new offer
    const handleCreateOffer = async (data) => {
        try {
            const tx = await contract.createOffer(
                data.interestRate,
                data.duration,
                data.penaltyRate
            );
            await tx.wait();

            // Store in backend
            await api.createTransaction({
                transactionHash: tx.hash,
                userAddress: account,
                type: 'offer',
                amount: '0',
                status: 'completed'
            });

            // Reload offers
            await loadOffers();
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    // Approve loan request
    const handleApproveLoan = async (requestId) => {
        try {
            const request = await contract.requests(requestId);
            const tx = await contract.approveLoan(requestId, { value: request.amount });
            await tx.wait();

            // Store in backend
            await api.createTransaction({
                transactionHash: tx.hash,
                userAddress: account,
                type: 'approve',
                amount: request.amount.toString(),
                status: 'completed'
            });

            // Reload data
            await loadRequests();
        } catch (error) {
            console.error('Error approving loan:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await loadOffers();
            await loadRequests();
            setLoading(false);
        };

        if (contract && account) {
            loadData();
        }
    }, [contract, account]);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {loading ? (
                <LoadingSpinner message="Loading dashboard data..." />
            ) : (
                <>
                    <Typography variant="h4" gutterBottom>
                        Lender Dashboard
                    </Typography>
                    
                    {/* Offers Section */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            My Offers
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Interest Rate</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Penalty Rate</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {offers.map((offer) => (
                                        <TableRow key={offer.id}>
                                            <TableCell>{offer.interestRate}%</TableCell>
                                            <TableCell>{offer.duration} days</TableCell>
                                            <TableCell>{offer.penaltyRate}%</TableCell>
                                            <TableCell>
                                                <StatusIndicator 
                                                    status={offer.active ? 'active' : 'inactive'} 
                                                    label={offer.active ? 'Active' : 'Inactive'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2 }}>
                            <CreateOfferDialog onCreate={handleCreateOffer} />
                        </Box>
                    </Paper>

                    {/* Pending Requests Section */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Pending Requests
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Borrower</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {requests.map((request) => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                {request.borrower.slice(0, 6)}...{request.borrower.slice(-4)}
                                            </TableCell>
                                            <TableCell>{formatAmount(request.amount)} ETH</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleApproveLoan(request.id)}
                                                >
                                                    Approve
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Container>
    );
}

Key features:
- Manages lending offers
- Handles loan requests
- Creates new offers
- Approves loan requests
- Integrates with backend for transaction history

### Dialog Components

#### 1. CreateOfferDialog

```javascript
// frontend/src/components/CreateOfferDialog.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';

function CreateOfferDialog({ open, onClose, onCreate }) {
    const [formData, setFormData] = useState({
        interestRate: '',
        duration: '',
        penaltyRate: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate({
            interestRate: Number(formData.interestRate),
            duration: Number(formData.duration),
            penaltyRate: Number(formData.penaltyRate)
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create Lending Offer</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Interest Rate (%)"
                            type="number"
                            value={formData.interestRate}
                            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                            required
                        />
                        <TextField
                            label="Duration (days)"
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                            required
                        />
                        <TextField
                            label="Penalty Rate (%)"
                            type="number"
                            value={formData.penaltyRate}
                            onChange={(e) => setFormData({ ...formData, penaltyRate: e.target.value })}
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Create Offer
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
```

Key features:
- Form for creating new lending offers
- Input validation
- Material-UI components
- Handles form submission

#### 2. RequestLoanDialog

```javascript
// frontend/src/components/RequestLoanDialog.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';

function RequestLoanDialog({ open, onClose, onRequest, offerId }) {
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onRequest(offerId, ethers.utils.parseEther(amount));
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Request Loan</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Amount (ETH)"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Request Loan
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
```

Key features:
- Form for requesting loans
- ETH amount input
- Material-UI components
- Handles form submission

### Additional Frontend Components

#### 1. StatusIndicator

```javascript
// frontend/src/components/StatusIndicator.js
import React from 'react';
import { Chip } from '@mui/material';

function StatusIndicator({ status, label }) {
    const getColor = () => {
        switch (status) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'error';
            case 'completed':
                return 'info';
            case 'pending':
                return 'warning';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            label={label}
            color={getColor()}
            size="small"
        />
    );
}

export default StatusIndicator;
```

Key features:
- Visual status indicators
- Color-coded statuses
- Material-UI Chip component
- Customizable labels

#### 2. LoadingSpinner

```javascript
// frontend/src/components/LoadingSpinner.js
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingSpinner({ message }) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
            }}
        >
            <CircularProgress />
            {message && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                    {message}
                </Typography>
            )}
        </Box>
    );
}

export default LoadingSpinner;
```

Key features:
- Centered loading indicator
- Optional message display
- Material-UI components
- Responsive layout

## Environment Configuration

### Frontend Environment

```javascript
// frontend/.env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_ID=1337
```

### Backend Environment

```javascript
// backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/p2plending
NODE_ENV=development
```

### Smart Contract Configuration

```javascript
// hardhat.config.js
require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
    solidity: "0.8.0",
    networks: {
        hardhat: {
            chainId: 1337
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    }
};
```

## Testing Setup

### Smart Contract Tests

```javascript
// test/P2PLending.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("P2PLending", function () {
    let P2PLending;
    let lending;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        P2PLending = await ethers.getContractFactory("P2PLending");
        lending = await P2PLending.deploy();
        await lending.deployed();
    });

    describe("Offer Creation", function () {
        it("Should create a new offer", async function () {
            await lending.createOffer(5, 30, 2);
            const offer = await lending.offers(0);
            expect(offer.lender).to.equal(owner.address);
            expect(offer.interestRate).to.equal(5);
            expect(offer.durationDays).to.equal(30);
            expect(offer.penaltyRate).to.equal(2);
            expect(offer.active).to.equal(true);
        });
    });

    describe("Loan Request", function () {
        it("Should create a loan request", async function () {
            await lending.createOffer(5, 30, 2);
            await lending.connect(addr1).createRequest(0, ethers.utils.parseEther("1.0"));
            const request = await lending.requests(0);
            expect(request.borrower).to.equal(addr1.address);
            expect(request.amount).to.equal(ethers.utils.parseEther("1.0"));
            expect(request.approved).to.equal(false);
        });
    });
});
```

### Frontend Tests

```javascript
// frontend/src/components/__tests__/StatusIndicator.test.js
import { render, screen } from '@testing-library/react';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
    it('renders with correct color for active status', () => {
        render(<StatusIndicator status="active" label="Active" />);
        const chip = screen.getByText('Active');
        expect(chip).toHaveClass('MuiChip-colorSuccess');
    });

    it('renders with correct color for inactive status', () => {
        render(<StatusIndicator status="inactive" label="Inactive" />);
        const chip = screen.getByText('Inactive');
        expect(chip).toHaveClass('MuiChip-colorError');
    });
});
```

### Backend Tests

```javascript
// backend/tests/transactions.test.js
const request = require('supertest');
const app = require('../server');
const Transaction = require('../models/Transaction');

describe('Transaction API', () => {
    beforeEach(async () => {
        await Transaction.deleteMany({});
    });

    it('should create a new transaction', async () => {
        const res = await request(app)
            .post('/api/transactions')
            .send({
                transactionHash: '0x123',
                userAddress: '0xabc',
                type: 'offer',
                amount: '1.0',
                status: 'completed'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.transactionHash).toBe('0x123');
    });

    it('should get user transactions', async () => {
        await Transaction.create({
            transactionHash: '0x123',
            userAddress: '0xabc',
            type: 'offer',
            amount: '1.0',
            status: 'completed'
        });

        const res = await request(app)
            .get('/api/transactions/user/0xabc');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(1);
    });
});
```

## Deployment Configuration

### Smart Contract Deployment

```javascript
// scripts/deploy.js
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const P2PLending = await ethers.getContractFactory("P2PLending");
    const lending = await P2PLending.deploy();
    await lending.deployed();

    console.log("P2PLending deployed to:", lending.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### Frontend Deployment

```javascript
// frontend/package.json
{
    "scripts": {
        "start": "react-scripts start",
        "build": "react-scripts build",
        "test": "react-scripts test",
        "eject": "react-scripts eject",
        "deploy": "npm run build && firebase deploy"
    }
}
```

### Backend Deployment

```javascript
// backend/package.json
{
    "scripts": {
        "start": "node server.js",
        "dev": "nodemon server.js",
        "test": "jest",
        "deploy": "pm2 start server.js --name p2plending"
    }
}
```

### Environment Variables for Production

```javascript
// frontend/.env.production
REACT_APP_API_URL=https://api.p2plending.com
REACT_APP_CONTRACT_ADDRESS=0x123...
REACT_APP_NETWORK_ID=1

// backend/.env.production
PORT=80
MONGODB_URI=mongodb+srv://...
NODE_ENV=production
```

Key deployment features:
1. Smart Contract:
   - Hardhat deployment scripts
   - Network configuration
   - Contract verification

2. Frontend:
   - Production build
   - Environment configuration
   - Deployment scripts

3. Backend:
   - PM2 process management
   - Production environment
   - Database configuration

4. Environment:
   - Production variables
   - Security considerations
   - Network settings

[End of documentation] 