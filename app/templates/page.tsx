'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Trash2, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { MealTemplate } from "@/types";

export default function TemplatesPage() {
  const { user, logout } = useAuth();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          meals: {}
        })
      });

      if (response.ok) {
        setTemplateName("");
        setIsDialogOpen(false);
        loadTemplates();
      }
    } catch (error) {
      console.error("Failed to create template:", error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadTemplates();
      }
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/50 to-teal-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/20">
      {/* Header */}
      <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-emerald-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <button className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 sm:hidden">
                  <Image
                    src="/Taste Of Health Logo.png"
                    alt="Taste of Health Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meal Templates</h1>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{user?.full_name || 'Dietitian'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">New Template</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable meal plan template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Weight Loss Plan"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleCreateTemplate} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No templates yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm max-w-sm mx-auto">
                Create reusable meal plan templates to save time when creating diet plans for clients.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const meals = template.meals || {};
              const mealCount = Object.values(meals).filter(
                (meal) => meal && meal.items && meal.items.length > 0
              ).length;
              return (
                <Card key={template.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-emerald-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription>
                          {mealCount} meal{mealCount !== 1 ? 's' : ''} configured
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="hover:bg-teal-50 dark:hover:bg-teal-900/20"
                      >
                        <Trash2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-3">
                      {meals.preWorkout?.items && meals.preWorkout.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Pre Workout: {meals.preWorkout.items.length} items</p>
                      )}
                      {meals.postWorkout?.items && meals.postWorkout.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Post Workout: {meals.postWorkout.items.length} items</p>
                      )}
                      {meals.breakfast?.items && meals.breakfast.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Breakfast: {meals.breakfast.items.length} items</p>
                      )}
                      {meals.lunch?.items && meals.lunch.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Lunch: {meals.lunch.items.length} items</p>
                      )}
                      {meals.snacks?.items && meals.snacks.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Snacks: {meals.snacks.items.length} items</p>
                      )}
                      {meals.dinner?.items && meals.dinner.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• Dinner: {meals.dinner.items.length} items</p>
                      )}
                      {meals.afterDinner?.items && meals.afterDinner.items.length > 0 && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">• After Dinner: {meals.afterDinner.items.length} items</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Created on {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-emerald-100 dark:border-gray-700 safe-area-inset-bottom">
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
          <Link href="/templates" className="flex flex-col items-center gap-1 px-4 py-2 text-emerald-600 dark:text-emerald-400">
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
    </ProtectedRoute>
  );
}
