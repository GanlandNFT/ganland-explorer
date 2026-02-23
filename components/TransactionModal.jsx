'use client';

import { useState } from 'react';
import { formatEther } from 'viem';

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transaction,
  walletAddress,
  isLoading 
}) {
  if (!isOpen) return null;

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatValue = (value) => {
    if (!value) return '0';
    try {
      return parseFloat(formatEther(value)).toFixed(4);
    } catch {
      return '0';
    }
  };

  return (
    <>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          background: #111;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          width: 100%;
          max-width: 380px;
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          padding: 20px 20px 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .close-btn {
          background: #222;
          border: none;
          color: #666;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: #333;
          color: #fff;
        }
        
        .modal-body {
          padding: 24px 20px;
        }
        
        .title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }
        
        .subtitle {
          font-size: 0.85rem;
          color: #666;
        }
        
        .details {
          margin-top: 24px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #1a1a1a;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          color: #666;
          font-size: 0.9rem;
        }
        
        .detail-value {
          color: #fff;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: right;
        }
        
        .detail-value.highlight {
          color: #d4a84b;
          font-size: 1.1rem;
        }
        
        .detail-value.success {
          color: #10b981;
        }
        
        .wallet-row {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 10px;
          padding: 14px 16px;
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .wallet-label {
          font-size: 0.8rem;
          color: #555;
        }
        
        .wallet-address {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.9rem;
          color: #888;
        }
        
        .modal-footer {
          padding: 0 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .confirm-btn {
          width: 100%;
          padding: 16px;
          border-radius: 10px;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: linear-gradient(135deg, #d4a84b 0%, #b8923f 100%);
          color: #000;
        }
        
        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(212, 168, 75, 0.3);
        }
        
        .confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .cancel-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #2a2a2a;
          background: transparent;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #888;
        }
        
        .cancel-btn:hover {
          background: #1a1a1a;
          color: #fff;
        }
        
        .powered-by {
          text-align: center;
          padding: 16px 20px;
          border-top: 1px solid #1a1a1a;
          font-size: 0.75rem;
          color: #444;
        }
        
        .powered-by span {
          color: #5ce1e6;
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #000;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="title">Approve Transaction</h2>
              <p className="subtitle">Confirm to mint your Neural Networker</p>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="details">
              <div className="detail-row">
                <span className="detail-label">Amount</span>
                <span className="detail-value highlight">{formatValue(transaction?.value)} ETH</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">To</span>
                <span className="detail-value">{truncateAddress(transaction?.to)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Network</span>
                <span className="detail-value success">Base</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Est. Fee</span>
                <span className="detail-value">~$0.01</span>
              </div>
            </div>
            
            <div className="wallet-row">
              <span className="wallet-label">Pay with</span>
              <span className="wallet-address">{truncateAddress(walletAddress)}</span>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="confirm-btn" 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner"></span>Confirming...</>
              ) : (
                'Confirm & Mint'
              )}
            </button>
            <button className="cancel-btn" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          </div>
          
          <div className="powered-by">
            Secured by <span>Ganland</span> on Base
          </div>
        </div>
      </div>
    </>
  );
}
