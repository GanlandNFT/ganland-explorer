'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import Image from 'next/image';

// Constants
const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';
const REQUIRED_GAN = 6900000n * 10n ** 18n;
const FREE_HANDLES = ['iglivision', 'artfractalicia'];

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

// Quick command buttons
const QUICK_COMMANDS = [
  'balance',
  'my NFTs', 
  'mint',
  'send $GAN',
  'help',
];

export default function TerminalPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [accessStatus, setAccessStatus] = useState('checking');
  const [ganBalance, setGanBalance] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const xHandle = user?.twitter?.username?.toLowerCase();

  // Check access
  useEffect(() => {
    async function checkAccess() {
      if (!ready) return;
      
      if (!authenticated) {
        setAccessStatus('login_required');
        return;
      }

      // Featured artists get free access
      if (xHandle && FREE_HANDLES.includes(xHandle)) {
        setAccessStatus('granted');
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `Hey @${xHandle}! 👋\n\nWelcome to the Agentic Interface. I'm GAN, your AI assistant for the Fractal Visions ecosystem.\n\nWhat can I help you with today?`,
          timestamp: Date.now()
        }]);
        return;
      }

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
        
        const hasTokens = balance >= REQUIRED_GAN;
        if (hasTokens) {
          setAccessStatus('granted');
          setMessages([{
            role: 'assistant',
            content: `Welcome! 👋\n\nYou have ${formatGan(balance)} $GAN. Ready to explore the Fractal Visions ecosystem.\n\nWhat would you like to do?`,
            timestamp: Date.now()
          }]);
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

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (role, content, handle = null) => {
    setMessages(prev => [...prev, { role, content, handle, timestamp: Date.now() }]);
  };

  const processCommand = async (cmd) => {
    const command = cmd.trim().toLowerCase();
    if (!command) return;

    addMessage('user', cmd, xHandle);
    setIsProcessing(true);

    try {
      const result = await executeCommand(command, wallets?.[0]?.address);
      addMessage('assistant', result.error || result.message);
    } catch (e) {
      addMessage('assistant', `Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    processCommand(input);
    setInput('');
  };

  // Access screens
  if (!ready) return <LoadingScreen message="Initializing..." />;
  if (accessStatus === 'login_required') return <LoginScreen onLogin={login} />;
  if (accessStatus === 'no_wallet') return <NoWalletScreen />;
  if (accessStatus === 'insufficient_balance') return <PaywallScreen balance={ganBalance} required={REQUIRED_GAN} />;
  if (accessStatus === 'checking') return <LoadingScreen message="Checking access..." />;

  // Main Terminal UI
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {/* Terminal Container with Laser Border */}
      <div className="relative w-full max-w-2xl">
        {/* Animated Laser Glow Border */}
        <div className="absolute -inset-[2px] rounded-3xl laser-border" />
        
        {/* Inner glow */}
        <div className="absolute -inset-[1px] rounded-3xl bg-cyan-500/10 blur-md" />
        
        {/* Main Container */}
        <div className="relative bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h1 className="text-center text-sm font-medium tracking-widest text-white/70 uppercase">
              Agentic Interface
            </h1>
          </div>

          {/* Chat Area */}
          <div 
            ref={chatRef}
            className="h-[400px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
          >
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            
            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image src="/gan-logo.jpg" alt="GAN" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div className="bg-cyan-500/10 backdrop-blur-xl border border-cyan-400/20 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Ask GAN anything..."
                className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur border border-white/10 focus:border-cyan-400/50 rounded-2xl outline-none text-white text-sm placeholder-white/30 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500/80 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            
            {/* Quick Commands - Small buttons */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {QUICK_COMMANDS.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => processCommand(cmd)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 rounded-full text-white/60 hover:text-white transition-all"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Chat message with glass effect
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* GAN Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
            <Image src="/gan-logo.jpg" alt="GAN" width={32} height={32} className="w-full h-full object-cover" />
          </div>
        )}
        
        {/* Glass Bubble */}
        <div className={`backdrop-blur-xl px-4 py-2.5 ${
          isUser 
            ? 'bg-gan-yellow/20 border border-gan-yellow/30 rounded-2xl rounded-br-sm text-white' 
            : 'bg-cyan-500/10 border border-cyan-400/20 rounded-2xl rounded-bl-sm text-cyan-50'
        }`}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
      
      {/* User handle below bubble */}
      {isUser && message.handle && (
        <span className="text-[10px] text-white/30 mt-1 mr-2">@{message.handle}</span>
      )}
    </div>
  );
}

// Loading screen
function LoadingScreen({ message }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Login screen
function LoginScreen({ onLogin }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="relative">
        <div className="absolute -inset-[2px] rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 animate-pulse opacity-50" />
        </div>
        <div className="relative bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
            <Image src="/gan-logo.jpg" alt="GAN" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-white">Agentic Interface</h1>
          <p className="text-white/50 text-sm mb-6">
            Connect with X to access the terminal.
          </p>
          <button
            onClick={onLogin}
            className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-xl transition-colors"
          >
            Connect with X
          </button>
        </div>
      </div>
    </div>
  );
}

// No wallet screen
function NoWalletScreen() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">💰</div>
        <h1 className="text-xl font-bold mb-2">Wallet Required</h1>
        <p className="text-white/50 text-sm">Connect a wallet to continue.</p>
      </div>
    </div>
  );
}

// Paywall screen
function PaywallScreen({ balance, required }) {
  const hasTokens = balance && balance >= required;
  
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="relative">
        <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-purple-500/50 to-cyan-500/50 blur-sm" />
        <div className="relative bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-xl font-bold">Access Required</h1>
            <p className="text-white/50 text-sm mt-2">Hold $GAN tokens to unlock the Agentic Interface</p>
          </div>
          
          <div className={`p-4 rounded-2xl border ${hasTokens ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Required</span>
              <span className="text-gan-yellow font-mono">6,900,000 $GAN</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Your Balance</span>
              <span className={`font-mono ${hasTokens ? 'text-green-400' : 'text-red-400'}`}>
                {balance ? formatGan(balance) : '0'} $GAN
              </span>
            </div>
          </div>
          
          <a 
            href="https://app.uniswap.org/swap?chain=base&outputCurrency=0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07"
            target="_blank"
            className="block w-full mt-4 px-6 py-3 bg-gan-yellow hover:bg-gan-gold text-black font-medium rounded-xl text-center transition-colors"
          >
            Buy $GAN on Uniswap
          </a>
          
          <p className="text-white/30 text-xs text-center mt-4">
            Featured artists get free access. DM @IGLIVISION to apply.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatGan(balance) {
  const num = Number(balance) / 1e18;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

// Command execution
async function executeCommand(command, walletAddress) {
  if (command === 'help') {
    return {
      message: `Commands:\n\n• balance — Check your tokens\n• my NFTs — View collection\n• mint — Mint new art\n• send $GAN — Transfer tokens\n\nOr just ask me anything!`
    };
  }

  if (command === 'balance' || command.includes('balance')) {
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
        message: `💰 Your Balance\n\nETH: ${Number(formatEther(ethBalance)).toFixed(6)}\n$GAN: ${formatGan(ganBalance)}\n\nWallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\nChain: Base`
      };
    } catch (e) {
      return { error: `Failed to fetch balance: ${e.message}` };
    }
  }

  if (command.includes('nft')) {
    return { message: '🖼️ NFT viewer coming soon!\n\nI\'ll show all your NFTs across chains.' };
  }

  if (command.includes('mint')) {
    return { message: '🎨 Minting coming soon!\n\nYou\'ll be able to mint from Ganland collections here.' };
  }

  if (command.includes('send')) {
    return { message: '💸 Transfers coming soon!\n\nSend $GAN to any X handle or address.' };
  }

  return { 
    message: `I'm still learning! Try:\n• balance\n• my NFTs\n• mint\n• help`
  };
}
