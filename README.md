# BOT Airdrop Distributor 🚀

[![Network: BotChain Mainnet](https://img.shields.io/badge/Network-BotChain%20Mainnet%20(677)-blue.svg)](https://scan.botchain.ai)
[![Contract: Verified](https://img.shields.io/badge/Contract-0x93bb...6c20-green.svg)](https://scan.botchain.ai/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org)

**BOT Airdrop Distributor** is a high-performance, gas-optimized, and non-custodial decentralized bulk token distribution protocol built for **BotChain Mainnet (Chain ID: `677`)**. It enables project creators, DAOs, and community managers to distribute native BOT coins (Total Supply: 150M) and ERC-20 tokens to hundreds or thousands of recipients in batched atomic transactions, saving up to **65% on gas fees**.

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
- **📜 Verified Mainnet Contract**: Fully deployed and verified on BotChain Mainnet ([0x93bb...6c20](https://scan.botchain.ai/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20)).
- **📖 Embedded Whitepaper**: Full protocol documentation, security audits, and architectural specifications viewable inside the application.

---

## 🌐 Network Specifications

| Parameter | Value |
|---|---|
| **Network** | BotChain Mainnet |
| **Chain ID** | `677` (Hex: `0x2a5`) |
| **Native Token** | BOT (18 Decimals) |
| **Total Supply** | 150 Million BOT |
| **Contract Address** | [`0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20`](https://scan.botchain.ai/address/0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20) |
| **Deployment Tx Hash** | [`0x190a85d5512757c33169555c4f0defa10d23ee05840acbbc4ea3e43af60fee23`](https://scan.botchain.ai/tx/0x190a85d5512757c33169555c4f0defa10d23ee05840acbbc4ea3e43af60fee23) |
| **Block Explorer** | [scan.botchain.ai](https://scan.botchain.ai) |
| **RPC Endpoint** | `https://rpc.botchain.ai` |

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

### 3. Environment Variables
Copy `.env.example` to `.env` and provide your Reown Project ID:
```env
VITE_REOWN_PROJECT_ID=your_reown_project_id
VITE_DISTRIBUTOR_CONTRACT_ADDRESS=0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20
PRIVATE_KEY=your_private_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 📜 Contract Deployment
To deploy your own copy of the contract to BotChain Mainnet:
```bash
npm run deploy
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
