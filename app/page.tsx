import Link from "next/link";
import { Users, FileText, Calendar, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Diet Planner</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pooja Singh</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/test">
                <button className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300">
                  Test
                </button>
              </Link>
              <Link href="/settings">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, Pooja! 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your clients and create personalized diet plans
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/clients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">Clients</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  View and manage all your clients
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/clients?add=true">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">New Client</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Add a new client and create diet plan
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/templates">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">Templates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage meal plan templates
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get started with your diet planning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/clients/new" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Add a new client</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter client details and metrics</p>
                  </div>
                </div>
              </Link>
              <Link href="/clients" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Create diet plan</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Build weekly meal plans for your client</p>
                  </div>
                </div>
              </Link>
              <div className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-60">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Export as PDF</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Share diet plans with clients</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-emerald-600 dark:text-emerald-400">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/clients" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5" />
            <span className="text-xs font-medium">Clients</span>
          </Link>
          <Link href="/templates" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Templates</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400">
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Add padding for bottom nav */}
      <div className="h-16" />
    </div>
  );
}
