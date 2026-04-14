'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugDietPlanPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/test-client', {
        headers: {
          'x-user-id': user?.id?.toString() || '0'
        }
      });
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testDietPlanCreation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '0'
        },
        body: JSON.stringify({
          clientId: 3,
          weekStart: new Date().toISOString().split('T')[0],
          meals: {
            Monday: {
              breakfast: {
                time: '08:00',
                items: [{ name: 'Test Item', portions: '1 serving' }]
              }
            }
          }
        })
      });
      const data = await response.json();
      setDebugInfo({ ...debugInfo, dietPlanCreation: data });
    } catch (error) {
      setDebugInfo({ ...debugInfo, dietPlanCreationError: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Diet Plan Debug Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm font-mono">
                Current User ID: <strong>{user?.id || 'Not logged in'}</strong>
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={runDebugTest} disabled={loading}>
                {loading ? 'Loading...' : 'Run Debug Test'}
              </Button>
              <Button onClick={testDietPlanCreation} disabled={loading} variant="outline">
                {loading ? 'Testing...' : 'Test Diet Plan Creation'}
              </Button>
            </div>

            {debugInfo && (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
                <h3 className="font-semibold mb-2">Debug Results:</h3>
                <pre className="text-xs overflow-auto max-h-96 bg-white dark:bg-gray-900 p-4 rounded">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
