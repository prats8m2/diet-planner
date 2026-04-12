'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, User, Bell, Palette, HelpCircle, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <Link href="/">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/Taste Of Health Logo.png"
                  alt="Taste of Health Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Taste of Health</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {/* Brand Card */}
          <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Taste of Health</h2>
                  <p className="text-gray-600 dark:text-gray-400">Personalized Diet Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
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
                <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                  <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                    Offline Ready
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle>Quick Guide</CardTitle>
                  <CardDescription>How to use the app</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-semibold">1</span>
                    <p className="font-medium text-gray-900 dark:text-white">Add Clients</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Create client profiles with their details and health goals</p>
                </div>
                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-semibold">2</span>
                    <p className="font-medium text-gray-900 dark:text-white">Create Plans</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Build personalized weekly meal plans for each client</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-semibold">3</span>
                    <p className="font-medium text-gray-900 dark:text-white">Track Progress</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monitor client progress and adjust plans as needed</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">4</span>
                    <p className="font-medium text-gray-900 dark:text-white">Export & Share</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Export diet plans as PDF to share with clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PWA Install Instructions */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="text-emerald-700 dark:text-emerald-400">Install as App</CardTitle>
              <CardDescription>
                Add Taste of Health to your home screen for the best experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong className="text-gray-900 dark:text-white">iPhone/iPad:</strong> Tap Share → Add to Home Screen</p>
                <p><strong className="text-gray-900 dark:text-white">Android:</strong> Tap Menu → Install App / Add to Home Screen</p>
                <p><strong className="text-gray-900 dark:text-white">Desktop:</strong> Click install icon in address bar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/clients" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs font-medium">Clients</span>
          </Link>
          <Link href="/templates" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs font-medium">Templates</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 px-4 py-2 text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.66-15.66l-4.24 4.24m0 5.66l4.24 4.24M1 12h6m6 0h6M5.66 5.66l4.24 4.24m0 5.66l-4.24 4.24" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Add padding for bottom nav */}
      <div className="h-16" />
    </div>
  );
}
