import { NextResponse } from 'next/server';
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const db = getFirestore(app)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, userUID, tokenBalance } = body;

    if (!walletAddress || !userUID || tokenBalance === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: walletAddress, userUID, tokenBalance' 
      }, { status: 400 });
    }

    // Get the user document
    const userRef = doc(db, 'users', userUID);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ 
        error: `User document not found for UID: ${userUID}` 
      }, { status: 404 });
    }

    const userData = userSnap.data();

    // Update the user document with wallet address and token balance
    await setDoc(userRef, {
      ...userData,
      walletAddress: walletAddress.toLowerCase(),
      tokenBalance: Number(tokenBalance),
      lastChainSyncAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      migratedTokensFrom: walletAddress, // For audit trail
    }, { merge: true });

    return NextResponse.json({
      message: 'Successfully linked wallet and tokens to user',
      userUID,
      email: userData.email,
      walletAddress,
      tokenBalance: Number(tokenBalance)
    });

  } catch (error: any) {
    console.error('Token linking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Token Linking API',
    usage: 'POST with {"walletAddress": "0x...", "userUID": "...", "tokenBalance": 24} to link tokens to user'
  });
}