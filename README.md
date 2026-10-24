# BOT Airdrop Distributor 🚀

[![Network: Bohr Chain](https://img.shields.io/badge/Network-Bohr%20Chain%20(968)-blue.svg)](https://scan.bohr.life)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)

**BOT Airdrop Distributor** is a high-performance, gas-optimized, and non-custodial decentralized bulk token distribution protocol built specifically for **Bohr Chain (Chain ID: `968`)**. It enables project creators, DAOs, and community managers to distribute native BOT coins and ERC-20 tokens to hundreds or thousands of recipients in batched atomic transactions, saving up to **65% on gas fees**.

---

## 🌟 Key Features

- **⚡ Gas-Optimized Execution**: Low-level EVM calldata loops, unchecked arithmetic indexing, and atomic multi-send logic minimize gas per transfer.
- **🛡️ 100% Non-Custodial & Atomic**: No deposit lockups or intermediate custodial contracts. Tokens transfer directly from your wallet to recipients in real time.
- **🪙 Native BOT & ERC-20 Support**: Seamlessly send native BOT or any ERC-20 token, with built-in support for non-standard tokens (like USDT-style transfer returns).
- **📦 Intelligent Batch Chunking**: Automatically chunks distributions into safe batches of 100 transfers per transaction, eliminating EVM block gas limit reverts.
- **📑 Flexible Recipient Import**: 
  - Paste addresses & amounts directly (format: `0x... 100`, `0x...,100`, or `0x...=100`)
  - Upload CSV or TXT files via drag-and-drop
  - Real-time address checksum validation & balance checks
  - Configurable duplicate handling: **Merge amounts**, **Deduplicate**, or **Keep all**
- **📜 Verified Smart Contract Integration**: Dynamic contract address switching with preset Bohr Chain testnet contract deployment.
- **📖 Embedded Whitepaper**: Full protocol documentation, security audits, and architectural specifications viewable inside the application.

---

## 🏗️ Deployed Contracts

| Parameter | Value |
|---|---|
| **Network** | Bohr Chain Testnet |
| **Chain ID** | `968` |
| **Native Token** | BOT (18 Decimals) |
| **Contract Address** | [`0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20`](https://scan.bohr.life/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20) |
| **Block Explorer** | [scan.bohr.life](https://scan.bohr.life) |
| **RPC Endpoint** | `https://rpc.bohr.life/` |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Web3 Integration**: Wagmi v2, Viem v2, Reown AppKit (`@reown/appkit`)
- **Smart Contracts**: Solidity `^0.8.20`
- **Icons & Styling**: Lucide React, Modern Custom Dark Mode CSS
- **Data Parsing**: PapaParse (CSV/TXT)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/techenthusiast43/airdrop-distributor.git
cd airdrop-distributor
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and supply your AppKit Project ID and deployment settings:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_REOWN_PROJECT_ID="your_reown_project_id_here"
VITE_DISTRIBUTOR_CONTRACT_ADDRESS="0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20"
PRIVATE_KEY=""
RPC_URL="https://rpc.bohr.life/"
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```

---

## 📜 Smart Contract Architecture

The core contract is located at [`contracts/AirdropDistributor.sol`](contracts/AirdropDistributor.sol).

### Key Functions
- `airdropNative(address payable[] calldata recipients, uint256[] calldata amounts) external payable`:
  Dispatches native BOT in a loop, validating matching values and automatically refunding any excess msg.value.
- `airdropERC20(address token, address[] calldata recipients, uint256[] calldata amounts) external`:
  Transfers ERC-20 tokens using `_safeTransferFrom`, safely handling both standard boolean and non-standard void-returning ERC-20 contracts.

To deploy a new contract instance:
```bash
npm run deploy
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
