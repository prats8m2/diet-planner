import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import type { Client, DietPlan } from '@/types';

export async function POST(request: Request) {
  try {
    const { client, dietPlan, exportType = 'daywise' } = await request.json();

    if (!client || !dietPlan) {
      return NextResponse.json(
        { error: 'Client and diet plan are required' },
        { status: 400 }
      );
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add colored header
    const addHeader = (text: string, color: number[]) => {
      doc.setFillColor(...color);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(text, margin + 4, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 11;
    };

    // Main Title Header with gradient effect
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('DIET PLAN', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Personalized Nutrition Plan', pageWidth / 2, 30, { align: 'center' });

    doc.setFillColor(255, 255, 255, 0.3);
    doc.ellipse(pageWidth / 2, 50, 40, 5, 'F');

    yPosition = 55;

    // Client Information Box
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'S');

    doc.setTextColor(16, 185, 129);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name.toUpperCase(), margin + 8, yPosition + 10);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const info = [];
    if (client.metrics.weight) info.push(`${client.metrics.weight} kg`);
    if (client.metrics.height) info.push(`${client.metrics.height} cm`);
    if (client.metrics.age) info.push(`${client.metrics.age} yrs`);
    if (client.metrics.bloodGroup) info.push(`Blood: ${client.metrics.bloodGroup}`);
    if (client.metrics.goal) info.push(`Goal: ${client.metrics.goal}`);

    doc.text(info.join('  •  '), margin + 8, yPosition + 20);

    if (client.metrics.allergies) {
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠️ Allergies: ${client.metrics.allergies}`, margin + 8, yPosition + 28);
    }

    yPosition = yPosition + 45;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealLabels: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snacks: 'Snacks'
    };
    const mealColors: Record<string, number[]> = {
      breakfast: [251, 146, 60],    // Orange
      lunch: [34, 197, 94],        // Green
      dinner: [139, 92, 246],      // Purple
      snacks: [236, 72, 153]       // Pink
    };

    if (exportType === 'daywise') {
      // DAY-WISE EXPORT (Mon, Tue, Wed...)
      days.forEach((day, dayIndex) => {
        checkNewPage(50);

        // Day header
        doc.setFillColor(16, 185, 129);
        doc.roundedRect(margin, yPosition, 60, 10, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(day, margin + 8, yPosition + 6);
        doc.setTextColor(0, 0, 0);
        yPosition += 15;

        const dayMeals = dietPlan.meals[day];
        if (!dayMeals || Object.keys(dayMeals).length === 0) {
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text('No meals planned for this day', margin + 5, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          yPosition += 10;
        } else {
          Object.entries(mealLabels).forEach(([mealType, label]) => {
            const meal = dayMeals[mealType];
            if (meal && meal.items && meal.items.length > 0) {
              checkNewPage(40);

              // Meal card
              doc.setFillColor(...(mealColors[mealType] || [200, 200, 200]));
              doc.roundedRect(margin + 3, yPosition, pageWidth - 2 * margin - 6, 18, 2, 2, 'F');

              doc.setTextColor(255, 255, 255);
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.text(`${label}${meal.time ? ' • ' + meal.time : ''}`, margin + 8, yPosition + 7);

              doc.setTextColor(60, 60, 60);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'normal');

              // Food items
              meal.items.forEach((item, itemIndex) => {
                checkNewPage(8);
                const itemText = `  ${itemIndex + 1}. ${item.name}`;
                doc.text(itemText, margin + 8, yPosition);
                yPosition += 6;

                // Details on same line if available
                const details = [];
                if (item.portions) details.push(item.portions);
                if (item.calories) details.push(`${item.calories} cal`);

                if (details.length > 0) {
                  checkNewPage(6);
                  doc.text(`     ${details.join(' • ')}`, margin + 8, yPosition);
                  yPosition += 6;
                }
              });

              // Meal notes if present
              if (meal.notes) {
                checkNewPage(8);
                doc.setFont('helvetica', 'italic');
                doc.text(`     📝 ${meal.notes}`, margin + 8, yPosition);
                doc.setFont('helvetica', 'normal');
                yPosition += 6;
              }

              yPosition += 5;
            }
          });
        }

        yPosition += 10;

        // Add separator between days (except last)
        if (dayIndex < days.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineDash([2, 2]);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          doc.setLineDash([]);
          yPosition += 8;
        }
      });

    } else {
      // MEAL-WISE EXPORT (All breakfasts together, all lunches together...)
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 10, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MEAL PLAN OVERVIEW', pageWidth / 2, yPosition + 6, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      yPosition += 18;

      Object.entries(mealLabels).forEach(([mealType, label]) => {
        checkNewPage(50);

        // Meal type header
        doc.setFillColor(...(mealColors[mealType] || [200, 200, 200]));
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), margin + 8, yPosition + 8);
        doc.setTextColor(0, 0, 0);
        yPosition += 17;

        // Collect all items for this meal type across all days
        const allDays: string[] = [];
        days.forEach(day => {
          const dayMeal = dietPlan.meals[day]?.[mealType];
          if (dayMeal && dayMeal.items && dayMeal.items.length > 0) {
            allDays.push(day);
          }
        });

        if (allDays.length === 0) {
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text(`No ${label.toLowerCase()} items planned`, margin + 8, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          yPosition += 12;
        } else {
          // Group identical meals across days
          const mealGroups: Map<string, { days: string[], time?: string, notes?: string }> = new Map();

          allDays.forEach(day => {
            const dayMeal = dietPlan.meals[day]?.[mealType];
            if (dayMeal && dayMeal.items) {
              const mealKey = dayMeal.items.map(item => item.name).sort().join('|');
              if (!mealGroups.has(mealKey)) {
                mealGroups.set(mealKey, { days: [], time: dayMeal.time, notes: dayMeal.notes });
              }
              mealGroups.get(mealKey)!.days.push(day);
            }
          });

          // Display each unique meal
          let groupIndex = 1;
          mealGroups.forEach((group) => {
            const dayMeal = dietPlan.meals[group.days[0]]?.[mealType];
            if (!dayMeal || !dayMeal.items) return;

            checkNewPage(30);

            // Group header
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(margin + 3, yPosition, pageWidth - 2 * margin - 6, 8, 2, 2, 'F');

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Option ${groupIndex}: ${group.days.join(', ')}`, margin + 8, yPosition + 5);
            yPosition += 12;

            // Food items
            dayMeal.items.forEach((item) => {
              checkNewPage(7);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
              doc.text(`• ${item.name}`, margin + 8, yPosition);
              yPosition += 6;

              const details = [];
              if (item.portions) details.push(item.portions);
              if (item.calories) details.push(`${item.calories} cal`);

              if (details.length > 0) {
                checkNewPage(6);
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`  ${details.join(' • ')}`, margin + 10, yPosition);
                doc.setTextColor(0, 0, 0);
                yPosition += 6;
              }
            });

            // Time if available
            if (group.time) {
              checkNewPage(6);
              doc.setFontSize(8);
              doc.setTextColor(120, 120, 120);
              doc.text(`⏰ ${group.time}`, margin + 8, yPosition);
              doc.setTextColor(0, 0, 0);
              yPosition += 6;
            }

            // Notes if present
            if (group.notes) {
              checkNewPage(6);
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(100, 100, 100);
              doc.text(`📝 ${group.notes}`, margin + 8, yPosition);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              yPosition += 6;
            }

            yPosition += 8;
            groupIndex++;
          });
        }

        yPosition += 8;

        // Add separator between meal types
        doc.setDrawColor(200, 200, 200);
        doc.setLineDash([2, 2]);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        doc.setLineDash([]);
        yPosition += 10;
      });
    }

    // Footer on each page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer background
      doc.setFillColor(245, 245, 245);
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated by Diet Planner • Dietitian Pooja Singh`,
        pageWidth / 2,
        pageHeight - 14,
        { align: 'center' }
      );

      doc.setFontSize(6);
      doc.text(
        `Page ${i} of ${pageCount} • ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const filename = exportType === 'daywise'
      ? `${client.name.replace(/\s+/g, '-')}-diet-plan-daywise.pdf`
      : `${client.name.replace(/\s+/g, '-')}-diet-plan-mealwise.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
