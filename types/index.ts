// Database types
export interface Client {
  id: number;
  name: string;
  metrics: ClientMetrics;
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
  created_at: string;
}

export interface WeeklyMeals {
  [day: string]: DailyMeals;
}

export interface DailyMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal;
}

export interface Meal {
  time?: string;
  items: FoodItem[];
  notes?: string;
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
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

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
