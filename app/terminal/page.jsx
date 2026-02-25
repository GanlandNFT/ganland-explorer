'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, formatEther, parseEther } from 'viem';
import { base } from 'viem/chains';
import Image from 'next/image';

// Constants
const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';
const REQUIRED_GAN = 6900000n * 10n ** 18n;
const FREE_HANDLES = ['iglivision', 'artfractalicia'];
const SUBSCRIPTION_WALLET = '0xDd32A567bc09384057A1F260086618D88b28E64F';
const SUBSCRIPTION_PRICE = 0.015;

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

// Ganland-specific example prompts
const EXAMPLE_PROMPTS = [
  { text: 'show my NFTs', icon: '🖼️' },
  { text: 'mint neural networker', icon: '🎨' },
  { text: 'send 100 $GAN to @user', icon: '💸' },
  { text: 'check my balance', icon: '💰' },
  { text: 'transfer NFT to @user', icon: '📤' },
];

export default function TerminalPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [accessStatus, setAccessStatus] = useState('checking');
  const [ganBalance, setGanBalance] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const xHandle = user?.twitter?.username?.toLowerCase();

  // Check access on auth change
  useEffect(() => {
    async function checkAccess() {
      if (!ready) return;
      
      if (!authenticated) {
        setAccessStatus('login_required');
        return;
      }

      if (xHandle && FREE_HANDLES.includes(xHandle)) {
        setAccessStatus('granted');
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
        const hasSubscription = false; // TODO: implement subscription check
        
        if (hasTokens && hasSubscription) {
          setAccessStatus('granted');
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

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Add message helpers
  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content, timestamp: Date.now() }]);
  };

  // Process command
  const processCommand = async (cmd) => {
    const command = cmd.trim().toLowerCase();
    if (!command) return;

    setShowSuggestions(false);
    addMessage('user', cmd);
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

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    processCommand(input);
    setInput('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (prompt) => {
    processCommand(prompt);
  };

  // Render screens based on access
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

  // Chat-style Terminal UI with Glassmorphism
  return (
    <div className="min-h-[80vh] flex flex-col max-w-3xl mx-auto relative">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-gan-yellow/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Chat Area */}
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10"
        style={{ minHeight: '500px' }}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            {/* GAN Avatar */}
            <div className="w-20 h-20 mb-6 rounded-full overflow-hidden border-2 border-gan-yellow/50 shadow-lg shadow-gan-yellow/20">
              <Image 
                src="/gan-logo.jpg" 
                alt="GAN" 
                width={80} 
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Hey! I'm GAN 👋</h1>
            <p className="text-gray-400 text-center max-w-md mb-8">
              Your AI assistant for Ganland. I can help you manage NFTs, 
              check balances, and interact with the Fractal Visions ecosystem.
            </p>
            
            {/* Glass Suggestion Chips */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(prompt.text)}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 hover:border-gan-yellow/40 rounded-xl transition-all duration-300 shadow-lg"
                >
                  <span className="text-lg">{prompt.icon}</span>
                  <span className="text-sm text-gray-300 group-hover:text-white">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        
        {/* Glass Processing Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20 shadow-lg">
              <Image 
                src="/gan-logo.jpg" 
                alt="GAN" 
                width={32} 
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gan-yellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gan-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gan-yellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Glass Input Area */}
      <div className="sticky bottom-0 bg-black/60 backdrop-blur-2xl border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Ask GAN anything..."
            className="w-full px-5 py-4 pr-14 bg-white/5 backdrop-blur-xl border border-white/20 focus:border-gan-yellow/50 rounded-2xl outline-none text-white placeholder-gray-400 transition-all duration-300 shadow-lg"
            autoFocus
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gan-yellow/90 hover:bg-gan-yellow backdrop-blur-lg disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl transition-all duration-300 shadow-lg"
          >
            <svg className="w-5 h-5 text-black disabled:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        
        {/* User Info */}
        <div className="flex items-center justify-between mt-3 px-2 text-xs text-gray-500">
          <span>@{xHandle || 'anonymous'}</span>
          <span className="text-gan-yellow">{ganBalance ? formatGan(ganBalance) : '—'} $GAN</span>
        </div>
      </div>
    </div>
  );
}

// Chat message component with glassmorphism
function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20 shadow-lg">
          <Image 
            src="/gan-logo.jpg" 
            alt="GAN" 
            width={32} 
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Glass Message Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 backdrop-blur-xl shadow-lg ${
        isUser 
          ? 'rounded-tr-md bg-gan-yellow/80 text-black border border-gan-yellow/50' 
          : 'rounded-tl-md bg-white/10 text-white border border-white/20'
      }`}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
      </div>
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

// Login screen
function LoginScreen({ onLogin }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-gan-yellow/50">
          <Image 
            src="/gan-logo.jpg" 
            alt="GAN" 
            width={96} 
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold mb-4">Hey! I'm GAN 👋</h1>
        <p className="text-gray-400 mb-6">
          Connect with X to chat with me and access the Ganland ecosystem.
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-3 bg-gan-yellow text-black font-bold rounded-xl hover:bg-gan-gold transition-colors"
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
          Please connect a wallet to chat with GAN.
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
        <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-2 border-gray-700 opacity-50">
          <Image 
            src="/gan-logo.jpg" 
            alt="GAN" 
            width={96} 
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold mb-4">Access Required</h1>
        <p className="text-gray-400 mb-6">
          To chat with GAN, you need <strong>both</strong> of the following:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className={`p-6 bg-gray-900/50 border rounded-xl ${hasTokens ? 'border-green-500/50' : 'border-gray-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xl font-bold text-gan-yellow">Hold $GAN</div>
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
              <div className="text-xl font-bold text-purple-400">Subscribe</div>
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
      message: `Here's what I can help you with:

🖼️ NFTs
• show my NFTs — View your collection
• transfer NFT to @user — Send an NFT
• mint neural networker — Mint new art

💰 Wallet
• check my balance — Token balances
• my address — Show your wallet
• send [amt] $GAN to @user — Transfer tokens

🎨 Art
• generate [prompt] — Create AI art

Type any command or ask me in plain English!`
    };
  }

  // Balance
  if (command === 'balance' || command.includes('check') && command.includes('balance')) {
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
        message: `💰 Your Balance

ETH: ${Number(formatEther(ethBalance)).toFixed(6)}
$GAN: ${formatGan(ganBalance)}

Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}
Chain: Base`
      };
    } catch (e) {
      return { error: `Failed to fetch balance: ${e.message}` };
    }
  }

  // My address
  if (command.includes('my address') || command.includes('wallet address')) {
    if (!walletAddress) return { error: 'No wallet connected' };
    return { message: `Your Ganland wallet:\n${walletAddress}` };
  }

  // Show NFTs
  if (command.includes('show my nfts') || command.includes('my nfts') || command.includes('my collection')) {
    return { message: '🖼️ Fetching your NFTs...\n\nThis feature is coming soon! I\'ll be able to show all your NFTs across chains.' };
  }

  // Mint
  if (command.includes('mint')) {
    return { message: '🎨 Minting is coming soon!\n\nI\'ll be able to help you mint from Ganland collections directly from this chat.' };
  }

  // Transfer
  if (command.includes('transfer') && command.includes('nft')) {
    return { message: '📤 NFT transfers coming soon!\n\nYou\'ll be able to send NFTs to any X handle or wallet address.' };
  }

  // Send tokens
  if (command.includes('send') && (command.includes('$gan') || command.includes('gan'))) {
    return { message: '💸 Token transfers coming soon!\n\nI\'ll help you send $GAN to anyone on Ganland.' };
  }

  // Generate art
  if (command.startsWith('generate ')) {
    const prompt = command.replace('generate ', '');
    return { message: `🎨 Art generation coming soon!\n\nPrompt: "${prompt}"\n\nI'll be able to create AI art using Leonardo.ai and mint it as an NFT.` };
  }

  // Fallback - natural language processing
  return { 
    message: `I'm not sure how to help with "${command}" yet.\n\nTry asking me to:\n• show my NFTs\n• check my balance\n• mint neural networker\n\nOr type "help" for all commands.`
  };
}
