import { NextResponse } from 'next/server';
import { checkTerminalAccess, logTerminalAccess, upsertUser } from '../../../../lib/terminal-access';

export async function POST(request) {
  try {
    const { xHandle, xId, walletAddress, ganBalance, privyUserId } = await request.json();

    // Upsert user record
    if (xHandle && walletAddress) {
      await upsertUser(xHandle, xId, walletAddress, privyUserId);
    }

    // Check access
    const access = await checkTerminalAccess(xHandle, walletAddress, ganBalance);

    // Log access attempt
    await logTerminalAccess(xHandle, walletAddress, access.reason, ganBalance);

    return NextResponse.json(access);
  } catch (error) {
    console.error('Terminal access check failed:', error);
    return NextResponse.json(
      { granted: false, reason: 'error', message: error.message },
      { status: 500 }
    );
  }
}
