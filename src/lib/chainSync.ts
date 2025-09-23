// src/lib/chainSync.ts
import { db } from "./firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { ethers } from "ethers";

const GATEWAY_ADDRESS = "0xaaFf27Be8e0d72c601eaee90fDb5D4B23a5c8387";
const GATEWAY_ABI = [
  "function tokenBalanceOf(address) view returns (uint256)",
  "function rawDepositWeiOf(address) view returns (uint256)",
];

export function listenUserDoc(address: string, onData: (d: any) => void) {
  const ref = doc(db, "users", address.toLowerCase());
  return onSnapshot(ref, (snap) => onData(snap.exists() ? snap.data() : null));
}

export async function syncOnChainToFirestore(provider: ethers.Provider, address: string) {
  const contract = new ethers.Contract(GATEWAY_ADDRESS, GATEWAY_ABI, provider);
  const [tokens, rawWei] = await Promise.all([
    contract.tokenBalanceOf(address),
    contract.rawDepositWeiOf(address),
  ]);
  const ref = doc(db, "users", address.toLowerCase());
  await setDoc(
    ref,
    {
      tokenBalance: Number(tokens.toString()),
      rawDepositWei: rawWei.toString(),
      lastChainSyncAt: serverTimestamp(),
    },
    { merge: true }
  );
}
