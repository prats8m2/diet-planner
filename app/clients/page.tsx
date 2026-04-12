'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, User, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/types";

// BMI Calculation Helper
const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

function ClientsPageContent() {
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

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const weight = clientMetrics.weight ? parseFloat(clientMetrics.weight) : undefined;
      const height = clientMetrics.height ? parseFloat(clientMetrics.height) : undefined;

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Clients</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Client
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
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
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
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 18.5 ? 'text-blue-600' :
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 25 ? 'text-green-600' :
                            calculateBMI(parseFloat(clientMetrics.weight), parseFloat(clientMetrics.height)) < 30 ? 'text-orange-600' : 'text-red-600'
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

                  <Button onClick={handleAddClient} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Add Client
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <Button onClick={() => setIsDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
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
                    </div>
                  </CardHeader>
                  <CardContent>
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
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-500">Loading...</p></div>}>
      <ClientsPageContent />
    </Suspense>
  );
}
