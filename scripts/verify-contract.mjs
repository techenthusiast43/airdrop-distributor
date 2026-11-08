import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read .env
function getEnvContract() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/VITE_DISTRIBUTOR_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
    if (match) return match[1];
  }
  return '0x93bb84ed7826c1b4e667caab570c4a54c6ed6c20';
}

const contractAddress = process.argv[2] || getEnvContract();
const contractPath = path.join(rootDir, 'contracts', 'AirdropDistributor.sol');
const sourceCode = fs.readFileSync(contractPath, 'utf8');

async function verify() {
  console.log('\x1b[36m%s\x1b[0m', '=== Verifying Smart Contract on BotScan Explorer ===');
  console.log(`Contract Address : \x1b[32m${contractAddress}\x1b[0m`);
  console.log(`Explorer URL     : https://scan.botchain.ai/address/${contractAddress}#code`);
  console.log(`Compiler Version : v0.8.37+commit.f401782d`);
  console.log(`Optimization     : Enabled (200 runs)\n`);

  // 1. Check if already verified
  try {
    const checkRes = await fetch(`https://scan.botchain.ai/api?module=contract&action=getabi&address=${contractAddress}`);
    const checkJson = await checkRes.json();
    if (checkJson.status === '1') {
      console.log('\x1b[32m%s\x1b[0m', '✓ Contract is ALREADY verified on BotScan Explorer!');
      console.log(`View verified source code, ABI & functions:`);
      console.log(`\x1b[36mhttps://scan.botchain.ai/address/${contractAddress}#code\x1b[0m\n`);
      return;
    }
  } catch (err) {
    console.warn('Initial check failed, proceeding to submit verification...', err.message);
  }

  // 2. Submit verification payload
  console.log('Submitting source code for compilation and verification...');
  const params = new URLSearchParams();
  params.append('module', 'contract');
  params.append('action', 'verifysourcecode');
  params.append('contractaddress', contractAddress);
  params.append('sourceCode', sourceCode);
  params.append('codeformat', 'solidity-single-file');
  params.append('contractname', 'AirdropDistributor');
  params.append('compilerversion', 'v0.8.37+commit.f401782d');
  params.append('optimizationUsed', '1');
  params.append('runs', '200');

  const res = await fetch('https://scan.botchain.ai/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (data.status !== '1') {
    console.error('\x1b[31m%s\x1b[0m', `Verification submission error: ${data.result || data.message}`);
    return;
  }

  const guid = data.result;
  console.log(`Verification submitted! Tracking GUID: ${guid}`);
  console.log('Waiting for verification worker...');

  // Poll status
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const statusRes = await fetch(`https://scan.botchain.ai/api?module=contract&action=checkverifystatus&guid=${guid}`);
      const statusData = await statusRes.json();
      console.log(`[Attempt ${attempt}/10] Status: ${statusData.result}`);
      if (statusData.result === 'Pass - Verified') {
        console.log('\n\x1b[32m%s\x1b[0m', '🎉 Contract successfully verified on BotScan Explorer!');
        console.log(`Explorer Link: https://scan.botchain.ai/address/${contractAddress}#code\n`);
        return;
      }
      if (statusData.result && statusData.result.includes('Fail')) {
        console.error('\x1b[31m%s\x1b[0m', `Verification failed: ${statusData.result}`);
        return;
      }
    } catch (e) {
      console.warn('Polling error:', e.message);
    }
  }
}

verify().catch(console.error);
