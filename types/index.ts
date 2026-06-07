// Database types
export interface Client {
  id: number;
  name: string;
  metrics: ClientMetrics;
  dietitian_id?: number;
  created_at: string;
}

export interface ClientMetrics {
  weight?: number;
  height?: number;
  age?: number;
  bmi?: number;
  dietaryRestrictions?: string[];
  healthConditions?: string[];
  goal?: string;
  bloodGroup?: string;
  allergies?: string;
  notes?: string;
  energy?: number;
  protein?: number;
  carbs?: number;
  foodPreference?: 'veg' | 'non-veg' | 'eggetarian';
}

export interface DietPlan {
  id: number;
  client_id: number;
  week_start: string;
  meals: WeeklyMeals;
  is_active?: boolean;
  created_at: string;
}

export interface WeeklyMeals {
  [day: string]: DailyMeals;
}

export interface DailyMeals {
  preWorkout?: Meal;
  postWorkout?: Meal;
  breakfast?: Meal;
  midMeal?: Meal;
  lunch?: Meal;
  snacks?: Meal;
  dinner?: Meal;
  afterDinner?: Meal;
}

export interface Meal {
  time?: string;
  items: FoodItem[];
  options?: MealOption[];  // New: support for meal options
  notes?: string;
}

export interface MealOption {
  id: string;  // unique identifier for the option
  name: string;  // e.g., "Option 1" or "Roti + Dal + Chawal"
  items: FoodItem[];
  portions?: string;  // combined portion for all items in this option
  calories?: number;  // combined calories for all items in this option
  notes?: string;  // notes specific to this option
}

export interface FoodItem {
  name: string;
  portions?: string;
  calories?: number;
}

export interface MealTemplate {
  id: number;
  name: string;
  meals: DailyMeals;
  created_at: string;
}

export interface FieldConfig {
  id: number;
  field_name: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date';
  options?: string[];
  is_active: boolean;
  display_order: number;
  category: 'client' | 'meal';
}

// UI Types
export type MealType = 'preWorkout' | 'postWorkout' | 'breakfast' | 'midMeal' | 'lunch' | 'snacks' | 'dinner' | 'afterDinner';

export interface DayOfWeek {
  key: string;
  label: string;
  date: Date;
}

export interface FormState {
  clients: Client[];
  currentClient: Client | null;
  currentDietPlan: DietPlan | null;
  templates: MealTemplate[];
  fieldConfigs: FieldConfig[];
}
