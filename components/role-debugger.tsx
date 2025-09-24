'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RoleDebugger() {
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Check localStorage
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('user');
    
    setCurrentRole(role);
    if (user) {
      try {
        setUserInfo(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  const clearStorage = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    setCurrentRole(null);
    setUserInfo(null);
    window.location.reload();
  };

  const testRoute = (role: 'user' | 'tutor') => {
    localStorage.setItem('userRole', role);
    const route = role === 'tutor' ? '/tutor/dashboard' : '/dashboard';
    window.location.href = route;
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Role Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>Current Role:</strong> {currentRole || 'Not set'}</p>
          <p><strong>User Info:</strong></p>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {userInfo ? JSON.stringify(userInfo, null, 2) : 'Not set'}
          </pre>
        </div>
        
        <div className="space-y-2">
          <Button onClick={() => testRoute('user')} className="w-full">
            Test Student Route
          </Button>
          <Button onClick={() => testRoute('tutor')} className="w-full">
            Test Tutor Route
          </Button>
          <Button onClick={clearStorage} variant="destructive" className="w-full">
            Clear Storage & Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}