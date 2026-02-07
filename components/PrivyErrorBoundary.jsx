'use client';

import React from 'react';

export class PrivyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Privy component error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
          Loading wallet...
        </div>
      );
    }

    return this.props.children;
  }
}

export default PrivyErrorBoundary;
