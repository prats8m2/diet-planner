'use client';

import Link from "next/link";
import { ArrowLeft, User, Bell, Palette, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {/* Account Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dietitian Name</p>
                    <p className="text-sm text-gray-500">Pooja Singh</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Edit
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">App Version</p>
                    <p className="text-sm text-gray-500">1.0.0</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>App Settings</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-gray-500">Use system preference</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Auto
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Data Storage</p>
                    <p className="text-sm text-gray-500">All data stored locally on device</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                    Offline Ready
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customize Fields */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Customize Fields</CardTitle>
                  <CardDescription>Personalize your diet tracking fields</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add custom fields to track additional information for clients and meals
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Help & Support</CardTitle>
                  <CardDescription>Get help with the app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>• Add clients from the home screen or clients page</p>
                <p>• Create diet plans by clicking on a client</p>
                <p>• Export diet plans as PDF to share with clients</p>
                <p>• All data is saved locally on your device</p>
                <p>• Install as an app for offline access</p>
              </div>
            </CardContent>
          </Card>

          {/* PWA Install Instructions */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-400">Install as App</CardTitle>
              <CardDescription>
                Add this app to your home screen for the best experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>iPhone/iPad:</strong> Tap Share → Add to Home Screen</p>
                <p><strong>Android:</strong> Tap Menu → Install App / Add to Home Screen</p>
                <p><strong>Desktop:</strong> Click install icon in address bar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
