'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';

// Constants
const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';
const REQUIRED_GAN = 6900000n * 10n ** 18n; // 6,900,000 $GAN
const FREE_HANDLES = ['iglivision', 'artfractalicia'];
const SUBSCRIPTION_WALLET = '0xDd32A567bc09384057A1F260086618D88b28E64F'; // ganland.eth
const SUBSCRIPTION_PRICE = 0.015; // ~$30 in ETH

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export default function TerminalPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [accessStatus, setAccessStatus] = useState('checking'); // checking, granted, denied
  const [ganBalance, setGanBalance] = useState(null);
  const [history, setHistory] = useState([
    { type: 'system', text: 'Welcome to GAN Terminal v1.0' },
    { type: 'system', text: 'Type "help" for available commands.' },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  // Get X handle from Privy user
  const xHandle = user?.twitter?.username?.toLowerCase();

  // Check access on auth change
  useEffect(() => {
    async function checkAccess() {
      if (!ready) return;
      
      if (!authenticated) {
        setAccessStatus('login_required');
        return;
      }

      // Check free list first
      if (xHandle && FREE_HANDLES.includes(xHandle)) {
        setAccessStatus('granted');
        addSystemMessage(`🎉 Welcome back, @${xHandle}! (Featured Artist - Free Access)`);
        return;
      }

      // Check $GAN balance
      const wallet = wallets?.[0];
      if (!wallet) {
        setAccessStatus('no_wallet');
        return;
      }

      try {
        const balance = await publicClient.readContract({
          address: GAN_TOKEN,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [wallet.address]
        });
        
        setGanBalance(balance);
        
        // Check if user has BOTH: $GAN balance AND subscription
        // TODO: Check subscription status in Supabase
        const hasTokens = balance >= REQUIRED_GAN;
        const hasSubscription = false; // TODO: implement subscription check
        
        if (hasTokens && hasSubscription) {
          setAccessStatus('granted');
          addSystemMessage(`🔓 Access granted! Balance: ${formatGan(balance)} $GAN + Active Subscription`);
        } else {
          setAccessStatus('insufficient_balance');
        }
      } catch (e) {
        console.error('Failed to check balance:', e);
        setAccessStatus('error');
      }
    }

    checkAccess();
  }, [ready, authenticated, wallets, xHandle]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click
  const focusInput = () => inputRef.current?.focus();

  // Add message to history
  const addMessage = (type, text) => {
    setHistory(prev => [...prev, { type, text, timestamp: Date.now() }]);
  };

  const addSystemMessage = (text) => addMessage('system', text);
  const addUserMessage = (text) => addMessage('user', text);
  const addResponse = (text) => addMessage('response', text);
  const addError = (text) => addMessage('error', text);

  // Process command
  const processCommand = async (cmd) => {
    const command = cmd.trim().toLowerCase();
    
    if (!command) return;

    addUserMessage(cmd);
    setIsProcessing(true);

    try {
      // Parse and execute command
      const result = await executeCommand(command, wallets?.[0]?.address);
      
      if (result.error) {
        addError(result.error);
      } else {
        addResponse(result.message);
      }
    } catch (e) {
      addError(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle input submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    processCommand(input);
    setInput('');
  };

  // Render based on access status
  if (!ready) {
    return <LoadingScreen message="Initializing..." />;
  }

  if (accessStatus === 'login_required') {
    return <LoginScreen onLogin={login} />;
  }

  if (accessStatus === 'no_wallet') {
    return <NoWalletScreen />;
  }

  if (accessStatus === 'insufficient_balance') {
    return <PaywallScreen balance={ganBalance} required={REQUIRED_GAN} onSubscribe={() => {}} />;
  }

  if (accessStatus === 'checking') {
    return <LoadingScreen message="Checking access..." />;
  }

  // Terminal UI
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-t-xl px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-500 text-sm ml-2">GAN Terminal</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>@{xHandle || 'anonymous'}</span>
          <span className="text-gan-yellow">{ganBalance ? formatGan(ganBalance) : '—'} $GAN</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={terminalRef}
        onClick={focusInput}
        className="flex-1 bg-gray-950 border-x border-gray-800 p-4 font-mono text-sm overflow-y-auto cursor-text"
        style={{ minHeight: '400px' }}
      >
        {history.map((entry, i) => (
          <TerminalLine key={i} entry={entry} />
        ))}
        
        {isProcessing && (
          <div className="text-gray-500 animate-pulse">Processing...</div>
        )}
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-b-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Enter command..."
            className="flex-1 bg-transparent outline-none text-white font-mono"
            autoFocus
          />
        </div>
      </form>

      {/* Quick Commands */}
      <div className="mt-4 flex flex-wrap gap-2">
        {['help', 'balance', 'my address', 'show my NFTs', 'trending NFT collections'].map(cmd => (
          <button
            key={cmd}
            onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}

// Terminal line component
function TerminalLine({ entry }) {
  const colors = {
    system: 'text-gray-500',
    user: 'text-white',
    response: 'text-green-400',
    error: 'text-red-400',
  };

  return (
    <div className={`mb-1 ${colors[entry.type] || 'text-white'}`}>
      {entry.type === 'user' && <span className="text-blue-400">❯ </span>}
      <span className="whitespace-pre-wrap">{entry.text}</span>
    </div>
  );
}

// Loading screen
function LoadingScreen({ message }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-gan-yellow rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}

// Login required screen
function LoginScreen({ onLogin }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-3xl font-bold mb-4">GAN Terminal</h1>
        <p className="text-gray-400 mb-6">
          Connect with X to access the Ganland command interface.
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-3 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
        >
          Connect with X
        </button>
      </div>
    </div>
  );
}

// No wallet screen
function NoWalletScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">💰</div>
        <h1 className="text-3xl font-bold mb-4">Wallet Required</h1>
        <p className="text-gray-400 mb-6">
          Please connect a wallet to access the terminal.
        </p>
      </div>
    </div>
  );
}

// Paywall screen
function PaywallScreen({ balance, required, onSubscribe }) {
  const hasTokens = balance && balance >= required;
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">🎟️</div>
        <h1 className="text-3xl font-bold mb-4">Access Required</h1>
        <p className="text-gray-400 mb-6">
          To use GAN Terminal, you need <strong>both</strong> of the following:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className={`p-6 bg-gray-900/50 border rounded-xl ${hasTokens ? 'border-green-500/50' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-gan-yellow">Hold $GAN</div>
              {hasTokens && <span className="text-green-400">✓</span>}
            </div>
            <div className="text-gray-400 text-sm mb-4">
              Minimum 6,900,000 $GAN
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Your balance: {balance ? formatGan(balance) : '0'} $GAN
            </div>
            <a 
              href="https://app.uniswap.org/swap?chain=base&outputCurrency=0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07"
              target="_blank"
              className="block w-full px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
            >
              Buy $GAN
            </a>
          </div>
          
          <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-purple-400">Subscribe</div>
            </div>
            <div className="text-gray-400 text-sm mb-4">
              $30/month in ETH
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Paid to ganland.eth
            </div>
            <button 
              onClick={onSubscribe}
              className="w-full px-4 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-600 transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg text-sm text-gray-400 mb-4">
          <strong className="text-white">Both requirements must be met:</strong>
          <br />• Hold 6,900,000 $GAN in your wallet
          <br />• Maintain active $30/month subscription
        </div>

        <p className="text-gray-500 text-sm">
          Featured artists get free access. Contact @IGLIVISION to apply.
        </p>
      </div>
    </div>
  );
}

// Format $GAN balance
function formatGan(balance) {
  const num = Number(balance) / 1e18;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

// Command execution
async function executeCommand(command, walletAddress) {
  // Help
  if (command === 'help') {
    return {
      message: `
Available Commands:

WALLET
  create wallet       Create your Ganland wallet
  my address          Show your wallet address
  balance             Check token balances

TRANSFERS
  send [amt] $GAN to @user    Transfer tokens
  send [amt] ETH to 0x...     Send to address

NFTS
  show my NFTs                View your collection
  my NFTs on [chain]          Filter by chain
  buy this: [link]            Buy an NFT
  buy floor [collection]      Buy cheapest
  list my [col] #[id] for [x] ETH
  transfer [col] #[id] to @user

ART
  generate [prompt]           Create AI art

Type "docs" for full documentation.
      `.trim()
    };
  }

  // Docs link
  if (command === 'docs') {
    return { message: 'Documentation: https://ganland.ai/docs' };
  }

  // Balance
  if (command === 'balance' || command === 'check balance') {
    if (!walletAddress) return { error: 'No wallet connected' };
    
    try {
      const ganBalance = await publicClient.readContract({
        address: GAN_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      const ethBalance = await publicClient.getBalance({ address: walletAddress });
      
      return {
        message: `
💰 Wallet Balance

ETH:  ${Number(formatEther(ethBalance)).toFixed(6)} ETH
$GAN: ${formatGan(ganBalance)} $GAN

Wallet: ${walletAddress}
Chain: Base (8453)
        `.trim()
      };
    } catch (e) {
      return { error: `Failed to fetch balance: ${e.message}` };
    }
  }

  // My address
  if (command === 'my address' || command === 'show my address') {
    if (!walletAddress) return { error: 'No wallet connected' };
    return { message: `Your Ganland wallet: ${walletAddress}` };
  }

  // Show NFTs
  if (command.includes('show my nfts') || command.includes('what nfts do i own')) {
    return { message: 'Fetching NFTs... (Coming soon - will integrate with Zapper API)' };
  }

  // Trending collections
  if (command.includes('trending')) {
    return { message: 'Trending collections on Fractal Visions:\n• Neural Networkers (Base)\n• Gan Frens (Base)\n• Micro Cosms (Optimism)' };
  }

  // Generate art
  if (command.startsWith('generate ')) {
    const prompt = command.replace('generate ', '');
    return { message: `🎨 Art generation queued!\n\nPrompt: "${prompt}"\nCost: 500,000 $GAN\n\nTo complete, tweet this to @GanlandNFT on X.` };
  }

  // Unknown command
  return { error: `Unknown command: "${command}"\nType "help" for available commands.` };
}
