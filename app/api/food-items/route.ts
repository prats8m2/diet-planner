import { NextResponse } from 'next/server';
import { dietPlanOps } from '@/lib/db';

// GET all food items from all diet plans
export async function GET(request: Request) {
  try {
    // Get all diet plans
    const dietPlans = await dietPlanOps.getAll();

    // Extract all unique food items
    const foodItemsSet = new Set<string>();

    dietPlans.forEach((plan: any) => {
      if (plan.meals) {
        Object.values(plan.meals).forEach((dayMeals: any) => {
          if (dayMeals) {
            Object.values(dayMeals).forEach((meal: any) => {
              if (meal && meal.items) {
                meal.items.forEach((item: any) => {
                  if (item && item.name) {
                    foodItemsSet.add(item.name.trim());
                  }
                });
              }
            });
          }
        });
      }
    });

    const foodItems = Array.from(foodItemsSet).sort();

    return NextResponse.json({ items: foodItems });
  } catch (error) {
    console.error('Error fetching food items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    );
  }
}
