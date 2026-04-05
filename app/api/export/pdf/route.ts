import { NextResponse } from 'next/server';
import type { Client, DietPlan, FoodItem } from '@/types';
import { LOGO_BASE64 } from './logo';

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

function getBMIStatus(bmi: number): { label: string; color: string; bgColor: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#1e40af', bgColor: '#dbeafe' };
  if (bmi < 25) return { label: 'Normal', color: '#166534', bgColor: '#dcfce7' };
  if (bmi < 30) return { label: 'Overweight', color: '#c2410c', bgColor: '#fed7aa' };
  return { label: 'Obese', color: '#b91c1c', bgColor: '#fecaca' };
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
      background: #ffffff;
      color: #1a1a1a;
      line-height: 1.5;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d1d5db;
    }

    /* Header */
    .header {
      background: #ffffff;
      padding: 24px 32px;
      border-bottom: 2px solid #16a34a;
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
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: contain;
      background: #f0fdf4;
      padding: 6px;
    }

    .branding h1 {
      font-size: 22px;
      font-weight: 800;
      color: #16a34a;
      letter-spacing: -0.3px;
      margin-bottom: 2px;
    }

    .branding .tagline {
      font-size: 10px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .dietitian-info {
      text-align: right;
    }

    .dietitian-info .name {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .dietitian-info .title {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .dietitian-info .contact {
      font-size: 10px;
      color: #6b7280;
      line-height: 1.5;
    }

    .dietitian-info .contact a {
      color: #16a34a;
      text-decoration: none;
    }

    /* Patient Section */
    .patient-section {
      padding: 24px 32px;
      background: #fafafa;
      border-bottom: 1px solid #e5e7eb;
    }

    .patient-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .patient-name-section {
      flex: 1;
    }

    .patient-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #16a34a;
      margin-bottom: 4px;
    }

    .patient-name {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }

    .patient-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-goal {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #10b981;
    }

    .badge-pref {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #f59e0b;
    }

    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .metrics-table td {
      padding: 8px 0;
      vertical-align: top;
    }

    .metrics-table .label {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      padding-bottom: 2px;
    }

    .metrics-table .value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
    }

    .metrics-table .value-small {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }

    .bmi-card {
      display: inline-block;
      padding: 10px 16px;
      border-radius: 6px;
      margin-top: 16px;
      border-left: 3px solid;
    }

    .bmi-label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .bmi-value {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
    }

    .bmi-status {
      font-size: 12px;
      font-weight: 600;
      margin-top: 2px;
    }

    .allergies-box {
      margin-top: 12px;
      padding: 10px 14px;
      background: #fef2f2;
      border-left: 3px solid #dc2626;
      font-size: 11px;
      color: #991b1b;
      line-height: 1.4;
    }

    .allergies-box::before {
      content: 'Allergies: ';
      font-weight: 600;
    }

    /* Content */
    .content {
      padding: 24px 32px;
    }

    .day-section {
      margin-bottom: 32px;
    }

    .day-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #d1d5db;
    }

    .day-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }

    .day-number {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      background: #f3f4f6;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Meal Card */
    .meal-card {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .meal-card-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .meal-card.breakfast .meal-card-header { background: #fef2f2; }
    .meal-card.lunch .meal-card-header { background: #ecfdf5; }
    .meal-card.dinner .meal-card-header { background: #f5f3ff; }
    .meal-card.snacks .meal-card-header { background: #fdf2f8; }

    .meal-title {
      font-size: 15px;
      font-weight: 700;
      color: #1f2937;
    }

    .meal-time {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }

    /* Food Items */
    .food-list {
      padding: 12px 16px;
    }

    .food-item {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #e5e7eb;
    }

    .food-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .food-item:first-child {
      padding-top: 0;
    }

    .food-item::before {
      content: '•';
      color: #16a34a;
      font-size: 16px;
      font-weight: bold;
      margin-right: 8px;
    }

    .food-name {
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
      flex: 1;
    }

    .food-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #6b7280;
    }

    .food-meta span {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .food-meta-label {
      color: #9ca3af;
      font-size: 9px;
      text-transform: uppercase;
    }

    /* Notes */
    .meal-notes {
      margin: 12px 16px;
      padding: 10px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.4;
    }

    .meal-notes::before {
      content: 'Note: ';
      font-weight: 600;
    }

    /* Footer */
    .footer {
      padding: 20px 32px;
      background: #fafafa;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .footer-brand {
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 2px;
    }

    .footer-date {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .footer-social {
      font-size: 10px;
      color: #6b7280;
      margin-top: 8px;
    }

    .footer-social a {
      color: #16a34a;
      text-decoration: none;
      margin: 0 8px;
    }

    .footer-disclaimer {
      margin-top: 10px;
      font-size: 10px;
      color: #9ca3af;
      line-height: 1.5;
      max-width: 480px;
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
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-family: inherit;
    }

    .print-button:hover {
      background: #15803d;
    }

    /* Print Styles */
    @media print {
      .print-button { display: none !important; }
      body { padding: 0; }
      .page { border: none; }
      .day-section { page-break-inside: avoid; }
      .meal-card { page-break-inside: avoid; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    @page {
      margin: 10mm;
      size: A4;
    }
  </style>
</head>
<body>
  <button class="print-button" onclick="window.print()">Print / Save as PDF</button>

  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img src="${LOGO_BASE64}" alt="Taste of Health" class="logo">
        <div class="branding">
          <h1>Taste of Health</h1>
          <div class="tagline">Personalized Nutrition Plans</div>
        </div>
      </div>
      <div class="dietitian-info">
        <div class="name">Pooja Singh</div>
        <div class="title">Clinical Dietitian</div>
        <div class="contact">
          📞 <a href="tel:8299601494">8299601494</a><br>
          ✉️ <a href="mailto:dt.poojasingh@gmail.com">dt.poojasingh@gmail.com</a>
        </div>
      </div>
    </div>

    <!-- Patient Info -->
    <div class="patient-section">
      <div class="patient-header">
        <div class="patient-name-section">
          <div class="patient-label">Patient Details</div>
          <div class="patient-name">${client.name}</div>
          <div class="patient-badges">
            ${client.metrics.goal ? `<div class="badge badge-goal">Goal: ${client.metrics.goal}</div>` : ''}
            ${client.metrics.foodPreference ? `<div class="badge badge-pref">${client.metrics.foodPreference === 'non-veg' ? 'Non-Vegetarian' : client.metrics.foodPreference === 'eggetarian' ? 'Eggetarian' : 'Vegetarian'}</div>` : ''}
          </div>
        </div>
      </div>

      <table class="metrics-table">
        <tr>
          ${client.metrics.weight ? `
            <td>
              <div class="label">Weight</div>
              <div class="value">${client.metrics.weight} kg</div>
            </td>
          ` : ''}
          ${client.metrics.height ? `
            <td>
              <div class="label">Height</div>
              <div class="value">${client.metrics.height} cm</div>
            </td>
          ` : ''}
          ${client.metrics.age ? `
            <td>
              <div class="label">Age</div>
              <div class="value">${client.metrics.age} yrs</div>
            </td>
          ` : ''}
          ${client.metrics.bloodGroup ? `
            <td>
              <div class="label">Blood Group</div>
              <div class="value">${client.metrics.bloodGroup}</div>
            </td>
          ` : ''}
        </tr>
        <tr>
          ${client.metrics.energy ? `
            <td>
              <div class="label">Energy</div>
              <div class="value-small">${client.metrics.energy} kcal</div>
            </td>
          ` : ''}
          ${client.metrics.protein ? `
            <td>
              <div class="label">Protein</div>
              <div class="value-small">${client.metrics.protein} g</div>
            </td>
          ` : ''}
          ${client.metrics.carbs ? `
            <td>
              <div class="label">Carbs</div>
              <div class="value-small">${client.metrics.carbs} g</div>
            </td>
          ` : ''}
        </tr>
      </table>

      ${client.metrics.bmi ? `
        <div class="bmi-card" style="background: ${getBMIStatus(client.metrics.bmi).bgColor}; border-left-color: ${getBMIStatus(client.metrics.bmi).color};">
          <div class="bmi-label">Body Mass Index</div>
          <div class="bmi-value">${client.metrics.bmi.toFixed(1)}</div>
          <div class="bmi-status" style="color: ${getBMIStatus(client.metrics.bmi).color};">${getBMIStatus(client.metrics.bmi).label}</div>
        </div>
      ` : ''}

      ${client.metrics.allergies ? `
        <div class="allergies-box">
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
      <div class="footer-social">
        <a href="https://www.instagram.com/_tasteofhealth">Instagram: @_tasteofhealth</a> |
        <a href="https://www.youtube.com/@tasteofhealth_yt">YouTube: @tasteofhealth_yt</a>
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
            <div class="meal-card-header">
              <div class="meal-title">${mealLabels[mealType]}</div>
              ${meal.time ? `<div class="meal-time">${formatTime(meal.time)}</div>` : ''}
            </div>
            <div class="food-list">
              ${meal.items.map(item => `
                <div class="food-item">
                  <div class="food-name">${item.name}</div>
                  ${item.portions || item.calories ? `
                    <div class="food-meta">
                      ${item.portions ? `<span><span class="food-meta-label">Portion:</span> ${item.portions}</span>` : ''}
                      ${item.calories ? `<span><span class="food-meta-label">Cal:</span> ${item.calories}</span>` : ''}
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

  return content || '<p style="text-align: center; color: #9ca3af; padding: 40px; font-size: 13px;">No meals planned for this period.</p>';
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
            <div class="meal-card-header">
              <div class="meal-time">${formatTime(group.time)}</div>
            </div>
          ` : ''}
          <div class="food-list">
            ${group.items.map(item => `
              <div class="food-item">
                <div class="food-name">${item.name}</div>
                ${item.portions || item.calories ? `
                  <div class="food-meta">
                    ${item.portions ? `<span><span class="food-meta-label">Portion:</span> ${item.portions}</span>` : ''}
                    ${item.calories ? `<span><span class="food-meta-label">Cal:</span> ${item.calories}</span>` : ''}
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

  return content || '<p style="text-align: center; color: #9ca3af; padding: 40px; font-size: 13px;">No meals planned for this period.</p>';
}
