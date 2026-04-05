import { NextResponse } from 'next/server';
import type { Client, DietPlan, FoodItem } from '@/types';

interface Meal {
  time?: string;
  items: FoodItem[];
  notes?: string;
}

interface DayMeals {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal;
}

function formatTime(time?: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

export async function POST(request: Request) {
  try {
    const { client, dietPlan, exportType = 'daywise' } = await request.json();

    if (!client || !dietPlan) {
      return NextResponse.json(
        { error: 'Client and diet plan are required' },
        { status: 400 }
      );
    }

    const htmlContent = generateHTML(client, dietPlan, exportType);

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${client.name.replace(/\s+/g, '-')}-diet-plan.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generateHTML(client: Client, dietPlan: DietPlan, exportType: 'daywise' | 'mealwise'): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks'
  };
  const mealColors: Record<string, string> = {
    breakfast: '#FF6B6B',
    lunch: '#10B981',
    dinner: '#8B5CF6',
    snacks: '#EC4899'
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${client.name} - Diet Plan</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.5;
      padding: 20px;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Header Styles */
    .header {
      background: white;
      padding: 32px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .logo {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      object-fit: contain;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      padding: 8px;
    }

    .branding h1 {
      font-size: 26px;
      font-weight: 800;
      color: #16a34a;
      letter-spacing: -0.5px;
      margin-bottom: 2px;
    }

    .branding .tagline {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .dietitian-info {
      text-align: right;
    }

    .dietitian-info .name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }

    .dietitian-info .title {
      font-size: 12px;
      color: #64748b;
    }

    /* Patient Info */
    .patient-section {
      padding: 28px 40px;
      background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
      border-bottom: 1px solid #e2e8f0;
    }

    .patient-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #16a34a;
      margin-bottom: 8px;
    }

    .patient-name {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 20px;
    }

    .metrics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .allergies-warning {
      margin-top: 16px;
      padding: 12px 16px;
      background: #fef2f2;
      border-left: 3px solid #ef4444;
      border-radius: 6px;
      font-size: 12px;
      color: #991b1b;
      font-weight: 400;
      line-height: 1.5;
    }

    .allergies-warning::before {
      content: 'Allergies: ';
      font-weight: 600;
      color: #7f1d1d;
    }

    /* Content */
    .content {
      padding: 32px 40px;
    }

    .day-section {
      margin-bottom: 36px;
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }

    .day-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
    }

    .day-number {
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
    }

    /* Meal Card */
    .meal-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .meal-card.breakfast { border-left: 4px solid #FF6B6B; }
    .meal-card.lunch { border-left: 4px solid #10B981; }
    .meal-card.dinner { border-left: 4px solid #8B5CF6; }
    .meal-card.snacks { border-left: 4px solid #EC4899; }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .meal-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meal-time {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 6px 14px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }

    /* Food Items */
    .food-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .food-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 10px 16px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid transparent;
    }

    .food-item.breakfast { border-left-color: #FF6B6B; }
    .food-item.lunch { border-left-color: #10B981; }
    .food-item.dinner { border-left-color: #8B5CF6; }
    .food-item.snacks { border-left-color: #EC4899; }

    .food-name {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
      flex: 1;
    }

    .food-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      font-weight: 400;
    }

    .food-meta-item {
      display: flex;
      gap: 4px;
    }

    .food-meta-label {
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .food-meta-value {
      color: #475569;
      font-weight: 500;
    }

    /* Notes */
    .meal-notes {
      margin-top: 16px;
      padding: 12px 16px;
      background: #fffbeb;
      border-left: 3px solid #fbbf24;
      border-radius: 6px;
      font-size: 12px;
      color: #92400e;
      font-weight: 400;
      line-height: 1.5;
    }

    .meal-notes::before {
      content: 'Note: ';
      font-weight: 600;
      color: #78350f;
    }

    /* Footer */
    .footer {
      padding: 24px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .footer-brand {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .footer-date {
      font-size: 12px;
      color: #64748b;
    }

    .footer-disclaimer {
      margin-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Print Button */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #16a34a;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
      z-index: 1000;
      font-family: inherit;
      transition: all 0.2s;
    }

    .print-button:hover {
      background: #15803d;
      transform: translateY(-1px);
    }

    /* Print Styles */
    @media print {
      .print-button { display: none !important; }
      body { padding: 0; background: white; }
      .page { box-shadow: none; }
      .day-section { page-break-inside: avoid; }
      .meal-card { page-break-inside: avoid; }
      .meal-card { orphans: 3; widows: 3; }
    }

    @page {
      margin: 10mm;
      size: A4;
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img src="https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/bf781411-73fe-482b-b592-bcb201890f1d/0cc7668a4feaea35e3b0ad9e99dcbb09.png?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1775408147&Signature=bVrMybGgYIP++zwsH4FfRa4Q3pk=" alt="Taste of Health" class="logo">
        <div class="branding">
          <h1>Taste of Health</h1>
          <div class="tagline">Personalized Nutrition Plans</div>
        </div>
      </div>
      <div class="dietitian-info">
        <div class="name">Dietitian Pooja Singh</div>
        <div class="title">Clinical Nutritionist</div>
      </div>
    </div>

    <!-- Patient Info -->
    <div class="patient-section">
      <div class="patient-label">Patient Details</div>
      <div class="patient-name">${client.name}</div>

      <div class="metrics-grid">
        ${client.metrics.weight ? `
          <div class="metric-item">
            <div class="metric-label">Weight</div>
            <div class="metric-value">${client.metrics.weight} kg</div>
          </div>
        ` : ''}
        ${client.metrics.height ? `
          <div class="metric-item">
            <div class="metric-label">Height</div>
            <div class="metric-value">${client.metrics.height} cm</div>
          </div>
        ` : ''}
        ${client.metrics.age ? `
          <div class="metric-item">
            <div class="metric-label">Age</div>
            <div class="metric-value">${client.metrics.age} years</div>
          </div>
        ` : ''}
        ${client.metrics.bmi ? `
          <div class="metric-item">
            <div class="metric-label">BMI</div>
            <div class="metric-value">${client.metrics.bmi.toFixed(1)}</div>
          </div>
        ` : ''}
        ${client.metrics.bloodGroup ? `
          <div class="metric-item">
            <div class="metric-label">Blood Group</div>
            <div class="metric-value">${client.metrics.bloodGroup}</div>
          </div>
        ` : ''}
        ${client.metrics.energy ? `
          <div class="metric-item">
            <div class="metric-label">Energy</div>
            <div class="metric-value">${client.metrics.energy} kcal</div>
          </div>
        ` : ''}
        ${client.metrics.protein ? `
          <div class="metric-item">
            <div class="metric-label">Protein</div>
            <div class="metric-value">${client.metrics.protein} g</div>
          </div>
        ` : ''}
        ${client.metrics.carbs ? `
          <div class="metric-item">
            <div class="metric-label">Carbs</div>
            <div class="metric-value">${client.metrics.carbs} g</div>
          </div>
        ` : ''}
        ${client.metrics.foodPreference ? `
          <div class="metric-item">
            <div class="metric-label">Food Preference</div>
            <div class="metric-value">${client.metrics.foodPreference === 'non-veg' ? 'Non-Vegetarian' : client.metrics.foodPreference === 'eggetarian' ? 'Eggetarian' : 'Vegetarian'}</div>
          </div>
        ` : ''}
        ${client.metrics.goal ? `
          <div class="metric-item">
            <div class="metric-label">Goal</div>
            <div class="metric-value">${client.metrics.goal}</div>
          </div>
        ` : ''}
      </div>

      ${client.metrics.bmi ? `
        <div style="background: ${client.metrics.bmi < 18.5 ? '#eff6ff' : client.metrics.bmi < 25 ? '#f0fdf4' : client.metrics.bmi < 30 ? '#fff7ed' : '#fef2f2'}; border-left: 3px solid ${client.metrics.bmi < 18.5 ? '#3b82f6' : client.metrics.bmi < 25 ? '#22c55e' : client.metrics.bmi < 30 ? '#f97316' : '#ef4444'}; padding: 12px 16px; border-radius: 6px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Body Mass Index</div>
            <div style="font-size: 24px; font-weight: 700; color: #1e293b;">${client.metrics.bmi}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Status</div>
            <div style="font-size: 14px; font-weight: 600; color: ${client.metrics.bmi < 18.5 ? '#2563eb' : client.metrics.bmi < 25 ? '#16a34a' : client.metrics.bmi < 30 ? '#ea580c' : '#dc2626'};">${client.metrics.bmi < 18.5 ? 'Underweight' : client.metrics.bmi < 25 ? 'Normal' : client.metrics.bmi < 30 ? 'Overweight' : 'Obese'}</div>
          </div>
        </div>
      ` : ''}

      ${client.metrics.allergies ? `
        <div class="allergies-warning">
          ${client.metrics.allergies}
        </div>
      ` : ''}
    </div>

    <!-- Content -->
    <div class="content">
      ${exportType === 'daywise'
        ? generateDaywiseContent(dietPlan, days, mealLabels)
        : generateMealwiseContent(dietPlan, days, mealLabels)
      }
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">Taste of Health by Dietitian Pooja Singh</div>
      <div class="footer-date">${new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</div>
      <div class="footer-disclaimer">
        This personalized nutrition plan is designed for your specific needs. Please consult a healthcare provider before making significant dietary changes.
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => {
        if (confirm('Would you like to print this diet plan or save it as a PDF?')) {
          window.print();
        }
      }, 500);
    };
  </script>
</body>
</html>`;

  return html;
}

function generateDaywiseContent(dietPlan: DietPlan, days: string[], mealLabels: Record<string, string>): string {
  let content = '';

  days.forEach((day, index) => {
    const dayMeals: DayMeals = dietPlan.meals[day] || {};

    const mealsPresent = Object.keys(dayMeals).filter(key => {
      const meal = dayMeals[key];
      return meal && meal.items && meal.items.length > 0;
    });

    if (mealsPresent.length === 0) return;

    content += `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title">${day}</div>
          <div class="day-number">Day ${index + 1}</div>
        </div>
    `;

    mealsPresent.forEach((mealType) => {
      const meal = dayMeals[mealType] as Meal;
      if (meal && meal.items && meal.items.length > 0) {
        content += `
          <div class="meal-card ${mealType}">
            <div class="meal-header">
              <div class="meal-title">${mealLabels[mealType]}</div>
              ${meal.time ? `<div class="meal-time">${formatTime(meal.time)}</div>` : ''}
            </div>
            <div class="food-list">
              ${meal.items.map(item => `
                <div class="food-item ${mealType}">
                  <div class="food-name">${item.name}</div>
                  ${item.portions || item.calories ? `
                    <div class="food-meta">
                      ${item.portions ? `
                        <div class="food-meta-item">
                          <span class="food-meta-label">Portion</span>
                          <span class="food-meta-value">${item.portions}</span>
                        </div>
                      ` : ''}
                      ${item.calories ? `
                        <div class="food-meta-item">
                          <span class="food-meta-label">Calories</span>
                          <span class="food-meta-value">${item.calories}</span>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ${meal.notes ? `<div class="meal-notes">${meal.notes}</div>` : ''}
          </div>
        `;
      }
    });

    content += `</div>`;
  });

  return content || '<p style="text-align: center; color: #94a3b8; padding: 40px; font-size: 14px;">No meals planned for this period.</p>';
}

function generateMealwiseContent(dietPlan: DietPlan, days: string[], mealLabels: Record<string, string>): string {
  let content = '';
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;

  mealTypes.forEach(mealType => {
    const mealGroups = new Map<string, { time?: string, notes?: string, items: FoodItem[] }>();

    days.forEach(day => {
      const dayMeal = dietPlan.meals[day]?.[mealType];
      if (dayMeal && dayMeal.items && dayMeal.items.length > 0) {
        const mealKey = dayMeal.items.map(item => item.name).sort().join('|');
        if (!mealGroups.has(mealKey)) {
          mealGroups.set(mealKey, { time: dayMeal.time, notes: dayMeal.notes, items: dayMeal.items });
        }
      }
    });

    if (mealGroups.size === 0) return;

    content += `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title">${mealLabels[mealType]}</div>
        </div>
    `;

    Array.from(mealGroups.values()).forEach(group => {
      content += `
        <div class="meal-card ${mealType}">
          ${group.time ? `
            <div class="meal-header">
              <div class="meal-time">${formatTime(group.time)}</div>
            </div>
          ` : ''}
          <div class="food-list">
            ${group.items.map(item => `
              <div class="food-item ${mealType}">
                <div class="food-name">${item.name}</div>
                ${item.portions || item.calories ? `
                  <div class="food-meta">
                    ${item.portions ? `
                      <div class="food-meta-item">
                        <span class="food-meta-label">Portion</span>
                        <span class="food-meta-value">${item.portions}</span>
                      </div>
                    ` : ''}
                    ${item.calories ? `
                      <div class="food-meta-item">
                        <span class="food-meta-label">Calories</span>
                        <span class="food-meta-value">${item.calories}</span>
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          ${group.notes ? `<div class="meal-notes">${group.notes}</div>` : ''}
        </div>
      `;
    });

    content += `</div>`;
  });

  return content || '<p style="text-align: center; color: #94a3b8; padding: 40px; font-size: 14px;">No meals planned for this period.</p>';
}
