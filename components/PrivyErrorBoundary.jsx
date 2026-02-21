'use client';

import React from 'react';

export class PrivyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Privy Error:', error.message);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Show connect button that explains the error
      return this.props.fallback || (
        <button 
          onClick={() => this.setState({ hasError: false, error: null })}
          className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-600"
          title={this.state.error}
        >
          Connect Wallet
        </button>
      );
    }

    return this.props.children;
  }
}

export default PrivyErrorBoundary;
