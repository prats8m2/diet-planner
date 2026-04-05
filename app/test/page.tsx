'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TestCase {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export default function TestPage() {
  const [tests, setTests] = useState<TestCase[]>([
    { name: 'Create test client', status: 'pending' },
    { name: 'Verify client was created', status: 'pending' },
    { name: 'Create diet plan for client', status: 'pending' },
    { name: 'Add breakfast meal', status: 'pending' },
    { name: 'Add lunch meal', status: 'pending' },
    { name: 'Add dinner meal', status: 'pending' },
    { name: 'Copy meal to next day', status: 'pending' },
    { name: 'Update existing meal', status: 'pending' },
    { name: 'Delete a meal', status: 'pending' },
    { name: 'Export diet plan as PDF', status: 'pending' },
    { name: 'Create meal template', status: 'pending' },
    { name: 'Clean up test data', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [testClientId, setTestClientId] = useState<number | null>(null);
  const [testDietPlanId, setTestDietPlanId] = useState<number | null>(null);
  const [testTemplateId, setTestTemplateId] = useState<number | null>(null);

  const updateTestStatus = (index: number, status: TestCase['status'], error?: string) => {
    setTests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, error };
      return updated;
    });
  };

  const runTests = async () => {
    setIsRunning(true);

    try {
      // Test 1: Create test client
      updateTestStatus(0, 'running');
      const createClientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Client - Auto Test',
          metrics: {
            weight: 70,
            height: 170,
            age: 30,
            bloodGroup: 'O+',
            goal: 'Weight Loss',
            allergies: 'Peanuts',
            notes: 'Automated test client'
          }
        })
      });

      if (!createClientResponse.ok) {
        throw new Error('Failed to create test client');
      }

      const client = await createClientResponse.json();
      setTestClientId(client.id);
      updateTestStatus(0, 'passed');

      // Test 2: Verify client was created
      updateTestStatus(1, 'running');

      // Add a small delay to ensure database is consistent
      await new Promise(resolve => setTimeout(resolve, 100));

      const getClientResponse = await fetch(`/api/clients/${client.id}`);
      if (!getClientResponse.ok) {
        const errorText = await getClientResponse.text();
        throw new Error(`Failed to retrieve created client (Status: ${getClientResponse.status}, Error: ${errorText})`);
      }

      const clientData = await getClientResponse.json();
      if (!clientData.client || clientData.client.name !== 'Test Client - Auto Test') {
        throw new Error(`Client data mismatch. Expected: 'Test Client - Auto Test', Got: ${clientData.client?.name}`);
      }
      updateTestStatus(1, 'passed');

      // Test 3: Create diet plan
      updateTestStatus(2, 'running');
      const weekStart = new Date().toISOString().split('T')[0];
      const meals = {
        'Monday': {
          breakfast: {
            time: '08:00',
            items: 'Oatmeal with berries\n1 cup green tea',
            portions: '1 bowl',
            calories: 350,
            notes: 'Test breakfast'
          }
        }
      };

      const createPlanResponse = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          weekStart,
          meals
        })
      });

      if (!createPlanResponse.ok) {
        throw new Error('Failed to create diet plan');
      }

      const dietPlan = await createPlanResponse.json();
      setTestDietPlanId(dietPlan.id);
      updateTestStatus(2, 'passed');

      // Test 4: Verify breakfast meal exists
      updateTestStatus(3, 'running');
      if (!dietPlan.meals.Monday?.breakfast) {
        throw new Error('Breakfast meal not found');
      }
      if (dietPlan.meals.Monday.breakfast.items !== 'Oatmeal with berries\n1 cup green tea') {
        throw new Error('Breakfast items mismatch');
      }
      updateTestStatus(3, 'passed');

      // Test 5: Add lunch meal
      updateTestStatus(4, 'running');
      const updatedMealsWithLunch = {
        ...dietPlan.meals,
        'Monday': {
          ...dietPlan.meals.Monday,
          lunch: {
            time: '13:00',
            items: 'Grilled chicken salad\nBrown rice\nLentil soup',
            portions: '1 plate',
            calories: 550,
            notes: 'High protein lunch'
          }
        }
      };

      const addLunchResponse = await fetch(`/api/diet-plans/${dietPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: updatedMealsWithLunch })
      });

      if (!addLunchResponse.ok) {
        throw new Error('Failed to add lunch meal');
      }
      updateTestStatus(4, 'passed');

      // Test 6: Add dinner meal
      updateTestStatus(5, 'running');
      const updatedMealsWithDinner = {
        ...updatedMealsWithLunch,
        'Monday': {
          ...updatedMealsWithLunch.Monday,
          dinner: {
            time: '19:00',
            items: 'Grilled fish\nSteamed vegetables\nQuinoa',
            portions: '1 plate',
            calories: 450,
            notes: 'Light dinner'
          }
        }
      };

      const addDinnerResponse = await fetch(`/api/diet-plans/${dietPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: updatedMealsWithDinner })
      });

      if (!addDinnerResponse.ok) {
        throw new Error('Failed to add dinner meal');
      }
      updateTestStatus(5, 'passed');

      // Test 7: Copy meal to next day
      updateTestStatus(6, 'running');
      const mealsWithCopy = {
        ...updatedMealsWithDinner,
        'Tuesday': {
          breakfast: { ...updatedMealsWithDinner.Monday.breakfast }
        }
      };

      const copyMealResponse = await fetch(`/api/diet-plans/${dietPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: mealsWithCopy })
      });

      if (!copyMealResponse.ok) {
        throw new Error('Failed to copy meal to next day');
      }

      const copyResult = await copyMealResponse.json();
      if (!copyResult.meals.Tuesday?.breakfast) {
        throw new Error('Meal copy failed - Tuesday breakfast missing');
      }
      updateTestStatus(6, 'passed');

      // Test 8: Update existing meal
      updateTestStatus(7, 'running');
      const updatedMeals = {
        ...mealsWithCopy,
        'Monday': {
          ...mealsWithCopy.Monday,
          breakfast: {
            ...mealsWithCopy.Monday.breakfast,
            items: 'Updated oatmeal with almond milk\nBlueberries\nChia seeds',
            notes: 'Updated breakfast'
          }
        }
      };

      const updateMealResponse = await fetch(`/api/diet-plans/${dietPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: updatedMeals })
      });

      if (!updateMealResponse.ok) {
        throw new Error('Failed to update meal');
      }

      const updateResult = await updateMealResponse.json();
      if (!updateResult.meals.Monday.breakfast.items.includes('Updated oatmeal')) {
        throw new Error('Meal update failed');
      }
      updateTestStatus(7, 'passed');

      // Test 9: Delete a meal
      updateTestStatus(8, 'running');
      const mealsAfterDelete = { ...updatedMeals };
      delete mealsAfterDelete.Monday.dinner;

      const deleteMealResponse = await fetch(`/api/diet-plans/${dietPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals: mealsAfterDelete })
      });

      if (!deleteMealResponse.ok) {
        throw new Error('Failed to delete meal');
      }

      const deleteResult = await deleteMealResponse.json();
      if (deleteResult.meals.Monday.dinner) {
        throw new Error('Meal delete failed');
      }
      updateTestStatus(8, 'passed');

      // Test 10: Export PDF
      updateTestStatus(9, 'running');
      const pdfResponse = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: clientData.client,
          dietPlan: deleteResult
        })
      });

      if (!pdfResponse.ok) {
        throw new Error('Failed to export PDF');
      }

      const pdfBlob = await pdfResponse.blob();
      if (pdfBlob.type !== 'application/pdf') {
        throw new Error('PDF export returned wrong content type');
      }
      updateTestStatus(9, 'passed');

      // Test 11: Create meal template
      updateTestStatus(10, 'running');
      const templateResponse = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Template - Auto',
          meals: {
            breakfast: {
              time: '08:00',
              items: 'Template breakfast items'
            }
          }
        })
      });

      if (!templateResponse.ok) {
        throw new Error('Failed to create template');
      }

      const template = await templateResponse.json();
      setTestTemplateId(template.id);
      updateTestStatus(10, 'passed');

      // Test 12: Clean up
      updateTestStatus(11, 'running');
      const deleteTemplateResponse = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE'
      });

      const deleteClientResponse = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE'
      });

      if (!deleteTemplateResponse.ok || !deleteClientResponse.ok) {
        throw new Error('Failed to clean up test data');
      }
      updateTestStatus(11, 'passed');

    } catch (error) {
      const failedTestIndex = tests.findIndex(t => t.status === 'running');
      if (failedTestIndex !== -1) {
        updateTestStatus(failedTestIndex, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const resetTests = () => {
    setTests(tests.map(t => ({ ...t, status: 'pending' as const, error: undefined })));
    setTestClientId(null);
    setTestDietPlanId(null);
    setTestTemplateId(null);
  };

  const allPassed = tests.every(t => t.status === 'passed');
  const hasFailed = tests.some(t => t.status === 'failed');
  const completed = tests.every(t => t.status === 'passed' || t.status === 'failed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Automated Test Suite
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tests all core functionality of the Diet Planner app
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Status</CardTitle>
          </CardHeader>
          <CardContent>
            {completed && allPassed && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">All Tests Passed! ✅</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    All {tests.length} test cases passed successfully
                  </p>
                </div>
              </div>
            )}

            {completed && hasFailed && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">Some Tests Failed ❌</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {tests.filter(t => t.status === 'failed').length} of {tests.length} tests failed
                  </p>
                </div>
              </div>
            )}

            {!completed && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Tests Ready</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Click run to execute all test cases
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Cases</CardTitle>
            <CardDescription>
              {tests.filter(t => t.status === 'passed').length} / {tests.length} passed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tests.map((test, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    test.status === 'passed' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
                    test.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                    test.status === 'running' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                    'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {test.status === 'passed' && <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    {test.status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />}
                    {test.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                    <span className={test.status === 'failed' ? 'text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-white'}>
                      {test.name}
                    </span>
                  </div>
                  {test.status === 'failed' && (
                    <span className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                      {test.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
          <Button
            onClick={resetTests}
            variant="outline"
            disabled={isRunning}
          >
            Reset
          </Button>
        </div>

        {/* Test IDs for debugging */}
        {(testClientId || testDietPlanId || testTemplateId) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              {testClientId && <p>Client ID: {testClientId}</p>}
              {testDietPlanId && <p>Diet Plan ID: {testDietPlanId}</p>}
              {testTemplateId && <p>Template ID: {testTemplateId}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
