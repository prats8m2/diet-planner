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

export async function POST(request: Request) {
  try {
    const { client, dietPlan, exportType = 'daywise' } = await request.json();

    if (!client || !dietPlan) {
      return NextResponse.json(
        { error: 'Client and diet plan are required' },
        { status: 400 }
      );
    }

    // Generate PDF content as HTML for browser print/save
    const htmlContent = generateHTML(client, dietPlan, exportType);

    // Return HTML with proper headers for PDF generation
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
  const mealIcons: Record<string, string> = {
    breakfast: '🌅',
    lunch: '🍱',
    dinner: '🍽️',
    snacks: '🍪'
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${client.name} - Diet Plan</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f7fa;
      color: #1a202c;
      line-height: 1.6;
      padding: 20px;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 30px 40px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: contain;
      background: white;
      padding: 4px;
    }
    .branding {
      text-align: left;
    }
    .branding h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    .branding .tagline {
      font-size: 13px;
      opacity: 0.95;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .dietitian-info {
      text-align: right;
      font-size: 12px;
      opacity: 0.95;
    }
    .dietitian-info strong {
      display: block;
      font-size: 14px;
      margin-bottom: 2px;
    }
    .client-info {
      padding: 24px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
    }
    .info-item {
      text-align: center;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 4px;
    }
    .content {
      padding: 24px;
    }
    .day-section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .day-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #22c55e;
    }
    .day-title {
      font-size: 24px;
      font-weight: 700;
      color: #16a34a;
    }
    .day-number {
      font-size: 14px;
      color: #64748b;
    }
    .meal-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .meal-card.breakfast { border-left: 4px solid #FF6B6B; }
    .meal-card.lunch { border-left: 4px solid #10B981; }
    .meal-card.dinner { border-left: 4px solid #8B5CF6; }
    .meal-card.snacks { border-left: 4px solid #EC4899; }
    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .meal-title {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meal-time {
      font-size: 13px;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 12px;
    }
    .food-item {
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .food-item:last-child {
      border-bottom: none;
    }
    .food-name {
      font-weight: 500;
      color: #1e293b;
    }
    .food-details {
      display: flex;
      gap: 16px;
      margin-top: 4px;
      font-size: 13px;
      color: #64748b;
    }
    .meal-notes {
      background: #fffbeb;
      border-left: 3px solid #fbbf24;
      padding: 10px 12px;
      margin-top: 12px;
      border-radius: 4px;
      font-size: 13px;
      color: #92400e;
    }
    .footer {
      text-align: center;
      padding: 24px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .allergies-warning {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 12px;
      border-radius: 6px;
      margin-top: 12px;
      font-size: 13px;
    }
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #22c55e;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .print-button:hover {
      background: #16a34a;
    }
    @media print {
      .print-button { display: none; }
      body { padding: 0; background: white; }
      .page { box-shadow: none; }
      .day-section { page-break-inside: avoid; }
      .meal-card { page-break-inside: avoid; }
    }
    @page {
      margin: 15mm;
      size: A4;
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>

  <div class="page">
    <div class="header">
      <div class="logo-section">
        <img src="https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/bf781411-73fe-482b-b592-bcb201890f1d/0cc7668a4feaea35e3b0ad9e99dcbb09.png?UCloudPublicKey=TOKEN_e15ba47a-d098-4fbd-9afc-a0dcf0e4e621&Expires=1775408147&Signature=bVrMybGgYIP++zwsH4FfRa4Q3pk=" alt="Taste of Health Logo" class="logo">
        <div class="branding">
          <h1>Taste of Health</h1>
          <div class="tagline">Personalized Nutrition Plans</div>
        </div>
      </div>
      <div class="dietitian-info">
        <strong>Dietitian Pooja Singh</strong>
        Clinical Nutritionist
      </div>
    </div>

    <div class="client-info">
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #16a34a; margin-bottom: 4px;">Patient Details</div>
        <div style="font-size: 24px; font-weight: 700; color: #15803d;">${client.name}</div>
        ${client.metrics.goal ? `<div style="font-size: 13px; color: #64748b; margin-top: 4px;">Goal: ${client.metrics.goal}</div>` : ''}
      </div>
      <div class="info-grid">
        ${client.metrics.weight ? `
          <div class="info-item">
            <div class="info-label">Weight</div>
            <div class="info-value">${client.metrics.weight} kg</div>
          </div>
        ` : ''}
        ${client.metrics.height ? `
          <div class="info-item">
            <div class="info-label">Height</div>
            <div class="info-value">${client.metrics.height} cm</div>
          </div>
        ` : ''}
        ${client.metrics.age ? `
          <div class="info-item">
            <div class="info-label">Age</div>
            <div class="info-value">${client.metrics.age} years</div>
          </div>
        ` : ''}
        ${client.metrics.bmi ? `
          <div class="info-item">
            <div class="info-label">BMI</div>
            <div class="info-value">${client.metrics.bmi.toFixed(1)}</div>
          </div>
        ` : ''}
        ${client.metrics.bloodGroup ? `
          <div class="info-item">
            <div class="info-label">Blood Group</div>
            <div class="info-value">${client.metrics.bloodGroup}</div>
          </div>
        ` : ''}
      </div>
      ${client.metrics.allergies ? `
        <div class="allergies-warning">
          ⚠️ <strong>Allergies:</strong> ${client.metrics.allergies}
        </div>
      ` : ''}
    </div>

    <div class="content">
      ${exportType === 'daywise'
        ? generateDaywiseContent(dietPlan, days, mealLabels, mealIcons)
        : generateMealwiseContent(dietPlan, days, mealLabels)
      }
    </div>

    <div class="footer">
      <p><strong>Taste of Health</strong> by Dietitian Pooja Singh • ${new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
      <p style="margin-top: 8px;">This personalized nutrition plan is designed for your specific needs. Please consult a healthcare provider before making significant dietary changes.</p>
    </div>
  </div>

  <script>
    // Auto-open print dialog when page loads
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

function generateDaywiseContent(dietPlan: DietPlan, days: string[], mealLabels: Record<string, string>, mealIcons: Record<string, string>): string {
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
              <div class="meal-title">${mealIcons[mealType]} ${mealLabels[mealType]}</div>
              ${meal.time ? `<div class="meal-time">${meal.time}</div>` : ''}
            </div>
            ${meal.items.map(item => `
              <div class="food-item">
                <div class="food-name">${item.name}</div>
                ${item.portions || item.calories ? `
                  <div class="food-details">
                    ${item.portions ? `<span>📊 ${item.portions}</span>` : ''}
                    ${item.calories ? `<span>🔥 ${item.calories} cal</span>` : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
            ${meal.notes ? `<div class="meal-notes">📝 ${meal.notes}</div>` : ''}
          </div>
        `;
      }
    });

    content += `</div>`;
  });

  return content || '<p style="text-align: center; color: #64748b; padding: 40px;">No meals planned for this period.</p>';
}

function generateMealwiseContent(dietPlan: DietPlan, days: string[], mealLabels: Record<string, string>): string {
  let content = '';
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'] as const;
  const mealColors: Record<string, string> = {
    breakfast: '#FF6B6B',
    lunch: '#10B981',
    dinner: '#8B5CF6',
    snacks: '#EC4899'
  };

  mealTypes.forEach(mealType => {
    const mealGroups = new Map<string, { days: string[], time?: string, notes?: string, items: FoodItem[] }>();

    days.forEach(day => {
      const dayMeal = dietPlan.meals[day]?.[mealType];
      if (dayMeal && dayMeal.items && dayMeal.items.length > 0) {
        const mealKey = dayMeal.items.map(item => item.name).sort().join('|');
        if (!mealGroups.has(mealKey)) {
          mealGroups.set(mealKey, { days: [day], time: dayMeal.time, notes: dayMeal.notes, items: dayMeal.items });
        } else {
          mealGroups.get(mealKey)!.days.push(day);
        }
      }
    });

    if (mealGroups.size === 0) return;

    content += `
      <div class="day-section">
        <div class="day-header">
          <div class="day-title" style="color: ${mealColors[mealType]}">${mealLabels[mealType]}</div>
        </div>
    `;

    Array.from(mealGroups.entries()).forEach(([, group]) => {
      content += `
        <div class="meal-card ${mealType}">
          ${group.time ? `
            <div class="meal-header">
              <div style="font-size: 13px; color: #64748b;">
                ${group.time}
              </div>
            </div>
          ` : ''}
          ${group.items.map(item => `
            <div class="food-item">
              <div class="food-name">${item.name}</div>
              ${item.portions || item.calories ? `
                <div class="food-details">
                  ${item.portions ? `<span>📊 ${item.portions}</span>` : ''}
                  ${item.calories ? `<span>🔥 ${item.calories} cal</span>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
          ${group.notes ? `<div class="meal-notes">📝 ${group.notes}</div>` : ''}
        </div>
      `;
    });

    content += `</div>`;
  });

  return content || '<p style="text-align: center; color: #64748b; padding: 40px;">No meals planned for this period.</p>';
}
