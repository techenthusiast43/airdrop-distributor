import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWalletClient, createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Parse .env
function getEnvConfig() {
  const envPath = path.join(rootDir, '.env');
  const envConfig = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        envConfig[key] = val;
      }
    }
  }
  return { envConfig, envPath };
}

const { envConfig, envPath } = getEnvConfig();

// Look for private key
const rawPrivateKey =
  envConfig.PRIVATE_KEY ||
  envConfig.DEPLOYER_PRIVATE_KEY ||
  envConfig.WALLET_PRIVATE_KEY ||
  process.env.PRIVATE_KEY ||
  process.env.DEPLOYER_PRIVATE_KEY;

if (!rawPrivateKey) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: No PRIVATE_KEY found in .env!');
  console.log('\nPlease add your private key to .env like:');
  console.log('PRIVATE_KEY=your_private_key_here\n');
  process.exit(1);
}

const formattedKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;

// 2. Network Definition
const botMainnet = {
  id: 677,
  name: 'BotChain Mainnet',
  nativeCurrency: { decimals: 18, name: 'BOT', symbol: 'BOT' },
  rpcUrls: {
    default: { http: ['https://rpc.botchain.ai'] },
  },
  blockExplorers: {
    default: { name: 'BotScan', url: 'https://scan.botchain.ai' },
  },
};

const targetNetwork = botMainnet;

async function main() {
  console.log('\x1b[36m%s\x1b[0m', `=== Deploying AirdropDistributor to ${targetNetwork.name} ===`);
  console.log(`Network   : ${targetNetwork.name} (Chain ID: ${targetNetwork.id})`);
  console.log(`RPC URL   : ${targetNetwork.rpcUrls.default.http[0]}`);
  console.log(`Explorer  : ${targetNetwork.blockExplorers.default.url}`);

  const account = privateKeyToAccount(formattedKey);
  console.log(`\nDeployer Address: \x1b[32m${account.address}\x1b[0m`);

  const publicClient = createPublicClient({
    chain: targetNetwork,
    transport: http(targetNetwork.rpcUrls.default.http[0]),
  });

  const walletClient = createWalletClient({
    account,
    chain: targetNetwork,
    transport: http(targetNetwork.rpcUrls.default.http[0]),
  });

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer BOT Balance: \x1b[33m${formatEther(balance)} BOT\x1b[0m`);

  if (balance === 0n) {
    console.error('\n\x1b[31m%s\x1b[0m', `Error: Deployer wallet has 0 BOT balance on ${targetNetwork.name}.`);
    console.log(`\nPlease send a small amount of BOT (e.g. 0.05 - 0.2 BOT) to:`);
    console.log(`\x1b[32m${account.address}\x1b[0m`);
    console.log(`to cover smart contract deployment gas on Chain ID ${targetNetwork.id}.\n`);
    process.exit(1);
  }

  // Compile Solidity Contract using solc
  console.log('\nCompiling contracts/AirdropDistributor.sol...');
  let solc;
  try {
    solc = (await import('solc')).default;
  } catch (err) {
    console.log('solc not found locally. Installing solc...');
    const { execSync } = await import('child_process');
    execSync('npm.cmd install -D solc', { cwd: rootDir, stdio: 'inherit' });
    solc = (await import('solc')).default;
  }

  const contractPath = path.join(rootDir, 'contracts', 'AirdropDistributor.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'AirdropDistributor.sol': {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        console.error('\x1b[31m%s\x1b[0m', error.formattedMessage);
        hasError = true;
      }
    }
    if (hasError) process.exit(1);
  }

  const contractOutput = output.contracts['AirdropDistributor.sol']['AirdropDistributor'];
  const bytecode = `0x${contractOutput.evm.bytecode.object}`;
  const abi = contractOutput.abi;

  console.log('\x1b[32m%s\x1b[0m', 'Compilation successful!');
  console.log(`Broadcasting deployment transaction to ${targetNetwork.name}...`);

  const deployTxHash = await walletClient.deployContract({
    abi,
    bytecode,
  });

  console.log(`Deployment Tx Hash : \x1b[36m${deployTxHash}\x1b[0m`);
  console.log(`Explorer Link      : ${targetNetwork.blockExplorers.default.url}/tx/${deployTxHash}`);
  console.log('Waiting for block confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployTxHash });

  const contractAddress = receipt.contractAddress;
  console.log('\n\x1b[32m%s\x1b[0m', `✓ Contract successfully deployed at: ${contractAddress}`);
  console.log(`Explorer Link: ${targetNetwork.blockExplorers.default.url}/address/${contractAddress}`);

  // Automatically update .env with new contract address
  let envFileContent = fs.readFileSync(envPath, 'utf8');
  if (envFileContent.includes('VITE_DISTRIBUTOR_CONTRACT_ADDRESS=')) {
    envFileContent = envFileContent.replace(
      /VITE_DISTRIBUTOR_CONTRACT_ADDRESS=.*/,
      `VITE_DISTRIBUTOR_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envFileContent += `\nVITE_DISTRIBUTOR_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  fs.writeFileSync(envPath, envFileContent, 'utf8');
  console.log('\x1b[32m%s\x1b[0m', `✓ Updated .env with VITE_DISTRIBUTOR_CONTRACT_ADDRESS=${contractAddress}`);

  console.log('\n🎉 Ready! Run `npm run dev` to start distributing tokens on Mainnet.');
}

main().catch((err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Deployment failed:');
  console.error(err);
  process.exit(1);
});
