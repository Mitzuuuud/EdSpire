import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getTokenBalance } from '@/lib/blockchain';

export async function POST(request: NextRequest) {
  try {
    // MITIGATION 1: Enforce authentication at API layer
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing token' },
        { status: 401 }
      );
    }

    // MITIGATION 2: Verify Firebase ID token
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const authenticatedUid = decodedToken.uid;

    // MITIGATION 3: Extract wallet address from request
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // MITIGATION 4: Retrieve user's verified wallet from Firestore
    const userDoc = await adminDb
      .collection('users')
      .doc(authenticatedUid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const verifiedWallet = userData?.walletAddress;

    // MITIGATION 5: Validate wallet ownership (case-insensitive)
    if (!verifiedWallet || 
        verifiedWallet.toLowerCase() !== walletAddress.toLowerCase()) {
      // Log security violation for monitoring
      console.warn(`[SECURITY] UID ${authenticatedUid} attempted to sync ` +
                   `wallet ${walletAddress} but owns ${verifiedWallet}`);
      
      return NextResponse.json(
        { error: 'Wallet address does not match authenticated user' },
        { status: 403 }
      );
    }

    // MITIGATION 6: Perform blockchain sync with validated address
    const balance = await getTokenBalance(walletAddress);

    // MITIGATION 7: Update only the authenticated user's document
    await adminDb.collection('users').doc(authenticatedUid).update({
      balance: balance.toString(),
      lastSync: new Date().toISOString(),
      syncedWallet: walletAddress.toLowerCase()
    });

    // MITIGATION 8: Return success without exposing sensitive details
    return NextResponse.json({
      success: true,
      balance: balance.toString()
    });

  } catch (error) {
    // MITIGATION 9: Generic error messages to prevent information leakage
    console.error('[SYNC ERROR]', error);
    return NextResponse.json(
      { error: 'Sync operation failed' },
      { status: 500 }
    );
  }
}
