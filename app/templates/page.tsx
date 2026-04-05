'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MealTemplate } from "@/types";

export default function TemplatesPage() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  ←
                </button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meal Templates</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" />
                  New Template
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
                  <Button onClick={handleCreateTemplate} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Create Template
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No templates yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Create reusable meal plan templates to save time
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
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
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
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
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 mb-2">
                      {meals.preWorkout?.items && meals.preWorkout.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Pre Workout: {meals.preWorkout.items.length} items</p>
                      )}
                      {meals.postWorkout?.items && meals.postWorkout.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Post Workout: {meals.postWorkout.items.length} items</p>
                      )}
                      {meals.breakfast?.items && meals.breakfast.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Breakfast: {meals.breakfast.items.length} items</p>
                      )}
                      {meals.lunch?.items && meals.lunch.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Lunch: {meals.lunch.items.length} items</p>
                      )}
                      {meals.snacks?.items && meals.snacks.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Snacks: {meals.snacks.items.length} items</p>
                      )}
                      {meals.dinner?.items && meals.dinner.items.length > 0 && (
                        <p className="text-xs text-gray-600">• Dinner: {meals.dinner.items.length} items</p>
                      )}
                      {meals.afterDinner?.items && meals.afterDinner.items.length > 0 && (
                        <p className="text-xs text-gray-600">• After Dinner: {meals.afterDinner.items.length} items</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Created on {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
