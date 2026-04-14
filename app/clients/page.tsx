'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, User, MoreVertical, LogOut, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { Client } from "@/types";

// BMI Calculation Helper
const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

function ClientsPageContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientMetrics, setClientMetrics] = useState({
    weight: "",
    height: "",
    age: "",
    bloodGroup: "",
    dietaryRestrictions: [] as string[],
    healthConditions: [] as string[],
    goal: "",
    allergies: "",
    notes: "",
    foodPreference: ""
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientMetrics, setEditClientMetrics] = useState({
    weight: "",
    height: "",
    age: "",
    bloodGroup: "",
    dietaryRestrictions: [] as string[],
    healthConditions: [] as string[],
    goal: "",
    allergies: "",
    notes: "",
    foodPreference: ""
  });

  useEffect(() => {
    loadClients();
    // Check if user came from home page "New Client" link
    if (searchParams.get('add') === 'true') {
      setIsDialogOpen(true);
      // Clear the query param
      router.replace('/clients');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch("/api/clients", {
        headers: {
          'x-user-id': user?.id?.toString() || '0'
        }
      });
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

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const weight = clientMetrics.weight ? parseFloat(clientMetrics.weight) : undefined;
      const height = clientMetrics.height ? parseFloat(clientMetrics.height) : undefined;

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id?.toString() || '0'
        },
        body: JSON.stringify({
          name: newClientName,
          metrics: {
            weight,
            height,
            age: clientMetrics.age ? parseInt(clientMetrics.age) : undefined,
            bloodGroup: clientMetrics.bloodGroup || undefined,
            dietaryRestrictions: clientMetrics.dietaryRestrictions,
            healthConditions: clientMetrics.healthConditions,
            goal: clientMetrics.goal || undefined,
            allergies: clientMetrics.allergies || undefined,
            notes: clientMetrics.notes || undefined,
            foodPreference: clientMetrics.foodPreference || undefined,
            bmi: weight && height ? calculateBMI(weight, height) : undefined
          }
        })
      });

      if (response.ok) {
        setNewClientName("");
        setClientMetrics({
          weight: "",
          height: "",
          age: "",
          bloodGroup: "",
          dietaryRestrictions: [],
          healthConditions: [],
          goal: "",
          allergies: "",
          notes: "",
          foodPreference: ""
        });
        setIsDialogOpen(false);
        loadClients();
      }
    } catch (error) {
      console.error("Failed to add client:", error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadClients();
      }
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditClientMetrics({
      weight: client.metrics.weight?.toString() || "",
      height: client.metrics.height?.toString() || "",
      age: client.metrics.age?.toString() || "",
      bloodGroup: client.metrics.bloodGroup || "",
      dietaryRestrictions: client.metrics.dietaryRestrictions || [],
      healthConditions: client.metrics.healthConditions || [],
      goal: client.metrics.goal || "",
      allergies: client.metrics.allergies || "",
      notes: client.metrics.notes || "",
      foodPreference: client.metrics.foodPreference || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      const weight = editClientMetrics.weight ? parseFloat(editClientMetrics.weight) : undefined;
      const height = editClientMetrics.height ? parseFloat(editClientMetrics.height) : undefined;

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingClient.name,
          metrics: {
            weight,
            height,
            age: editClientMetrics.age ? parseInt(editClientMetrics.age) : undefined,
            bloodGroup: editClientMetrics.bloodGroup || undefined,
            dietaryRestrictions: editClientMetrics.dietaryRestrictions,
            healthConditions: editClientMetrics.healthConditions,
            goal: editClientMetrics.goal || undefined,
            allergies: editClientMetrics.allergies || undefined,
            notes: editClientMetrics.notes || undefined,
            foodPreference: editClientMetrics.foodPreference || undefined,
            bmi: weight && height ? calculateBMI(weight, height) : undefined
          }
        })
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingClient(null);
        loadClients();
      }
    } catch (error) {
      console.error("Failed to update client:", error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
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
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clients</h1>
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
                    <span className="hidden sm:inline">Add Client</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter client details to get started
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Client Name *</Label>
                    <Input
                      id="name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Enter client name"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={clientMetrics.weight}
                        onChange={(e) => setClientMetrics({ ...clientMetrics, weight: e.target.value })}
                        placeholder="70"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={clientMetrics.height}
                        onChange={(e) => setClientMetrics({ ...clientMetrics, height: e.target.value })}
                        placeholder="170"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={clientMetrics.age}
                        onChange={(e) => setClientMetrics({ ...clientMetrics, age: e.target.value })}
                        placeholder="30"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Live BMI Indicator */}
                  {clientMetrics.weight && clientMetrics.height && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Calculated BMI</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                          <p className={`text-sm font-semibold ${
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 18.5 ? 'text-emerald-600' :
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 25 ? 'text-emerald-600' :
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 30 ? 'text-teal-600' : 'text-teal-700'
                          }`}>
                            {calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 18.5 ? 'Underweight' :
                             calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 25 ? 'Normal' :
                             calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 30 ? 'Overweight' : 'Obese'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <select
                      id="bloodGroup"
                      value={clientMetrics.bloodGroup}
                      onChange={(e) => setClientMetrics({ ...clientMetrics, bloodGroup: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="foodPreference">Food Preference</Label>
                    <select
                      id="foodPreference"
                      value={clientMetrics.foodPreference}
                      onChange={(e) => setClientMetrics({ ...clientMetrics, foodPreference: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="">Select preference</option>
                      <option value="veg">Vegetarian</option>
                      <option value="eggetarian">Eggetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="goal">Goal</Label>
                    <select
                      id="goal"
                      value={clientMetrics.goal}
                      onChange={(e) => setClientMetrics({ ...clientMetrics, goal: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                    >
                      <option value="">Select goal</option>
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Weight Gain">Weight Gain</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="General Health">General Health</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={clientMetrics.allergies}
                      onChange={(e) => setClientMetrics({ ...clientMetrics, allergies: e.target.value })}
                      placeholder="List any allergies..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={clientMetrics.notes}
                      onChange={(e) => setClientMetrics({ ...clientMetrics, notes: e.target.value })}
                      placeholder="Additional notes..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleAddClient} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                    Add Client
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
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first client to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-all border border-emerald-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-lg">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        {client.metrics.goal && (
                          <CardDescription className="text-xs">
                            Goal: {client.metrics.goal}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/clients/${client.id}`);
                        }}
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClient(client);
                        }}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent
                  className="cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <div className="flex items-center justify-between text-sm">
                    {client.metrics.weight && client.metrics.height ? (
                      <div className="flex gap-3">
                        <span className="text-gray-600 dark:text-gray-400">
                          {client.metrics.weight} kg
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {client.metrics.height} cm
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No details yet</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <Link href="/clients" className="flex flex-col items-center gap-1 px-4 py-2 text-emerald-600 dark:text-emerald-400">
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
          <Link href="/settings" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m5.66-15.66l-4.24 4.24m0 5.66l4.24 4.24M1 12h6m6 0h6M5.66 5.66l4.24 4.24m0 5.66l-4.24 4.24" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Client Name</Label>
              <Input
                id="edit-name"
                value={editingClient?.name || ''}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="edit-weight">Weight (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editClientMetrics.weight}
                  onChange={(e) => setEditClientMetrics({ ...editClientMetrics, weight: e.target.value })}
                  placeholder="70"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-height">Height (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={editClientMetrics.height}
                  onChange={(e) => setEditClientMetrics({ ...editClientMetrics, height: e.target.value })}
                  placeholder="170"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editClientMetrics.age}
                  onChange={(e) => setEditClientMetrics({ ...editClientMetrics, age: e.target.value })}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Live BMI Indicator */}
            {editClientMetrics.weight && editClientMetrics.height && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg p-3 border border-emerald-100 dark:border-emerald-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Calculated BMI</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
                    <p className={`text-sm font-semibold ${
                      calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 18.5 ? 'text-emerald-600' :
                      calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 25 ? 'text-emerald-600' :
                      calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 30 ? 'text-teal-600' : 'text-teal-700'
                    }`}>
                      {calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 18.5 ? 'Underweight' :
                       calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 25 ? 'Normal' :
                       calculateBMI(parseFloat(editClientMetrics.weight), parseFloat(editClientMetrics.height)) < 30 ? 'Overweight' : 'Obese'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-bloodGroup">Blood Group</Label>
              <select
                id="edit-bloodGroup"
                value={editClientMetrics.bloodGroup}
                onChange={(e) => setEditClientMetrics({ ...editClientMetrics, bloodGroup: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-foodPreference">Food Preference</Label>
              <select
                id="edit-foodPreference"
                value={editClientMetrics.foodPreference}
                onChange={(e) => setEditClientMetrics({ ...editClientMetrics, foodPreference: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">Select preference</option>
                <option value="veg">Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-goal">Goal</Label>
              <select
                id="edit-goal"
                value={editClientMetrics.goal}
                onChange={(e) => setEditClientMetrics({ ...editClientMetrics, goal: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">Select goal</option>
                <option value="Weight Loss">Weight Loss</option>
                <option value="Weight Gain">Weight Gain</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="General Health">General Health</option>
              </select>
            </div>

            <div>
              <Label htmlFor="edit-allergies">Allergies</Label>
              <Textarea
                id="edit-allergies"
                value={editClientMetrics.allergies}
                onChange={(e) => setEditClientMetrics({ ...editClientMetrics, allergies: e.target.value })}
                placeholder="List any allergies..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editClientMetrics.notes}
                onChange={(e) => setEditClientMetrics({ ...editClientMetrics, notes: e.target.value })}
                placeholder="Additional notes..."
                className="mt-1"
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateClient}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add padding for bottom nav */}
      <div className="h-16" />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ProtectedRoute>
        <ClientsPageContent />
      </ProtectedRoute>
    </Suspense>
  );
}
