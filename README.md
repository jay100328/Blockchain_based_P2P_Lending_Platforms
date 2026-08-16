# P2P Lending Platform

A full-stack **decentralized peer-to-peer lending dApp** built on Ethereum. Lenders create loan offers on-chain; borrowers request and repay loans through MetaMask. An Express + MongoDB backend stores off-chain transaction history and user metadata for a richer UI experience.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start (Sepolia Testnet)](#quick-start-sepolia-testnet)
- [Local Development (Hardhat)](#local-development-hardhat)
- [Environment Variables](#environment-variables)
- [Smart Contract Overview](#smart-contract-overview)
- [API Reference](#api-reference)
- [User Flows](#user-flows)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [What Not to Commit to GitHub](#what-not-to-commit-to-github)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Features

### For Lenders
- Create loan offers with custom interest rate, duration, and late penalty
- View and manage active offers
- Approve borrower requests and fund loans on-chain
- Track lending history via the backend

### For Borrowers
- Browse available loan offers grouped by lender
- Request loans against active offers
- Repay loans with automatic interest (+ penalty if overdue)
- View loan history, payment schedules, and charts

### Platform
- MetaMask wallet integration (ethers.js v6)
- Role-based dashboards (Lender / Borrower)
- Loading states, error handling, and toast notifications
- Hybrid on-chain / off-chain architecture
- Deployable to **Hardhat local network** or **Ethereum Sepolia testnet**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│              React Frontend (localhost:3000)                │
│         MetaMask  │  Material UI  │  ethers.js              │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
         │ On-chain txs                  │ REST API
         ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Ethereum Network   │         │  Express Backend    │
│  P2PLending.sol     │         │  (localhost:5000)   │
│  (Sepolia / Hardhat)│         └──────────┬──────────┘
└─────────────────────┘                    │
                                           ▼
                                  ┌─────────────────────┐
                                  │      MongoDB        │
                                  │  users, transactions│
                                  └─────────────────────┘
```

| Layer | Responsibility |
|-------|----------------|
| **Smart Contract** | Source of truth for loan offers, approvals, repayments, and ETH transfers |
| **Frontend** | UI, wallet connection, blockchain reads/writes, backend API calls |
| **Backend** | Off-chain transaction history, user profiles, status tracking |

> **Important:** End users never interact with the backend directly. They use the React frontend, which calls the backend API internally.

---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Blockchain | Solidity 0.8.21, Hardhat, ethers.js v6 |
| Frontend | React 18, Material UI, React Router |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB |
| Wallet | MetaMask |

---

## Project Structure

```
p2p/
├── contracts/
│   └── P2PLending.sol           # Main lending smart contract
├── scripts/
│   └── deploy.js                # Contract deployment script
├── backend/
│   ├── server.js                # Express entry point
│   ├── routes/
│   │   ├── transactions.js      # Transaction CRUD routes
│   │   └── users.js             # User registration routes
│   ├── models/
│   │   ├── transaction.js       # Transaction schema
│   │   └── User.js              # User schema
│   ├── utils/
│   │   └── dateUtils.js         # IST timestamp formatting
│   └── .env.example             # Backend env template
├── frontend/
│   ├── src/
│   │   ├── App.js               # Routes and providers
│   │   ├── context/
│   │   │   └── Web3Context.js   # MetaMask + contract setup
│   │   ├── services/
│   │   │   └── api.js           # Backend API client
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── LenderDashboard.js
│   │   │   └── BorrowerDashboard.js
│   │   ├── components/          # Dialogs, charts, layout, etc.
│   │   └── contracts/
│   │       └── P2PLending.json  # Contract ABI (copied from artifacts)
│   └── .env.example             # Frontend env template
├── docs/
│   ├── API.md                   # Full REST API documentation
│   └── SMART_CONTRACT.md        # Smart contract reference
├── hardhat.config.js            # Hardhat networks (local, Sepolia)
├── copy-artifacts.js            # Copies ABI to frontend
├── .env.example                 # Hardhat deploy env template
├── .gitignore
└── README.md
```

---

## Prerequisites

Install the following before running the project:

| Tool | Version | Link |
|------|---------|------|
| Node.js | 18+ | https://nodejs.org/ |
| npm | 9+ | Included with Node.js |
| MongoDB | Latest | https://www.mongodb.com/try/download/community |
| MetaMask | Browser extension | https://metamask.io/ |
| Git | Latest | https://git-scm.com/ |

Verify installations:

```bash
node -v
npm -v
mongod --version
```

---

## Quick Start (Sepolia Testnet)

Use this path if you **already deployed** the contract to Sepolia (e.g. via Infura).

### Step 1: Clone and install

```bash
git clone <your-repo-url>
cd p2p

npm install
cd frontend && npm install && cd ..
```

### Step 2: Configure environment files

Copy the example env files and fill in your values:

```bash
# Root — only needed if redeploying the contract
cp .env.example .env

# Backend — required to run the API
cp backend/.env.example backend/.env

# Frontend — required to connect to your deployed contract
cp frontend/.env.example frontend/.env
```

**`backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/p2plending
```

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=<your_sepolia_contract_address>
REACT_APP_NETWORK_ID=11155111
```

> Do **not** put `PRIVATE_KEY` in `frontend/.env`. Private keys belong only in the root `.env` for Hardhat deployment.

### Step 3: Start MongoDB

```bash
mongod
```

Or start MongoDB as a Windows service / via MongoDB Compass.

**Docker alternative:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Start the backend (Terminal 1)

```bash
npm run start:backend
```

Expected output:
```
Connected to MongoDB
Server is running on port: 5000
```

### Step 5: Start the frontend (Terminal 2)

```bash
npm run start:frontend
```

Open **http://localhost:3000**

### Step 6: Configure MetaMask

1. Switch to **Sepolia Test Network** (Chain ID: `11155111`)
2. Ensure your wallet has **Sepolia ETH** ([Sepolia faucet](https://sepoliafaucet.com/))
3. Click **Connect MetaMask** on the home page

### Step 7: Test the app

| Step | Role | Action |
|------|------|--------|
| 1 | Lender | Go to Lender Dashboard → Create Offer |
| 2 | Borrower | Switch MetaMask account → Borrower Dashboard → Request Loan |
| 3 | Lender | Approve request and send ETH |
| 4 | Borrower | Repay the loan |

Use two different MetaMask accounts (or two browsers) to simulate lender and borrower.

---

## Local Development (Hardhat)

Use this for development without spending testnet ETH. Requires **4 terminals**.

### Terminal 1 — Local blockchain

```bash
npm run node:local
```

Starts Hardhat node at `http://127.0.0.1:8545` (Chain ID: `31337`).

### Terminal 2 — Compile and deploy

```bash
npm run compile
npm run deploy:local
```

Copy the printed contract address. Update:

- `frontend/.env` → `REACT_APP_CONTRACT_ADDRESS=<address>`
- `frontend/.env` → `REACT_APP_NETWORK_ID=31337`
- Optionally update `frontend/src/context/Web3Context.js` → `contractAddresses[31337]`

Copy the contract ABI to the frontend:

```bash
npm run copy-artifacts
```

### Terminal 3 — Backend

```bash
npm run start:backend
```

### Terminal 4 — Frontend

```bash
npm run start:frontend
```

### MetaMask (local)

Add a custom network:

| Field | Value |
|-------|-------|
| Network Name | Hardhat Local |
| RPC URL | http://127.0.0.1:8545 |
| Chain ID | 31337 |
| Currency | ETH |

Import a Hardhat test account (private keys are printed when `hardhat node` starts). Account #0 is pre-funded with test ETH.

---

## Deploying to Sepolia

### Step 1: Get Sepolia ETH

Fund your deployer wallet via a [Sepolia faucet](https://sepoliafaucet.com/).

### Step 2: Configure root `.env`

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_deployer_wallet_private_key
```

Get an Infura RPC URL at https://infura.io/ (create a project → Sepolia endpoint).

### Step 3: Deploy

```bash
npm run compile
npm run deploy:sepolia
```

### Step 4: Update frontend

Set `REACT_APP_CONTRACT_ADDRESS` in `frontend/.env` to the address printed by the deploy script.

---

## Environment Variables

The project uses **three separate `.env` files**. Each serves a different purpose:

| File | Used by | When needed | Variables |
|------|---------|-------------|-----------|
| **`/.env`** | Hardhat | Deploying contract | `SEPOLIA_RPC_URL`, `PRIVATE_KEY` |
| **`/backend/.env`** | Express server | Running backend | `PORT`, `MONGODB_URI` |
| **`/frontend/.env`** | React app | Running frontend | `REACT_APP_API_URL`, `REACT_APP_CONTRACT_ADDRESS`, `REACT_APP_NETWORK_ID` |

### Variable reference

#### Root `.env` (Hardhat deployment)

| Variable | Description | Example |
|----------|-------------|---------|
| `SEPOLIA_RPC_URL` | Infura/Alchemy RPC endpoint for Sepolia | `https://sepolia.infura.io/v3/abc123` |
| `PRIVATE_KEY` | Private key of the deployer wallet | `0xabc...` |

#### Backend `.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/p2plending` |

#### Frontend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_CONTRACT_ADDRESS` | Deployed P2PLending contract address | `0x06B7...` |
| `REACT_APP_NETWORK_ID` | Expected chain ID | `11155111` (Sepolia) or `31337` (local) |

---

## Smart Contract Overview

Contract: `contracts/P2PLending.sol`

### Core functions

| Function | Caller | Description |
|----------|--------|-------------|
| `createOffer(interestRate, durationDays, penaltyRate)` | Lender | Creates a new loan offer |
| `cancelOffer(offerId)` | Lender | Deactivates an offer |
| `requestLoan(offerId, amount)` | Borrower | Requests a loan from an active offer |
| `approveRequest(requestId)` | Lender (payable) | Sends exact loan amount to borrower |
| `repayLoan(requestId)` | Borrower (payable) | Repays principal + interest (+ penalty if late) |

### Interest and penalty

```
interest  = (amount × interestRate) / 100
totalOwed = amount + interest
if overdue: totalOwed += (amount × penaltyRate) / 100
```

See [docs/SMART_CONTRACT.md](docs/SMART_CONTRACT.md) for full contract documentation.

---

## API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/register` | Register a wallet address |
| `GET` | `/users/:address` | Get user profile |
| `GET` | `/transactions` | Get all transactions |
| `GET` | `/transactions/user/:address` | Get transactions for a wallet |
| `POST` | `/transactions` | Log a new transaction |
| `PATCH` | `/transactions/:hash/status` | Update transaction status |

See [docs/API.md](docs/API.md) for request/response examples.

---

## User Flows

### Lender flow

```
Connect Wallet → Lender Dashboard → Create Offer (on-chain)
  → Wait for borrower request → Approve + send ETH (on-chain)
  → Receive repayment (on-chain) → View history (backend)
```

### Borrower flow

```
Connect Wallet → Borrower Dashboard → Browse Offers
  → Request Loan (on-chain) → Receive ETH on approval
  → Repay Loan (on-chain) → View history (backend)
```

### What is stored where

| Data | Source |
|------|--------|
| Loan offers, approvals, repayments | Blockchain (smart contract) |
| Transaction history, user profiles | Backend (MongoDB) |
| UI, wallet state, loading/errors | Frontend (React) |

---

## Available Scripts

Run from the **project root** unless noted:

| Command | Description |
|---------|-------------|
| `npm install` | Install root dependencies (Hardhat, Express, etc.) |
| `npm run compile` | Compile Solidity contracts |
| `npm run node:local` | Start local Hardhat blockchain |
| `npm run deploy:local` | Deploy contract to local Hardhat node |
| `npm run deploy:sepolia` | Deploy contract to Sepolia testnet |
| `npm run copy-artifacts` | Copy contract ABI to frontend |
| `npm run start:backend` | Start Express API server |
| `npm run start:frontend` | Start React dev server |
| `cd frontend && npm install` | Install frontend dependencies |
| `cd frontend && npm run build` | Build frontend for production |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Please install MetaMask` | Install the MetaMask browser extension |
| `Failed to initialize contract` | Verify MetaMask network matches `REACT_APP_NETWORK_ID` and contract address is correct |
| `MongoDB connection error` | Start MongoDB (`mongod`) before the backend |
| `Network mismatch` | Switch MetaMask to Sepolia (`11155111`) or Hardhat Local (`31337`) |
| `Insufficient funds` | Import a Hardhat test account or get Sepolia ETH from a faucet |
| Backend API not reachable | Ensure backend is running on port 5000; check `REACT_APP_API_URL` |
| Contract not found after redeploy | Update `REACT_APP_CONTRACT_ADDRESS` and run `npm run copy-artifacts` |
| CORS errors | Backend has CORS enabled; ensure you are calling the correct API URL |

### Useful debug commands

```bash
# Verify backend is running
curl http://localhost:5000/api/transactions

# Compile contracts
npm run compile

# Check MongoDB data
mongosh
use p2plending
db.transactions.find().pretty()
db.users.find().pretty()
```

---

## Security Notes

- **Never commit `.env` files** to Git. Use `.env.example` templates only.
- **Never put private keys in `frontend/.env`**. React exposes `REACT_APP_*` variables to the browser.
- Root `.env` `PRIVATE_KEY` is only for Hardhat deployment scripts — keep it server-side.
- Rotate any keys that were accidentally committed or shared.
- The backend currently trusts frontend POST requests for transaction logging. Production should verify transactions on-chain before persisting.
- Consider adding OpenZeppelin guards (`ReentrancyGuard`, `Pausable`) before mainnet deployment.

---

## What Not to Commit to GitHub

| Do NOT commit | Reason |
|---------------|--------|
| `.env`, `backend/.env`, `frontend/.env` | Contains secrets (private keys, API keys) |
| `node_modules/` | Reinstalled via `npm install` |
| `cache/`, `artifacts/` | Hardhat generated files |
| `frontend/build/` | Production build output |
| `*.log` | Local log files |

**DO commit:** source code, `package.json`, `.env.example` files, `frontend/src/contracts/P2PLending.json` (ABI only), this README.

Before your first push:

```bash
git init
git add .
git status   # Verify NO .env files or node_modules appear
git commit -m "Initial commit: P2P lending dApp"
```

---

## Future Improvements

- [ ] Event listeners for automatic backend sync from blockchain events
- [ ] On-chain transaction verification before backend persistence
- [ ] Smart contract unit tests (Hardhat + Chai)
- [ ] WebSocket support for real-time status updates
- [ ] Collateral-based lending and credit scoring
- [ ] OpenZeppelin security patterns (ReentrancyGuard, Pausable)
- [ ] IPFS integration for loan documents
- [ ] Production deployment (Vercel/Netlify + Railway/Render + MongoDB Atlas)

---

## License

ISC

---

## References

- [Hardhat Documentation](https://hardhat.org/docs)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Infura](https://infura.io/) — Sepolia RPC provider
- [Sepolia Faucet](https://sepoliafaucet.com/) — Free testnet ETH
