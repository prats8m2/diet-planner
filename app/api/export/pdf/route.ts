import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import type { Client, DietPlan } from '@/types';

export async function POST(request: Request) {
  try {
    const { client, dietPlan } = await request.json();

    if (!client || !dietPlan) {
      return NextResponse.json(
        { error: 'Client and diet plan are required' },
        { status: 400 }
      );
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper function to add text with auto-newline
    const addText = (text: string, fontSize: number, x: number, lineHeight: number) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      lines.forEach((line: string) => {
        checkNewPage(lineHeight);
        doc.text(line, x, yPosition);
        yPosition += lineHeight;
      });
    };

    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Diet Plan', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Client Name
    doc.setFontSize(18);
    doc.text(client.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Client Information Section
    if (client.metrics) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Information', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const info = [];
      if (client.metrics.weight) info.push(`Weight: ${client.metrics.weight} kg`);
      if (client.metrics.height) info.push(`Height: ${client.metrics.height} cm`);
      if (client.metrics.age) info.push(`Age: ${client.metrics.age} years`);
      if (client.metrics.bloodGroup) info.push(`Blood Group: ${client.metrics.bloodGroup}`);
      if (client.metrics.goal) info.push(`Goal: ${client.metrics.goal}`);

      if (info.length > 0) {
        doc.text(info.join(' | '), margin, yPosition);
        yPosition += 7;
      }

      if (client.metrics.allergies) {
        checkNewPage(7);
        doc.text(`Allergies: ${client.metrics.allergies}`, margin, yPosition);
        yPosition += 7;
      }

      yPosition += 5;
    }

    // Diet Plan Section
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealLabels: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snacks: 'Snacks'
    };

    days.forEach((day, dayIndex) => {
      checkNewPage(30);

      // Day header
      doc.setFillColor(16, 185, 129);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(day, margin + 5, yPosition + 7);
      doc.setTextColor(0, 0, 0);
      yPosition += 15;

      const dayMeals = dietPlan.meals[day];
      if (!dayMeals || Object.keys(dayMeals).length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('No meals planned for this day', margin + 5, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 8;
      } else {
        Object.entries(mealLabels).forEach(([mealType, label]) => {
          const meal = dayMeals[mealType];
          if (meal && meal.items && meal.items.length > 0) {
            checkNewPage(25);

            // Meal type label
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}${meal.time ? ' - ' + meal.time : ''}`, margin + 5, yPosition);
            yPosition += 6;

            // Food items list
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            meal.items.forEach((item, itemIndex) => {
              checkNewPage(10);

              // Item number and name
              doc.text(`${itemIndex + 1}. ${item.name}`, margin + 10, yPosition);
              yPosition += 5;

              // Portions and calories on same line if available
              const details = [];
              if (item.portions) details.push(`📊 ${item.portions}`);
              if (item.calories) details.push(`🔥 ${item.calories} cal`);

              if (details.length > 0) {
                doc.text(details.join(' | '), margin + 15, yPosition);
                yPosition += 5;
              }
            });

            // Meal notes if present
            if (meal.notes) {
              checkNewPage(8);
              doc.setFont('helvetica', 'italic');
              doc.text(`Notes: ${meal.notes}`, margin + 10, yPosition);
              doc.setFont('helvetica', 'normal');
              yPosition += 5;
            }

            yPosition += 5;
          }
        });
      }

      yPosition += 5;
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated by Diet Planner - Pooja Singh`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${client.name.replace(/\s+/g, '-')}-diet-plan.pdf"`,
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
