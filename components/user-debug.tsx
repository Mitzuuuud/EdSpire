'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export function UserDebug() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [firestoreData, setFirestoreData] = useState<any>(null)

  useEffect(() => {
    const checkUser = () => {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          setCurrentUser(user)
        } else {
          setCurrentUser(null)
        }
      } catch (e) {
        console.error('Debug: Failed to load user:', e)
        setCurrentUser(null)
      }
    }

    // Initial check
    checkUser()

    // Listen for storage changes
    const handleStorageChange = () => {
      checkUser()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('localStorageChange', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleStorageChange)
    }
  }, [])

  // Subscribe to Firestore data for current user
  useEffect(() => {
    if (!currentUser) {
      setFirestoreData(null)
      return
    }

    const userRef = doc(db, "users", currentUser.uid)
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setFirestoreData(snap.data())
      } else {
        setFirestoreData({ _exists: false })
      }
    })

    return unsub
  }, [currentUser])

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 border rounded shadow-lg text-xs max-w-xs z-50">
      <div className="font-bold mb-2">User Debug</div>
      
      {/* localStorage user */}
      <div className="mb-2">
        <div className="font-semibold">localStorage:</div>
        {currentUser ? (
          <div>
            <div>UID: {currentUser.uid}</div>
            <div>Email: {currentUser.email}</div>
            <div>Role: {currentUser.role}</div>
          </div>
        ) : (
          <div className="text-red-600">No user in localStorage</div>
        )}
      </div>

      {/* Firestore data */}
      <div>
        <div className="font-semibold">Firestore:</div>
        {firestoreData ? (
          firestoreData._exists === false ? (
            <div className="text-red-600">Document doesn't exist</div>
          ) : (
            <div>
              <div>Token Balance: {firestoreData.tokenBalance ?? 'undefined'}</div>
              <div>Wallet: {firestoreData.walletAddress ? firestoreData.walletAddress.slice(0, 8) + '...' : 'none'}</div>
            </div>
          )
        ) : (
          <div className="text-gray-500">Not subscribed</div>
        )}
      </div>
    </div>
  )
}