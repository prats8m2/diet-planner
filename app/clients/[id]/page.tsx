'use client';

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Download, Plus, Trash2, Edit, Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, DietPlan, Meal, WeeklyMeals, MealType, FoodItem } from "@/types";

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks'
};
const MEAL_DEFAULTS: Record<MealType, { time: string }> = {
  breakfast: { time: '08:00' },
  lunch: { time: '13:00' },
  dinner: { time: '19:00' },
  snacks: { time: '16:00' }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [client, setClient] = useState<Client | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'quick' | 'custom'>('quick');
  const [selectedDay, setSelectedDay] = useState(0);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

  // Quick mode state - each meal has multiple items
  const [quickMeals, setQuickMeals] = useState<Record<MealType, { time: string; items: FoodItem[]; notes?: string }>>({
    breakfast: { time: '08:00', items: [] },
    lunch: { time: '13:00', items: [] },
    dinner: { time: '19:00', items: [] },
    snacks: { time: '16:00', items: [] }
  });

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        if (data.dietPlan) {
          setDietPlan(data.dietPlan);
          // Load existing meals into quick mode
          if (data.dietPlan.meals.Monday?.breakfast) {
            setQuickMeals({
              breakfast: { time: data.dietPlan.meals.Monday.breakfast.time || '08:00', items: data.dietPlan.meals.Monday.breakfast.items || [] },
              lunch: { time: data.dietPlan.meals.Monday.lunch?.time || '13:00', items: data.dietPlan.meals.Monday.lunch?.items || [] },
              dinner: { time: data.dietPlan.meals.Monday.dinner?.time || '19:00', items: data.dietPlan.meals.Monday.dinner?.items || [] },
              snacks: { time: data.dietPlan.meals.Monday.snacks?.time || '16:00', items: data.dietPlan.meals.Monday.snacks?.items || [] }
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFoodItem = (mealType: MealType) => {
    setQuickMeals({
      ...quickMeals,
      [mealType]: {
        ...quickMeals[mealType],
        items: [
          ...quickMeals[mealType].items,
          { name: '', portions: getDefaultPortion(mealType), calories: undefined }
        ]
      }
    });
  };

  const removeFoodItem = (mealType: MealType, index: number) => {
    setQuickMeals({
      ...quickMeals,
      [mealType]: {
        ...quickMeals[mealType],
        items: quickMeals[mealType].items.filter((_, i) => i !== index)
      }
    });
  };

  const updateFoodItem = (mealType: MealType, index: number, field: keyof FoodItem, value: string | number | undefined) => {
    const updatedItems = [...quickMeals[mealType].items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setQuickMeals({
      ...quickMeals,
      [mealType]: {
        ...quickMeals[mealType],
        items: updatedItems
      }
    });
  };

  const getDefaultPortion = (mealType: MealType): string => {
    switch (mealType) {
      case 'breakfast': return '1 bowl';
      case 'lunch': return '1 plate';
      case 'dinner': return '1 plate';
      case 'snacks': return '1 serving';
    }
  };

  const handleQuickSave = async () => {
    // Validate that at least some items have names
    const hasAnyItems = Object.values(quickMeals).some(meal =>
      meal.items.some(item => item.name.trim())
    );

    if (!hasAnyItems) {
      alert('Please add at least one food item');
      return;
    }

    const meals: WeeklyMeals = {};
    DAYS.forEach(day => {
      meals[day] = {};
      MEAL_TYPES.forEach(mealType => {
        meals[day][mealType] = {
          time: quickMeals[mealType].time,
          items: quickMeals[mealType].items.filter(item => item.name.trim()),
          notes: quickMeals[mealType].notes
        };
      });
    });

    if (dietPlan) {
      await updateDietPlan(dietPlan.id, meals);
    } else {
      await createDietPlan(meals);
    }
    setIsQuickEditOpen(false);
  };

  const createDietPlan = async (meals: WeeklyMeals) => {
    try {
      const response = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: parseInt(clientId),
          weekStart: getWeekStart(),
          meals
        })
      });

      if (response.ok) {
        const newPlan = await response.json();
        setDietPlan(newPlan);
      }
    } catch (error) {
      console.error('Failed to create diet plan:', error);
    }
  };

  const updateDietPlan = async (planId: number, meals: WeeklyMeals) => {
    try {
      const response = await fetch(`/api/diet-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meals })
      });

      if (response.ok) {
        const updated = await response.json();
        setDietPlan(updated);
      }
    } catch (error) {
      console.error('Failed to update diet plan:', error);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getCurrentDayMeals = () => {
    if (!dietPlan?.meals) return {};
    return dietPlan.meals[DAYS[selectedDay]] || {};
  };

  const exportToPDF = async () => {
    if (!client || !dietPlan) {
      alert('Please create a diet plan first!');
      return;
    }

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, dietPlan })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${client.name.replace(/\s+/g, '-')}-diet-plan.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Client not found</p>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentDayMeals = getCurrentDayMeals();

  // Helper to render food items list
  const renderFoodItems = (items: FoodItem[], mealType: MealType) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-emerald-600 font-medium">•</span>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                {item.portions && <span>📊 {item.portions}</span>}
                {item.calories && <span>🔥 {item.calories} cal</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/clients">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
                {client.metrics.goal && (
                  <p className="text-xs text-gray-500">{client.metrics.goal}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsQuickEditOpen(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-1 sm:mr-0" />
                <span className="hidden sm:inline">Quick Edit</span>
              </Button>
              <Button onClick={exportToPDF} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="w-4 h-4 mr-1 sm:mr-0" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mode Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'quick' | 'custom')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Quick View
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Custom Days
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Mode */}
        {viewMode === 'quick' && (
          <>
            <div className="space-y-4">
              {MEAL_TYPES.map((mealType) => {
                const meal = quickMeals[mealType];
                const hasItems = meal.items.some(item => item.name.trim());

                return (
                  <Card key={mealType} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {MEAL_LABELS[mealType]}
                          <span className="text-sm font-normal text-gray-500">
                            {meal.time}
                          </span>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {hasItems ? (
                        renderFoodItems(meal.items, mealType)
                      ) : (
                        <p className="text-gray-400 text-sm">No items added. Click Quick Edit to add {MEAL_LABELS[mealType].toLowerCase()} items.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Save Button */}
            {!dietPlan ? (
              <div className="mt-6 text-center">
                <Button onClick={() => setIsQuickEditOpen(true)} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Meal Items
                </Button>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <Button onClick={() => setIsQuickEditOpen(true)} size="lg" variant="outline" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Edit className="w-5 h-5 mr-2" />
                  Edit Meal Items
                </Button>
                <p className="text-sm text-gray-500 mt-2">Click to add or modify food items</p>
              </div>
            )}
          </>
        )}

        {/* Custom Mode - Day by Day */}
        {viewMode === 'custom' && (
          <>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ←
                  </button>
                  <h2 className="text-lg font-semibold">{DAYS[selectedDay]}</h2>
                  <button
                    onClick={() => setSelectedDay((selectedDay + 1) % 7)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    →
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {MEAL_TYPES.map((mealType) => {
                const meal = currentDayMeals[mealType];
                return (
                  <Card key={mealType} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {MEAL_LABELS[mealType]}
                        {meal?.time && <span className="text-sm font-normal text-gray-500">{meal.time}</span>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {meal?.items && meal.items.length > 0 ? (
                        renderFoodItems(meal.items, mealType)
                      ) : (
                        <p className="text-gray-400 text-sm">No items for {MEAL_LABELS[mealType].toLowerCase()}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Client Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {client.metrics.weight && (
                <div>
                  <p className="text-gray-500">Weight</p>
                  <p className="font-medium">{client.metrics.weight} kg</p>
                </div>
              )}
              {client.metrics.height && (
                <div>
                  <p className="text-gray-500">Height</p>
                  <p className="font-medium">{client.metrics.height} cm</p>
                </div>
              )}
              {client.metrics.age && (
                <div>
                  <p className="text-gray-500">Age</p>
                  <p className="font-medium">{client.metrics.age} years</p>
                </div>
              )}
              {client.metrics.bloodGroup && (
                <div>
                  <p className="text-gray-500">Blood Group</p>
                  <p className="font-medium">{client.metrics.bloodGroup}</p>
                </div>
              )}
            </div>
            {client.metrics.allergies && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm">Allergies</p>
                <p className="text-sm">{client.metrics.allergies}</p>
              </div>
            )}
            {client.metrics.notes && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm">Notes</p>
                <p className="text-sm">{client.metrics.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Quick Edit Dialog */}
      <Dialog open={isQuickEditOpen} onOpenChange={setIsQuickEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal Plan</DialogTitle>
            <DialogDescription>
              Add multiple food items for each meal time. This applies to all days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="space-y-3 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{MEAL_LABELS[mealType]}</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${mealType}-time`} className="text-sm">Time:</Label>
                    <Input
                      id={`${mealType}-time`}
                      type="time"
                      value={quickMeals[mealType].time}
                      onChange={(e) => setQuickMeals({
                        ...quickMeals,
                        [mealType]: { ...quickMeals[mealType], time: e.target.value }
                      })}
                      className="w-32"
                    />
                  </div>
                </div>

                {/* Food Items List */}
                <div className="space-y-2">
                  {quickMeals[mealType].items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Food item name"
                          value={item.name}
                          onChange={(e) => updateFoodItem(mealType, index, 'name', e.target.value)}
                          className="sm:col-span-2"
                        />
                        <Input
                          placeholder="Portion"
                          value={item.portions || ''}
                          onChange={(e) => updateFoodItem(mealType, index, 'portions', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Calories"
                          value={item.calories || ''}
                          onChange={(e) => updateFoodItem(mealType, index, 'calories', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFoodItem(mealType, index)}
                        className="mt-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFoodItem(mealType)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Food Item
                </Button>

                <div>
                  <Label htmlFor={`${mealType}-notes`}>Notes (optional)</Label>
                  <Textarea
                    id={`${mealType}-notes`}
                    value={quickMeals[mealType].notes || ''}
                    onChange={(e) => setQuickMeals({
                      ...quickMeals,
                      [mealType]: { ...quickMeals[mealType], notes: e.target.value }
                    })}
                    placeholder="Any special instructions..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
            ))}

            <Button
              onClick={handleQuickSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              Save for All Days
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
