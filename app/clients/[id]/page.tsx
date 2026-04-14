'use client';

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Download, Plus, X, Edit, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText, Power, RotateCw, ChevronDown, ChevronUp, MoreVertical, Clock, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FoodItemAutocomplete } from "@/components/FoodItemAutocomplete";
import { useAuth } from "@/contexts/AuthContext";
import type { Client, DietPlan, Meal, WeeklyMeals, MealType, FoodItem, MealTemplate } from "@/types";

const MEAL_TYPES: MealType[] = ['preWorkout', 'postWorkout', 'breakfast', 'lunch', 'snacks', 'dinner', 'afterDinner'];
const MEAL_LABELS: Record<MealType, string> = {
  preWorkout: 'Pre Workout',
  postWorkout: 'Post Workout',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
  afterDinner: 'After Dinner'
};
const MEAL_DEFAULTS: Record<MealType, { time: string }> = {
  preWorkout: { time: '06:00' },
  postWorkout: { time: '07:30' },
  breakfast: { time: '08:00' },
  lunch: { time: '13:00' },
  snacks: { time: '16:00' },
  dinner: { time: '19:00' },
  afterDinner: { time: '21:00' }
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// BMI Calculation Helper
const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

// BMI Status Helper
const getBMIStatus = (bmi: number): { label: string; color: string } => {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-600' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600' };
  return { label: 'Obese', color: 'text-red-600' };
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const { user } = useAuth();

  const [client, setClient] = useState<Client | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [allDietPlans, setAllDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'quick' | 'custom'>('quick');
  const [selectedDay, setSelectedDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client>>({});
  const [showPlansList, setShowPlansList] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Set<MealType>>(new Set(['breakfast', 'lunch', 'dinner']));
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Template state
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Quick mode state - each meal has multiple items
  const [quickMeals, setQuickMeals] = useState<Record<MealType, { time: string; items: FoodItem[]; notes?: string }>>({
    preWorkout: { time: '06:00', items: [] },
    postWorkout: { time: '07:30', items: [] },
    breakfast: { time: '08:00', items: [] },
    lunch: { time: '13:00', items: [] },
    snacks: { time: '16:00', items: [] },
    dinner: { time: '19:00', items: [] },
    afterDinner: { time: '21:00', items: [] }
  });

  useEffect(() => {
    loadClientData();
    loadTemplates();
    loadAllDietPlans();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        // Only load diet plan if it exists and has actual content
        if (data.dietPlan && data.dietPlan.meals) {
          // Check if the plan has any actual food items
          const hasItems = Object.values(data.dietPlan.meals).some((dayMeals: any) =>
            dayMeals && Object.values(dayMeals).some((meal: any) =>
              meal && meal.items && meal.items.some((item: any) => item.name && item.name.trim())
            )
          );

          if (hasItems) {
            setDietPlan(data.dietPlan);
            // Load existing meals into quick mode
            const mondayMeals = data.dietPlan.meals.Monday;
            if (mondayMeals) {
              setQuickMeals({
                preWorkout: { time: mondayMeals.preWorkout?.time || '06:00', items: mondayMeals.preWorkout?.items || [] },
                postWorkout: { time: mondayMeals.postWorkout?.time || '07:30', items: mondayMeals.postWorkout?.items || [] },
                breakfast: { time: mondayMeals.breakfast?.time || '08:00', items: mondayMeals.breakfast?.items || [] },
                lunch: { time: mondayMeals.lunch?.time || '13:00', items: mondayMeals.lunch?.items || [] },
                snacks: { time: mondayMeals.snacks?.time || '16:00', items: mondayMeals.snacks?.items || [] },
                dinner: { time: mondayMeals.dinner?.time || '19:00', items: mondayMeals.dinner?.items || [] },
                afterDinner: { time: mondayMeals.afterDinner?.time || '21:00', items: mondayMeals.afterDinner?.items || [] }
              });
            }
          } else {
            // Diet plan exists but has no items, don't load it
            setDietPlan(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllDietPlans = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/plans`, {
        headers: {
          'x-user-id': user?.id?.toString() || '0'
        }
      });
      if (response.ok) {
        const plans = await response.json();
        setAllDietPlans(plans);
      }
    } catch (error) {
      console.error('Failed to load diet plans:', error);
    }
  };

  const togglePlanActivation = async (planId: number, clientId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/plans`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '0'
        },
        body: JSON.stringify({
          action: isActive ? 'deactivate' : 'activate',
          planId
        })
      });

      if (response.ok) {
        await loadAllDietPlans();
      }
    } catch (error) {
      console.error('Failed to toggle plan:', error);
    }
  };

  const createNewPlan = () => {
    // Reset to empty meals for a new plan
    setQuickMeals({
      preWorkout: { time: '06:00', items: [] },
      postWorkout: { time: '07:30', items: [] },
      breakfast: { time: '08:00', items: [] },
      lunch: { time: '13:00', items: [] },
      snacks: { time: '16:00', items: [] },
      dinner: { time: '19:00', items: [] },
      afterDinner: { time: '21:00', items: [] }
    });
    setDietPlan(null);
    setShowPlansList(false);
    setIsEditing(true);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const applyTemplate = (template: MealTemplate) => {
    // Apply template meals to quickMeals
    const templateMeals = template.meals;
    setQuickMeals({
      preWorkout: { time: templateMeals.preWorkout?.time || '06:00', items: templateMeals.preWorkout?.items || [] },
      postWorkout: { time: templateMeals.postWorkout?.time || '07:30', items: templateMeals.postWorkout?.items || [] },
      breakfast: { time: templateMeals.breakfast?.time || '08:00', items: templateMeals.breakfast?.items || [] },
      lunch: { time: templateMeals.lunch?.time || '13:00', items: templateMeals.lunch?.items || [] },
      snacks: { time: templateMeals.snacks?.time || '16:00', items: templateMeals.snacks?.items || [] },
      dinner: { time: templateMeals.dinner?.time || '19:00', items: templateMeals.dinner?.items || [] },
      afterDinner: { time: templateMeals.afterDinner?.time || '21:00', items: templateMeals.afterDinner?.items || [] }
    });
    setIsTemplateDialogOpen(false);
  };

  const saveAsTemplate = async () => {
    if (!newTemplateName.trim()) return;
    
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName,
          meals: quickMeals
        })
      });
      
      if (response.ok) {
        setNewTemplateName('');
        setIsSaveAsTemplateOpen(false);
        loadTemplates();
        alert('Template saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
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
      default: return '1 serving';
    }
  };

  const handleSave = async () => {
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

    // Update existing plan if it exists, otherwise create a new one
    if (dietPlan) {
      await updateDietPlan(dietPlan.id, meals);
      alert('Diet plan updated successfully!');
    } else {
      await createDietPlan(meals);
      alert('New diet plan created successfully!');
    }
    // Refresh the diet plans list to show the new/updated plan
    await loadAllDietPlans();
    setIsEditing(false);
  };

  const createDietPlan = async (meals: WeeklyMeals) => {
    try {
      const response = await fetch('/api/diet-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '0'
        },
        body: JSON.stringify({
          clientId: parseInt(clientId),
          weekStart: new Date().toISOString().split('T')[0], // Use current date as timestamp
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
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '0'
        },
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

  const exportToPDF = async (exportType: 'daywise' | 'mealwise' = 'daywise') => {
    if (!client || !dietPlan) {
      alert('Please create a diet plan first!');
      return;
    }

    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client, dietPlan, exportType })
      });

      if (response.ok) {
        const htmlContent = await response.text();

        // Open in new window for print/save as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
        } else {
          // Fallback: create a downloadable HTML file
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${client.name.replace(/\s+/g, '-')}-diet-plan.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          alert('Popup blocked! File downloaded instead. Open it and use Print > Save as PDF.');
        }
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleEditClient = () => {
    if (!client) return;
    setEditedClient({
      name: client.name,
      metrics: { ...client.metrics }
    });
    setIsEditingClient(true);
  };

  const handleSaveClient = async () => {
    if (!client) return;
    setIsSavingClient(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedClient.name || client.name,
          metrics: editedClient.metrics || client.metrics
        })
      });

      if (response.ok) {
        const updatedClient = await response.json();
        setClient(updatedClient);
        setIsEditingClient(false);
      } else {
        alert('Failed to update client. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('Failed to update client. Please try again.');
    } finally {
      setIsSavingClient(false);
    }
  };

  const updateClientMetric = (field: string, value: string | number | undefined) => {
    setEditedClient(prev => {
      const updatedMetrics = {
        ...prev.metrics,
        [field]: value
      };

      // Auto-calculate BMI when weight or height changes
      if (field === 'weight' || field === 'height') {
        const weight = field === 'weight' ? (value as number) : (prev.metrics?.weight ?? client?.metrics?.weight);
        const height = field === 'height' ? (value as number) : (prev.metrics?.height ?? client?.metrics?.height);

        if (weight && height) {
          updatedMetrics.bmi = calculateBMI(weight as number, height as number);
        }
      }

      return {
        ...prev,
        metrics: updatedMetrics
      };
    });
  };

  const toggleMealExpansion = (mealType: MealType) => {
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealType)) {
        newSet.delete(mealType);
      } else {
        newSet.add(mealType);
      }
      return newSet;
    });
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 sm:pb-6">
      {/* Header - Mobile Optimized */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/clients">
                <Button size="icon" variant="ghost" className="h-9 w-9">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{client.name}</h1>
                {client.metrics.goal && (
                  <p className="text-xs text-gray-500 truncate">{client.metrics.goal}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {viewMode === 'quick' && isEditing && (
                <Button
                  onClick={handleSave}
                  size="icon"
                  className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9"
                  title="Save Diet Plan"
                >
                  <Save className="w-4 h-4" />
                </Button>
              )}
              <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[280px]">
                  <DialogHeader>
                    <DialogTitle className="text-base">Actions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2 py-4">
                    {viewMode === 'quick' && !isEditing && (
                      <Button
                        onClick={() => { setIsEditing(true); setShowMobileMenu(false); }}
                        variant="default"
                        className="w-full justify-start bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Diet Plan
                      </Button>
                    )}
                    <Button
                      onClick={() => { setIsExportOpen(true); setShowMobileMenu(false); }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Diet Plan
                    </Button>
                    <Button
                      onClick={() => { setIsTemplateDialogOpen(true); setShowMobileMenu(false); }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Apply Template
                    </Button>
                    <Button
                      onClick={() => { setIsSaveAsTemplateOpen(true); setShowMobileMenu(false); }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Template
                    </Button>
                    <Button
                      onClick={() => { setShowPlansList(true); setShowMobileMenu(false); }}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      All Plans
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header Actions */}
      <div className="hidden sm:block max-w-4xl mx-auto px-4 mt-4">
        <div className="flex gap-2 flex-wrap">
          {viewMode === 'quick' && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Diet Plan
            </Button>
          )}
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Diet Plan</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500 mb-4">
                Choose how you want to export the diet plan
              </p>
              <div className="space-y-4 py-4">
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-emerald-500"
                  onClick={() => {
                    exportToPDF('daywise');
                    setIsExportOpen(false);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Day-wise Export
                    </CardTitle>
                    <CardDescription>
                      Export by days (Monday, Tuesday, Wednesday...) - Best for weekly plans
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
                  onClick={() => {
                    exportToPDF('mealwise');
                    setIsExportOpen(false);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      Meal-wise Export
                    </CardTitle>
                    <CardDescription>
                      Export by meals (All breakfasts, all lunches...) - Best for meal templates
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Template</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500 mb-4">
                Select a template to apply to this diet plan
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No templates available. Save a diet plan as template first.</p>
                ) : (
                  templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-emerald-500"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          Created on {new Date(template.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isSaveAsTemplateOpen} onOpenChange={setIsSaveAsTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500 mb-4">
                Save current meals as a reusable template
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., Weight Loss Plan"
                    className="mt-1"
                  />
                </div>
                <Button onClick={saveAsTemplate} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Save Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showPlansList} onOpenChange={(open) => {
            setShowPlansList(open);
            if (open) {
              loadAllDietPlans();
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                All Plans
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>All Diet Plans</DialogTitle>
                <DialogDescription>
                  View and manage all diet plans for {client.name}
                </DialogDescription>
              </DialogHeader>

              <div className="mb-4">
                <Button
                  onClick={createNewPlan}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Plan
                </Button>
              </div>

              <div className="space-y-3 py-4">
                {allDietPlans.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No diet plans found. Create one to get started.</p>
                ) : (
                  allDietPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`transition-all ${
                        plan.is_active
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Diet Plan #{plan.id}
                              </h3>
                              {plan.is_active && (
                                <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(plan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="icon"
                              variant={plan.is_active ? "outline" : "default"}
                              onClick={() => togglePlanActivation(plan.id, client.id, plan.is_active ?? false)}
                              className={plan.is_active ? "" : "bg-emerald-600 hover:bg-emerald-700"}
                              title={plan.is_active ? "Deactivate Plan" : "Activate Plan"}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setDietPlan(plan);
                                const mondayMeals = plan.meals.Monday;
                                if (mondayMeals) {
                                  setQuickMeals({
                                    preWorkout: { time: mondayMeals.preWorkout?.time || '06:00', items: mondayMeals.preWorkout?.items || [] },
                                    postWorkout: { time: mondayMeals.postWorkout?.time || '07:30', items: mondayMeals.postWorkout?.items || [] },
                                    breakfast: { time: mondayMeals.breakfast?.time || '08:00', items: mondayMeals.breakfast?.items || [] },
                                    lunch: { time: mondayMeals.lunch?.time || '13:00', items: mondayMeals.lunch?.items || [] },
                                    snacks: { time: mondayMeals.snacks?.time || '16:00', items: mondayMeals.snacks?.items || [] },
                                    dinner: { time: mondayMeals.dinner?.time || '19:00', items: mondayMeals.dinner?.items || [] },
                                    afterDinner: { time: mondayMeals.afterDinner?.time || '21:00', items: mondayMeals.afterDinner?.items || [] }
                                  });
                                }
                                setShowPlansList(false);
                              }}
                              title="Load Plan"
                            >
                              <RotateCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Mode Selector - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'quick' | 'custom')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="quick" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
                <CalendarIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Quick View</span>
                <span className="sm:hidden">Quick</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Custom Days</span>
                <span className="sm:hidden">Days</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Quick Mode */}
        {viewMode === 'quick' && (
          <>
            {isEditing ? (
              // Editing Mode - Collapsible meal cards with improved mobile layout
              <div className="space-y-3 sm:space-y-4">
                {MEAL_TYPES.map((mealType) => {
                  const isExpanded = expandedMeals.has(mealType);
                  const hasItems = quickMeals[mealType].items.some(item => item.name.trim());
                  const itemCount = quickMeals[mealType].items.filter(item => item.name.trim()).length;

                  return (
                    <Card key={mealType} className={`overflow-hidden transition-all ${
                      isExpanded ? 'border-2 border-emerald-200 dark:border-emerald-800 shadow-md' : 'hover:shadow-md'
                    }`}>
                      <CardHeader
                        className="pb-3 cursor-pointer select-none"
                        onClick={() => toggleMealExpansion(mealType)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                              <UtensilsCrossed className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                {MEAL_LABELS[mealType]}
                                {itemCount > 0 && (
                                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                  </span>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{quickMeals[mealType].time}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickMeals({
                                ...quickMeals,
                                [mealType]: { ...quickMeals[mealType], time: quickMeals[mealType].time }
                              });
                            }}
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0 space-y-3">
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Label htmlFor={`${mealType}-time`} className="text-sm whitespace-nowrap">Time</Label>
                            <Input
                              id={`${mealType}-time`}
                              type="time"
                              value={quickMeals[mealType].time}
                              onChange={(e) => setQuickMeals({
                                ...quickMeals,
                                [mealType]: { ...quickMeals[mealType], time: e.target.value }
                              })}
                              className="flex-1 max-w-[150px]"
                            />
                          </div>

                          {quickMeals[mealType].items.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                              <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No items added yet</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {quickMeals[mealType].items.map((item, index) => (
                                <div key={index} className="bg-white dark:bg-gray-900 rounded-lg border p-3 space-y-2">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                      <FoodItemAutocomplete
                                        value={item.name}
                                        onChange={(value) => updateFoodItem(mealType, index, 'name', value)}
                                        placeholder="Food item name"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
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
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFoodItem(mealType, index)}
                                      className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addFoodItem(mealType)}
                            className="w-full border-dashed"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>

                          <div>
                            <Label htmlFor={`${mealType}-notes`} className="text-sm">Notes (optional)</Label>
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
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              // View Mode - Collapsible meal cards with improved design
              <div className="space-y-3 sm:space-y-4">
                {MEAL_TYPES.map((mealType) => {
                  const meal = quickMeals[mealType];
                  const hasItems = meal.items.some(item => item.name.trim());
                  const itemCount = meal.items.filter(item => item.name.trim()).length;
                  const isExpanded = expandedMeals.has(mealType);

                  return (
                    <Card key={mealType} className={`overflow-hidden transition-all ${
                      isExpanded ? 'shadow-md' : 'hover:shadow-md'
                    }`}>
                      <CardHeader
                        className="pb-3 cursor-pointer select-none"
                        onClick={() => toggleMealExpansion(mealType)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              hasItems
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}>
                              <UtensilsCrossed className={`w-5 h-5 ${hasItems ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                {MEAL_LABELS[mealType]}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{meal.time}</span>
                                {hasItems && (
                                  <>
                                    <span>•</span>
                                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </Button>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          {hasItems ? (
                            <div className="space-y-2">
                              {meal.items.filter(item => item.name.trim()).map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{index + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                    <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                                      {item.portions && (
                                        <span className="flex items-center gap-1">
                                          <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <span className="text-xs">📊</span>
                                          </span>
                                          {item.portions}
                                        </span>
                                      )}
                                      {item.calories && (
                                        <span className="flex items-center gap-1">
                                          <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                            <span className="text-xs">🔥</span>
                                          </span>
                                          {item.calories} cal
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {meal.notes && (
                                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                  <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                    <span className="shrink-0">📝</span>
                                    <span>{meal.notes}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-400">
                              <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No items added</p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Sticky Bottom Action Bar for Mobile */}
            {!isEditing && (
              <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-lg p-4 sm:hidden z-40">
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  {dietPlan ? 'Edit Diet Plan' : 'Add Meal Items'}
                </Button>
              </div>
            )}

            {/* Desktop CTA */}
            {!isEditing && (
              <div className="hidden sm:block mt-6 text-center">
                <Button onClick={() => setIsEditing(true)} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  {dietPlan ? (
                    <>
                      <Edit className="w-5 h-5 mr-2" />
                      Edit Meal Items
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Meal Items
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  {dietPlan ? 'Click to add or modify food items' : 'Click to add food items for each meal'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Custom Mode - Day by Day - Mobile Optimized */}
        {viewMode === 'custom' && (
          <>
            {/* Day Selector - Improved Mobile Navigation */}
            <div className="sticky top-16 z-30 bg-gray-50 dark:bg-gray-900 py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:py-4">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      onClick={() => setSelectedDay((selectedDay - 1 + 7) % 7)}
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 text-center">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        {DAYS[selectedDay]}
                      </h2>
                      <p className="text-xs text-gray-500 hidden sm:block">
                        {selectedDay === 0 ? 'Start of the week' : selectedDay === 6 ? 'End of the week' : `Day ${selectedDay + 1} of 7`}
                      </p>
                    </div>
                    <Button
                      onClick={() => setSelectedDay((selectedDay + 1) % 7)}
                      size="icon"
                      variant="outline"
                      className="shrink-0"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Day Pills - Quick Navigation */}
                  <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {DAYS.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(index)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedDay === index
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meals List - Mobile Optimized */}
            <div className="space-y-3 sm:space-y-4 mt-4">
              {MEAL_TYPES.map((mealType) => {
                const meal = currentDayMeals[mealType];
                const hasItems = meal?.items && meal.items.length > 0;

                return (
                  <Card key={mealType} className={`overflow-hidden ${
                      hasItems ? 'border-l-4 border-l-emerald-500' : ''
                    }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          hasItems
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                          <UtensilsCrossed className={`w-5 h-5 ${hasItems ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg">{MEAL_LABELS[mealType]}</CardTitle>
                          {meal?.time && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{meal.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {hasItems ? (
                        <div className="space-y-2">
                          {meal.items.map((item, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                                  {item.portions && (
                                    <span className="flex items-center gap-1">
                                      <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="text-xs">📊</span>
                                      </span>
                                      {item.portions}
                                    </span>
                                  )}
                                  {item.calories && (
                                    <span className="flex items-center gap-1">
                                      <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                        <span className="text-xs">🔥</span>
                                      </span>
                                      {item.calories} cal
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400">
                          <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No items for {MEAL_LABELS[mealType].toLowerCase()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Client Info Card - Mobile Optimized */}
        <Card className="mt-6 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Client Information</CardTitle>
              <Button
                onClick={handleEditClient}
                size="sm"
                variant="outline"
                className="gap-1 shrink-0"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Check if client has any metrics */}
            {Object.keys(client.metrics).length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No client information yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Add details like weight, height, and goals to create personalized diet plans.</p>
                <Button
                  onClick={handleEditClient}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Add Client Details
                </Button>
              </div>
            ) : (
              <>
                {/* BMI Card - Prominent Display */}
                {client.metrics.bmi && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">BMI</p>
                        <p className="text-3xl font-bold">{client.metrics.bmi}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-100 uppercase tracking-wide mb-1">Status</p>
                        <p className="text-lg font-semibold bg-white/20 px-3 py-1 rounded-full">
                          {getBMIStatus(client.metrics.bmi).label}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {client.metrics.weight && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Weight</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.metrics.weight} <span className="text-sm font-normal">kg</span></p>
                    </div>
                  )}
                  {client.metrics.height && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Height</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.metrics.height} <span className="text-sm font-normal">cm</span></p>
                    </div>
                  )}
                  {client.metrics.age && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Age</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.metrics.age} <span className="text-sm font-normal">yrs</span></p>
                    </div>
                  )}
                  {client.metrics.bloodGroup && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Blood</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{client.metrics.bloodGroup}</p>
                    </div>
                  )}
                </div>

                {/* Nutritional Requirements */}
                {(client.metrics.energy || client.metrics.protein || client.metrics.carbs) && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nutritional Targets</p>
                    <div className="grid grid-cols-3 gap-2">
                      {client.metrics.energy && (
                        <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-center">
                          <p className="text-xs text-orange-600 dark:text-orange-400">Energy</p>
                          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">{client.metrics.energy}</p>
                          <p className="text-xs text-orange-500">kcal</p>
                        </div>
                      )}
                      {client.metrics.protein && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center">
                          <p className="text-xs text-blue-600 dark:text-blue-400">Protein</p>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{client.metrics.protein}</p>
                          <p className="text-xs text-blue-500">grams</p>
                        </div>
                      )}
                      {client.metrics.carbs && (
                        <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-center">
                          <p className="text-xs text-green-600 dark:text-green-400">Carbs</p>
                          <p className="text-sm font-semibold text-green-700 dark:text-green-300">{client.metrics.carbs}</p>
                          <p className="text-xs text-green-500">grams</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="mt-4 space-y-3">
                  {client.metrics.foodPreference && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Food Preference:</span>{' '}
                        <span className="capitalize">{client.metrics.foodPreference === 'non-veg' ? 'Non-Vegetarian' : client.metrics.foodPreference}</span>
                      </p>
                    </div>
                  )}
                  {client.metrics.goal && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Goal:</span> {client.metrics.goal}
                      </p>
                    </div>
                  )}
                  {client.metrics.allergies && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                        <span className="shrink-0">⚠️</span>
                        <div>
                          <span className="font-medium">Allergies:</span> {client.metrics.allergies}
                        </div>
                      </p>
                    </div>
                  )}
                  {client.metrics.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="shrink-0">📝</span>
                        <span>{client.metrics.notes}</span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Client Dialog */}
        <Dialog open={isEditingClient} onOpenChange={setIsEditingClient}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editedClient.name || client.name}
                  onChange={(e) => setEditedClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Client name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-weight">Weight (kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    value={editedClient.metrics?.weight ?? client.metrics.weight ?? ''}
                    onChange={(e) => updateClientMetric('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-height">Height (cm)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    value={editedClient.metrics?.height ?? client.metrics.height ?? ''}
                    onChange={(e) => updateClientMetric('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="170"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-age">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editedClient.metrics?.age ?? client.metrics.age ?? ''}
                    onChange={(e) => updateClientMetric('age', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bloodGroup">Blood Group</Label>
                  <Input
                    id="edit-bloodGroup"
                    value={editedClient.metrics?.bloodGroup ?? client.metrics.bloodGroup ?? ''}
                    onChange={(e) => updateClientMetric('bloodGroup', e.target.value || undefined)}
                    placeholder="O+"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-foodPreference">Food Preference</Label>
                <Select
                  value={editedClient.metrics?.foodPreference ?? client.metrics.foodPreference ?? ''}
                  onValueChange={(value) => updateClientMetric('foodPreference', value as 'veg' | 'non-veg' | 'eggetarian')}
                >
                  <SelectTrigger id="edit-foodPreference">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="eggetarian">Eggetarian</SelectItem>
                    <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* BMI Display */}
              {(editedClient.metrics?.weight || client.metrics?.weight) && (editedClient.metrics?.height || client.metrics?.height) && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">BMI</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editedClient.metrics?.bmi || client.metrics?.bmi || calculateBMI(
                          editedClient.metrics?.weight ?? client.metrics?.weight ?? 0,
                          editedClient.metrics?.height ?? client.metrics?.height ?? 0
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className={`text-lg font-semibold ${getBMIStatus(editedClient.metrics?.bmi || client.metrics?.bmi || 0).color}`}>
                        {getBMIStatus(editedClient.metrics?.bmi || client.metrics?.bmi || 0).label}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-energy">Energy (kcal)</Label>
                  <Input
                    id="edit-energy"
                    type="number"
                    value={editedClient.metrics?.energy ?? client.metrics.energy ?? ''}
                    onChange={(e) => updateClientMetric('energy', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-protein">Protein (g)</Label>
                  <Input
                    id="edit-protein"
                    type="number"
                    value={editedClient.metrics?.protein ?? client.metrics.protein ?? ''}
                    onChange={(e) => updateClientMetric('protein', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-carbs">Carbs (g)</Label>
                  <Input
                    id="edit-carbs"
                    type="number"
                    value={editedClient.metrics?.carbs ?? client.metrics.carbs ?? ''}
                    onChange={(e) => updateClientMetric('carbs', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="250"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-goal">Goal</Label>
                <Input
                  id="edit-goal"
                  value={editedClient.metrics?.goal ?? client.metrics.goal ?? ''}
                  onChange={(e) => updateClientMetric('goal', e.target.value || undefined)}
                  placeholder="Weight loss, Muscle gain, etc."
                />
              </div>
              <div>
                <Label htmlFor="edit-allergies">Allergies</Label>
                <Textarea
                  id="edit-allergies"
                  value={editedClient.metrics?.allergies ?? client.metrics.allergies ?? ''}
                  onChange={(e) => updateClientMetric('allergies', e.target.value || undefined)}
                  placeholder="Any allergies or dietary restrictions"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editedClient.metrics?.notes ?? client.metrics.notes ?? ''}
                  onChange={(e) => updateClientMetric('notes', e.target.value || undefined)}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditingClient(false)}
                disabled={isSavingClient}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveClient}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSavingClient}
              >
                {isSavingClient ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
