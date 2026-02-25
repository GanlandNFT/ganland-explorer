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
const GANLAND_ETH = '0xDd32A567bc09384057A1F260086618D88b28E64F';

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
  'Buy me $20 of $GAN',
  'Send $5 to Ganland.eth', 
  'List NFT on Fractal Visions',
  'balance',
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
  const [activityLogs, setActivityLogs] = useState([]);
  const [supabaseData, setSupabaseData] = useState({ collections: [], tokenStats: null });
  
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const xHandle = user?.twitter?.username?.toLowerCase();

  // Add activity log
  const addLog = (message, type = 'info') => {
    setActivityLogs(prev => [...prev.slice(-4), { message, type, timestamp: Date.now() }]);
  };

  // Fetch activity from Supabase on mount
  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch('/api/activity?type=recent&limit=5');
        const data = await res.json();
        if (data.success) {
          setSupabaseData({
            collections: data.data.collections || [],
            tokenStats: data.data.tokenStats
          });
          
          // Show recent on-chain activity in logs
          if (data.data.activity?.length > 0) {
            data.data.activity.slice(0, 3).forEach(a => {
              const type = a.activity_type === 'mint' ? '🎨' : 
                          a.activity_type === 'transfer' ? '📤' : 
                          a.activity_type === 'list' ? '🏷️' : '📝';
              addLog(`${type} ${a.activity_type}: ${a.wallet_address?.slice(0, 8)}...`, 'info');
            });
          }
          
          // Show token stats
          if (data.data.tokenStats) {
            const stats = data.data.tokenStats;
            addLog(`$GAN: $${stats.price_usd?.toFixed(6) || '—'} (${stats.price_change_24h > 0 ? '+' : ''}${stats.price_change_24h?.toFixed(2) || '0'}%)`, 'info');
          }
        }
      } catch (e) {
        console.error('Failed to fetch activity:', e);
      }
    }
    
    fetchActivity();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

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
        addLog('✓ Featured artist access granted', 'success');
        setMessages([{
          role: 'assistant',
          content: `Hey @${xHandle}! 🍄\n\nGAN at your service. Choose a command or ask a question.`,
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
        addLog('Checking $GAN balance...', 'info');
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
          addLog(`✓ Token gate passed: ${formatGan(balance)} $GAN`, 'success');
          setMessages([{
            role: 'assistant',
            content: `Hey! 🍄\n\nGAN at your service. Choose a command or ask a question.`,
            timestamp: Date.now()
          }]);
        } else {
          addLog(`✗ Insufficient balance: ${formatGan(balance)} $GAN`, 'error');
          setAccessStatus('insufficient_balance');
        }
      } catch (e) {
        console.error('Failed to check balance:', e);
        addLog(`Error: ${e.message}`, 'error');
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
    const command = cmd.trim();
    if (!command) return;

    addMessage('user', command, xHandle);
    setIsProcessing(true);
    addLog(`Processing: ${command}`, 'info');

    try {
      const result = await executeCommand(command.toLowerCase(), wallets?.[0]?.address, addLog, supabaseData);
      addMessage('assistant', result.error || result.message);
      if (result.error) {
        addLog(`Error: ${result.error}`, 'error');
      } else {
        addLog('✓ Command completed', 'success');
      }
    } catch (e) {
      addMessage('assistant', `Error: ${e.message}`);
      addLog(`Error: ${e.message}`, 'error');
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
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-4 pb-20 md:pb-4 md:justify-center px-4">
      {/* Terminal Container with Laser Border */}
      <div className="relative w-full max-w-2xl">
        {/* Animated Laser Glow Border */}
        <div className="absolute -inset-[2px] rounded-3xl laser-border" />
        
        {/* Inner glow */}
        <div className="absolute -inset-[1px] rounded-3xl bg-cyan-500/10 blur-md" />
        
        {/* Main Container */}
        <div className="relative bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-3 border-b border-white/10 bg-white/5">
            <h1 className="text-center text-xs font-medium tracking-widest text-white/70 uppercase">
              Agentic Interface
            </h1>
          </div>

          {/* Chat Area */}
          <div 
            ref={chatRef}
            className="h-[300px] md:h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-thin"
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

          {/* Input Area - Moved up with less padding */}
          <div className="p-3 border-t border-white/10 bg-white/5">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Ask GAN anything..."
                className="w-full px-4 py-2.5 pr-12 bg-white/5 backdrop-blur border border-white/10 focus:border-cyan-400/50 rounded-2xl outline-none text-white text-sm placeholder-white/30 transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-cyan-500/80 hover:bg-cyan-400 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all"
              >
                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            
            {/* Quick Commands - Small buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_COMMANDS.map(cmd => (
                <button
                  key={cmd}
                  onClick={() => processCommand(cmd)}
                  disabled={isProcessing}
                  className="px-2 py-0.5 text-[9px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/30 rounded-full text-white/60 hover:text-white transition-all"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Module - Yellow */}
      <div className="w-full max-w-2xl mt-3">
        <div className="bg-gan-yellow/10 border border-gan-yellow/30 rounded-2xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gan-yellow rounded-full animate-pulse" />
            <span className="text-[10px] text-gan-yellow font-medium uppercase tracking-wider">Activity Log</span>
          </div>
          <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin">
            {activityLogs.length === 0 ? (
              <p className="text-[11px] text-white/30">Waiting for activity...</p>
            ) : (
              activityLogs.map((log, i) => (
                <div key={i} className={`text-[11px] font-mono ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'success' ? 'text-green-400' : 
                  'text-white/50'
                }`}>
                  {log.message}
                </div>
              ))
            )}
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
          <p className="whitespace-pre-wrap text-sm leading-relaxed break-words overflow-wrap-anywhere">{message.content}</p>
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

// Command execution with natural language
async function executeCommand(command, walletAddress, addLog, supabaseData) {
  const cmd = command.toLowerCase();
  
  // Help
  if (cmd === 'help') {
    return { message: `💰 buy $GAN\n📤 send to ganland.eth\n🖼️ list NFT\n📊 balance\n🎨 collections` };
  }

  // Buy $GAN - short response
  if (cmd.includes('buy') && (cmd.includes('gan') || cmd.includes('token'))) {
    addLog('Opening Uniswap...', 'info');
    return { message: `💰 Buy $GAN on Uniswap (Base chain)\n\nuniswap.org → swap ETH for $GAN` };
  }

  // Send to Ganland.eth
  if (cmd.includes('send') && cmd.includes('ganland')) {
    addLog('Preparing transfer...', 'info');
    return { message: `📤 ganland.eth\n0xDd32...E64F\n\nSend from your wallet directly.` };
  }

  // List NFT
  if (cmd.includes('list') && cmd.includes('nft')) {
    addLog('Connecting to FV...', 'info');
    return { message: `🖼️ List at fractalvisions.io\n\nListing feature coming soon!` };
  }

  // Collections
  if (cmd === 'collections' || cmd.includes('collection')) {
    addLog('Fetching collections...', 'info');
    try {
      const res = await fetch('/api/activity?type=collections');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        addLog(`✓ ${data.data.length} found`, 'success');
        const list = data.data.slice(0, 4).map(c => `• ${c.name}`).join('\n');
        return { message: `🎨 Collections:\n${list}` };
      }
      return { message: '🎨 No collections yet.' };
    } catch (e) {
      return { error: 'Failed to load' };
    }
  }

  // Balance
  if (cmd === 'balance' || cmd.includes('balance')) {
    if (!walletAddress) return { error: 'No wallet' };
    try {
      addLog('Fetching...', 'info');
      const ganBalance = await publicClient.readContract({
        address: GAN_TOKEN, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress]
      });
      const ethBalance = await publicClient.getBalance({ address: walletAddress });
      addLog('✓ Done', 'success');
      return { message: `💰 ${Number(formatEther(ethBalance)).toFixed(4)} ETH\n${formatGan(ganBalance)} $GAN` };
    } catch (e) {
      return { error: 'Failed to fetch' };
    }
  }

  // NFTs
  if (cmd.includes('nft') && !cmd.includes('list')) {
    return { message: '🖼️ NFT viewer coming soon!' };
  }

  // === NATURAL LANGUAGE ABOUT GANLAND/FV ===
  
  // What is Ganland/GAN
  if (cmd.includes('what is') && (cmd.includes('ganland') || cmd.includes('gan'))) {
    return { message: `🍄 Ganland is an AI-powered NFT ecosystem on Base.\n\n$GAN is our token. I'm the AI agent!` };
  }
  
  // What is Fractal Visions
  if (cmd.includes('what is') && cmd.includes('fractal')) {
    return { message: `✨ Fractal Visions is our NFT marketplace for AI-generated art.\n\nfractalvisions.io` };
  }
  
  // Who made this / founders
  if (cmd.includes('who') && (cmd.includes('made') || cmd.includes('created') || cmd.includes('founder'))) {
    return { message: `🧑‍🎨 Built by @IGLIVISION & @artfractalicia\n\nCofounders of Fractal Visions.` };
  }
  
  // Token info
  if (cmd.includes('token') || cmd.includes('$gan') || cmd.includes('price')) {
    return { message: `💰 $GAN on Base\n\nBuy on Uniswap. Hold 6.9M for terminal access!` };
  }
  
  // How to mint
  if (cmd.includes('how') && cmd.includes('mint')) {
    return { message: `🎨 Minting:\n1. Connect wallet\n2. Pick a collection\n3. Mint!\n\nTry "collections" to see what's available.` };
  }
  
  // Greetings
  if (cmd === 'hi' || cmd === 'hello' || cmd === 'hey' || cmd === 'gm') {
    return { message: `👋 Hey! What can I help you with today?` };
  }

  // === OFF-TOPIC → REDIRECT TO COLLECTIONS ===
  addLog('Redirecting...', 'info');
  return { 
    message: `🍄 I focus on Ganland & Fractal Visions!\n\nTry:\n• "collections" - see NFTs\n• "balance" - check wallet\n• "buy $GAN" - get tokens`
  };
}
