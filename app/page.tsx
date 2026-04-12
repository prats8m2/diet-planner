'use client';

import Link from "next/link";
import Image from "next/image";
import { Users, Plus, User, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { Client } from "@/types";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to load clients:", error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const recentClients = clients.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-orange-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/Taste Of Health Logo.png"
                  alt="Taste of Health Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Taste of Health</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personalized Diet Plans</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/clients?add=true">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">New Client</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-orange-500/10 dark:from-emerald-500/5 dark:to-orange-500/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Journey to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Better Health</span> Starts Here
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-8">
              Create personalized diet plans, track client progress, and help them achieve their wellness goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/clients?add=true">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-200 dark:shadow-none">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Client
                </Button>
              </Link>
              <Link href="/clients">
                <Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  View All Clients
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{clients.length}</p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Clients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-teal-600 dark:text-teal-400">
                {clients.filter(c => c.metrics.goal === 'Weight Loss').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weight Loss</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                {clients.filter(c => c.metrics.goal === 'Weight Gain').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Weight Gain</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                {clients.filter(c => c.metrics.goal === 'Maintenance' || c.metrics.goal === 'General Health').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Clients */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Recent Clients</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick access to your latest clients</p>
          </div>
          <Link href="/clients">
            <Button variant="ghost" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentClients.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No clients yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
                Start your journey by adding your first client and creating a personalized diet plan.
              </p>
              <Link href="/clients?add=true">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-teal-500 to-orange-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform duration-300">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {client.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {client.metrics.goal && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <TrendingUp className="w-3 h-3" />
                              {client.metrics.goal}
                            </span>
                          )}
                          {client.metrics.weight && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {client.metrics.weight} kg
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* View More Link */}
        {clients.length > 6 && (
          <div className="text-center mt-8">
            <Link href="/clients">
              <Button variant="outline" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                View All {clients.length} Clients
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-emerald-600 dark:text-emerald-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/clients" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <Users className="w-6 h-6" />
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
          <Link href="/settings" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
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
