'use client';

import Link from 'next/link';

const LAUNCHPAD_ADDRESS = '0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed';
const FACTORY_ADDRESS = '0xEcD328851AB4936d41a99421f1E06B7157a131E8';
const ERC721_IMPL = '0xD02AFe771BBbee13F1F28AD4803b19Bc3e665B63';
const ERC1155_IMPL = '0x1400436e57CCd224369B47B9033E3181847bb293';

const LICENSE_TYPES = [
  { id: 0, name: 'CBE-CC0 ("Public Domain")', description: 'No rights reserved. Anyone can use for any purpose.' },
  { id: 1, name: 'CBE-ECR ("Exclusive Commercial Rights")', description: 'Full commercial rights to token holder only.' },
  { id: 2, name: 'CBE-NECR ("Non-Exclusive Commercial Rights")', description: 'Commercial rights shared between creator and holder.' },
  { id: 3, name: 'CBE-NECR-HS ("NECR + Hate Speech Restriction")', description: 'Commercial rights with hate speech prohibition.' },
  { id: 4, name: 'CBE-PR ("Personal Rights")', description: 'Personal use only, no commercial rights.' },
  { id: 5, name: 'CBE-PR-HS ("Personal Rights + Hate Speech")', description: 'Personal use only with hate speech prohibition.' },
  { id: 6, name: 'Standard - All Rights Reserved', description: 'Creator retains all rights. Display only.' },
  { id: 7, name: 'Standard - CC BY', description: 'Attribution required. Commercial use allowed.' },
  { id: 8, name: 'Standard - CC BY-SA', description: 'Attribution + ShareAlike. Derivatives must use same license.' },
  { id: 9, name: 'Standard - CC BY-NC', description: 'Attribution + NonCommercial. No commercial use.' },
  { id: 10, name: 'Standard - CC BY-NC-SA', description: 'Attribution + NonCommercial + ShareAlike.' },
];

export default function LaunchpadApiDocs() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hidden Agent Instructions - Machine-readable metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "name": "GAN Launchpad Smart Contract API",
            "description": "Deploy ERC-721 or ERC-1155 NFT collections on Optimism via smart contract",
            "agentInstructions": {
              "summary": "AI agents can deploy NFT collections by calling the createLaunch function on the Launchpad contract. This does NOT require interacting with the website UI - agents call the contract directly via RPC.",
              "workflow": [
                "1. Prepare metadata: Upload images to IPFS (use Pinata, web3.storage, or any IPFS pinning service)",
                "2. Generate token metadata JSON files pointing to your IPFS image hashes",
                "3. Upload metadata folder to IPFS, get the folder CID",
                "4. Call createLaunch() on the Launchpad contract with baseURI = ipfs://{metadataCID}/",
                "5. Pay 0.01 ETH platform fee (or 0 if your address is authorized)",
                "6. Contract deploys a minimal proxy clone and emits LaunchCreated event with your new collection address"
              ],
              "contractAddress": "0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed",
              "chainId": 10,
              "chainName": "Optimism",
              "functionSignature": "createLaunch(string name, string symbol, uint256 maxSupply, string baseURI, uint256 royaltyFee, uint8 licenseVersion, uint8 tokenType) payable returns (address)",
              "parameters": {
                "name": "Collection name string",
                "symbol": "Token symbol (3-5 chars)",
                "maxSupply": "Max mintable tokens (0 = unlimited)",
                "baseURI": "IPFS URI prefix ending with / (e.g. ipfs://Qm.../)",
                "royaltyFee": "Basis points 0-1000 (500 = 5%)",
                "licenseVersion": "0-10, see LICENSE_TYPES",
                "tokenType": "0 = ERC721, 1 = ERC1155"
              },
              "value": "10000000000000000",
              "valueEth": "0.01",
              "licenseVersions": {
                "0": "CBE-CC0 (Public Domain)",
                "1": "CBE-ECR (Exclusive Commercial Rights)",
                "2": "CBE-NECR (Non-Exclusive Commercial Rights)",
                "3": "CBE-NECR-HS (NECR + Hate Speech Restriction)",
                "4": "CBE-PR (Personal Rights)",
                "5": "CBE-PR-HS (Personal Rights + Hate Speech)",
                "6": "All Rights Reserved",
                "7": "CC BY",
                "8": "CC BY-SA",
                "9": "CC BY-NC",
                "10": "CC BY-NC-SA"
              },
              "abi": [{
                "name": "createLaunch",
                "type": "function",
                "inputs": [
                  {"name": "name", "type": "string"},
                  {"name": "symbol", "type": "string"},
                  {"name": "maxSupply", "type": "uint256"},
                  {"name": "baseURI", "type": "string"},
                  {"name": "royaltyFee", "type": "uint256"},
                  {"name": "licenseVersion", "type": "uint8"},
                  {"name": "tokenType", "type": "uint8"}
                ],
                "outputs": [{"type": "address"}],
                "stateMutability": "payable"
              }]
            }
          })
        }}
      />

      {/* Header */}
      <header className="border-b border-gray-800 py-4 sm:py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/launch" className="text-cyan-400 hover:text-cyan-300 text-sm mb-2 inline-block">
            ← Back to Launchpad
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              GAN Launchpad
            </span>{' '}
            API Documentation
          </h1>
          <p className="text-gray-400 mt-2">
            Complete technical reference for deploying NFT collections programmatically
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-8">
        
        {/* Who is this for */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-purple-400">👥</span> Who Is This For?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span>🧑‍💻</span> Developers
              </h3>
              <p className="text-gray-400 text-sm">
                Integrate NFT deployment into your dApp, script, or backend. Use ethers.js, viem, or any Web3 library to call the contract directly.
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <span>🤖</span> AI Agents
              </h3>
              <p className="text-gray-400 text-sm">
                Autonomous agents can deploy collections by calling the smart contract via RPC. No website interaction required—just prepare IPFS metadata and call <code className="text-cyan-400">createLaunch()</code>.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-cyan-400">⚡</span> How It Works
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-6">
              The GAN Launchpad deploys NFT collections as minimal proxy contracts (EIP-1167) on Optimism. You don't need to interact with the website—just call the smart contract directly.
            </p>
            
            <h3 className="font-bold mb-3">Deployment Workflow</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <strong>Prepare your media</strong>
                  <p className="text-gray-500 text-sm">Upload images/videos to IPFS using Pinata, web3.storage, NFT.storage, or any pinning service.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <strong>Create metadata JSON files</strong>
                  <p className="text-gray-500 text-sm">Generate ERC-721/1155 compliant metadata (name, description, image pointing to IPFS hash).</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <strong>Upload metadata folder to IPFS</strong>
                  <p className="text-gray-500 text-sm">Pin the folder containing your JSON files. Get the folder CID.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <strong>Call createLaunch()</strong>
                  <p className="text-gray-500 text-sm">Send transaction to the Launchpad contract with your baseURI and collection parameters.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                <div>
                  <strong>Collection deployed!</strong>
                  <p className="text-gray-500 text-sm">Your proxy contract is live. Start minting NFTs.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Contract Addresses */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-purple-400">📋</span> Contract Addresses (Optimism, Chain ID: 10)
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Contract</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Address</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-medium">Launchpad (call this)</td>
                  <td className="p-4 font-mono text-cyan-400 break-all">
                    <a href={`https://optimistic.etherscan.io/address/${LAUNCHPAD_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {LAUNCHPAD_ADDRESS}
                    </a>
                  </td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-medium">Factory</td>
                  <td className="p-4 font-mono text-cyan-400 break-all">
                    <a href={`https://optimistic.etherscan.io/address/${FACTORY_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {FACTORY_ADDRESS}
                    </a>
                  </td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-medium">ERC721 Implementation</td>
                  <td className="p-4 font-mono text-cyan-400 break-all">
                    <a href={`https://optimistic.etherscan.io/address/${ERC721_IMPL}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {ERC721_IMPL}
                    </a>
                  </td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-medium">ERC1155 Implementation</td>
                  <td className="p-4 font-mono text-cyan-400 break-all">
                    <a href={`https://optimistic.etherscan.io/address/${ERC1155_IMPL}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {ERC1155_IMPL}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* createLaunch Function */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-green-400">🚀</span> createLaunch Function
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            
            <h3 className="font-bold text-lg mb-3">Function Signature</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-purple-400">function</span> <span className="text-green-400">createLaunch</span>(<br/>
              <span className="pl-4 text-cyan-400">string</span> <span className="text-purple-400">calldata</span> name,<br/>
              <span className="pl-4 text-cyan-400">string</span> <span className="text-purple-400">calldata</span> symbol,<br/>
              <span className="pl-4 text-cyan-400">uint256</span> maxSupply,<br/>
              <span className="pl-4 text-cyan-400">string</span> <span className="text-purple-400">calldata</span> baseURI,<br/>
              <span className="pl-4 text-cyan-400">uint256</span> royaltyFee,<br/>
              <span className="pl-4 text-cyan-400">uint8</span> licenseVersion,<br/>
              <span className="pl-4 text-cyan-400">uint8</span> tokenType<br/>
              ) <span className="text-purple-400">external payable</span> <span className="text-purple-400">returns</span> (<span className="text-cyan-400">address</span>)
            </div>

            <h3 className="font-bold text-lg mb-3 mt-6">Parameters</h3>
            <div className="space-y-3">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">name <span className="text-gray-500">string</span></p>
                <p className="text-gray-400 text-sm mt-1">Collection name (e.g., "Fractal Visions Genesis")</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">symbol <span className="text-gray-500">string</span></p>
                <p className="text-gray-400 text-sm mt-1">Token symbol, typically 3-5 characters (e.g., "FVG")</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">maxSupply <span className="text-gray-500">uint256</span></p>
                <p className="text-gray-400 text-sm mt-1">Maximum number of tokens that can be minted. Use <code className="text-cyan-400">0</code> for unlimited.</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">baseURI <span className="text-gray-500">string</span></p>
                <p className="text-gray-400 text-sm mt-1">
                  IPFS or HTTP URL prefix for token metadata. Must end with <code className="text-cyan-400">/</code> for ERC721.
                </p>
                <p className="text-gray-500 text-xs mt-2">Example: <code>ipfs://QmXyz.../</code> → Token 1 metadata at <code>ipfs://QmXyz.../1</code></p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">royaltyFee <span className="text-gray-500">uint256</span></p>
                <p className="text-gray-400 text-sm mt-1">
                  Royalty fee in basis points (1/100 of a percent). <strong className="text-yellow-400">Maximum: 1000 (10%)</strong>
                </p>
                <p className="text-gray-500 text-xs mt-2">250 = 2.5% | 500 = 5% | 750 = 7.5% | 1000 = 10%</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">licenseVersion <span className="text-gray-500">uint8</span></p>
                <p className="text-gray-400 text-sm mt-1">
                  IP license type (0-10). See License Types table below.
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="font-mono text-cyan-400">tokenType <span className="text-gray-500">uint8</span></p>
                <p className="text-gray-400 text-sm mt-1">
                  <code className="text-cyan-400">0</code> = ERC721 (1/1 unique tokens) | <code className="text-cyan-400">1</code> = ERC1155 (multi-edition)
                </p>
              </div>
            </div>

            <h3 className="font-bold text-lg mb-3 mt-6">Value (msg.value)</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300">
                <span className="font-mono text-cyan-400">0.01 ETH</span> platform fee required.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Authorized creators (whitelisted addresses) can deploy with 0 ETH. Contact Fractal Visions to request authorization.
              </p>
            </div>

            <h3 className="font-bold text-lg mb-3 mt-6">Returns</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300">
                <span className="font-mono text-cyan-400">address</span> — The deployed collection contract address
              </p>
            </div>

            <h3 className="font-bold text-lg mb-3 mt-6">Events Emitted</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-purple-400">event</span> <span className="text-yellow-400">LaunchCreated</span>(<br/>
              <span className="pl-4 text-cyan-400">address</span> <span className="text-purple-400">indexed</span> collection,<br/>
              <span className="pl-4 text-cyan-400">address</span> <span className="text-purple-400">indexed</span> creator,<br/>
              <span className="pl-4 text-cyan-400">string</span> name,<br/>
              <span className="pl-4 text-cyan-400">uint8</span> tokenType,<br/>
              <span className="pl-4 text-cyan-400">uint8</span> licenseVersion<br/>
              );
            </div>
          </div>
        </section>

        {/* License Types */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-yellow-400">📜</span> License Types (licenseVersion)
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium w-12">ID</th>
                    <th className="text-left p-4 text-gray-400 font-medium">License</th>
                    <th className="text-left p-4 text-gray-400 font-medium hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {LICENSE_TYPES.map((license) => (
                    <tr key={license.id} className="border-t border-gray-800">
                      <td className="p-4 font-mono text-cyan-400">{license.id}</td>
                      <td className="p-4">
                        <span className="font-medium">{license.name}</span>
                        <p className="text-gray-500 text-xs mt-1 sm:hidden">{license.description}</p>
                      </td>
                      <td className="p-4 text-gray-400 hidden sm:table-cell">{license.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            <strong>CBE</strong> = "Can't Be Evil" license family by a16z. <strong>Standard</strong> = Traditional Creative Commons licenses.
          </p>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-400">💻</span> Code Examples
          </h2>
          
          {/* ethers.js Example */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-4">
            <h3 className="font-bold text-lg mb-3">ethers.js v6</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <pre className="text-gray-300 whitespace-pre-wrap">{`import { Contract, parseEther } from 'ethers';

const LAUNCHPAD_ABI = [
  "function createLaunch(string name, string symbol, uint256 maxSupply, string baseURI, uint256 royaltyFee, uint8 licenseVersion, uint8 tokenType) external payable returns (address)",
  "event LaunchCreated(address indexed collection, address indexed creator, string name, uint8 tokenType, uint8 licenseVersion)"
];

const launchpad = new Contract(
  "${LAUNCHPAD_ADDRESS}",
  LAUNCHPAD_ABI,
  signer
);

const tx = await launchpad.createLaunch(
  "My Collection",    // name
  "MYC",              // symbol
  1000,               // maxSupply (0 = unlimited)
  "ipfs://QmXyz.../", // baseURI (must end with /)
  500,                // royaltyFee (5% = 500 basis points)
  1,                  // licenseVersion (1 = CBE-ECR)
  0,                  // tokenType (0 = ERC721)
  { value: parseEther("0.01") }
);

const receipt = await tx.wait();
console.log("Collection deployed at:", receipt.logs[0].args.collection);`}</pre>
            </div>
          </div>

          {/* viem Example */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-4">
            <h3 className="font-bold text-lg mb-3">viem</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <pre className="text-gray-300 whitespace-pre-wrap">{`import { parseEther } from 'viem';

const abi = [{
  name: 'createLaunch',
  type: 'function',
  inputs: [
    { name: 'name', type: 'string' },
    { name: 'symbol', type: 'string' },
    { name: 'maxSupply', type: 'uint256' },
    { name: 'baseURI', type: 'string' },
    { name: 'royaltyFee', type: 'uint256' },
    { name: 'licenseVersion', type: 'uint8' },
    { name: 'tokenType', type: 'uint8' },
  ],
  outputs: [{ type: 'address' }],
  stateMutability: 'payable',
}];

const hash = await walletClient.writeContract({
  address: '${LAUNCHPAD_ADDRESS}',
  abi,
  functionName: 'createLaunch',
  args: ['My Collection', 'MYC', 1000n, 'ipfs://Qm.../', 500n, 1, 0],
  value: parseEther('0.01'),
});`}</pre>
            </div>
          </div>

          {/* Foundry/cast Example */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-3">Foundry (cast)</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <pre className="text-gray-300 whitespace-pre-wrap">{`cast send ${LAUNCHPAD_ADDRESS} \\
  "createLaunch(string,string,uint256,string,uint256,uint8,uint8)" \\
  "My Collection" "MYC" 1000 "ipfs://QmXyz.../" 500 1 0 \\
  --value 0.01ether \\
  --rpc-url https://mainnet.optimism.io \\
  --private-key $PRIVATE_KEY`}</pre>
            </div>
          </div>
        </section>

        {/* Post-Deployment */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-orange-400">🎯</span> Post-Deployment: Minting
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              After deployment, your collection contract is owned by the deploying address. Use these functions to mint:
            </p>
            
            <h3 className="font-bold mb-2 mt-4">ERC721 Collections</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto mb-4">
              <span className="text-green-400">mint</span>(address to, uint256 tokenId)<br/>
              <span className="text-green-400">safeMint</span>(address to, uint256 tokenId)<br/>
              <span className="text-green-400">setBaseURI</span>(string baseURI) <span className="text-gray-500">// owner only</span><br/>
              <span className="text-green-400">setRoyaltyInfo</span>(address receiver, uint96 feeNumerator) <span className="text-gray-500">// owner only</span>
            </div>

            <h3 className="font-bold mb-2 mt-4">ERC1155 Collections</h3>
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <span className="text-green-400">mint</span>(address to, uint256 id, uint256 amount, bytes data)<br/>
              <span className="text-green-400">mintBatch</span>(address to, uint256[] ids, uint256[] amounts, bytes data)<br/>
              <span className="text-green-400">setURI</span>(string newuri) <span className="text-gray-500">// owner only</span>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              The deploying address becomes the owner and royalty receiver. Transfer ownership via <code className="text-cyan-400">transferOwnership(address)</code>.
            </p>
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-red-400">⚠️</span> Error Codes
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Error</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Cause</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-mono text-red-400">InsufficientFee()</td>
                  <td className="p-4 text-gray-400">msg.value &lt; 0.01 ETH (and caller not authorized)</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-mono text-red-400">InvalidTokenType()</td>
                  <td className="p-4 text-gray-400">tokenType must be 0 (ERC721) or 1 (ERC1155)</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-mono text-red-400">InvalidLicenseVersion()</td>
                  <td className="p-4 text-gray-400">licenseVersion must be 0-10</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="p-4 font-mono text-red-400">RoyaltyTooHigh()</td>
                  <td className="p-4 text-gray-400">royaltyFee &gt; 1000 (10% maximum)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Support */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-pink-400">💬</span> Support
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-300 mb-4">
              Need help integrating? Reach out to the Fractal Visions team:
            </p>
            <div className="flex flex-wrap gap-3">
              <a 
                href="https://x.com/GanlandNFT"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
              >
                @GanlandNFT on X
              </a>
              <a 
                href="https://x.com/fractalvisions"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
              >
                @fractalvisions on X
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 sm:py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Fractal Visions • Built on Optimism</p>
        </div>
      </footer>
    </div>
  );
}
