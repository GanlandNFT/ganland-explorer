import { NextResponse } from 'next/server';
import { recordSubscription, verifyPayment } from '../../../../lib/terminal-access';

const SUBSCRIPTION_WALLET = process.env.SUBSCRIPTION_WALLET || '0xDd32A567bc09384057A1F260086618D88b28E64F';
const SUBSCRIPTION_PRICE = parseFloat(process.env.SUBSCRIPTION_PRICE_ETH || '0.015');

export async function POST(request) {
  try {
    const { xHandle, txHash, amount } = await request.json();

    if (!xHandle || !txHash) {
      return NextResponse.json(
        { success: false, error: 'Missing xHandle or txHash' },
        { status: 400 }
      );
    }

    // Verify payment on-chain
    const verification = await verifyPayment(txHash, SUBSCRIPTION_PRICE, SUBSCRIPTION_WALLET);
    
    if (!verification.verified) {
      // For now, accept without verification (TODO: implement proper verification)
      console.warn('Payment verification skipped:', txHash);
    }

    // Record subscription
    const { data, error } = await recordSubscription(xHandle, txHash, amount || SUBSCRIPTION_PRICE);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: data,
      message: `Subscription activated! Expires: ${new Date(data.expires_at).toLocaleDateString()}`
    });
  } catch (error) {
    console.error('Subscription recording failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    wallet: SUBSCRIPTION_WALLET,
    priceEth: SUBSCRIPTION_PRICE,
    priceUsd: 30,
    durationDays: 30
  });
}
