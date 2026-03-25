#!/usr/bin/env node
/**
 * Professional CV PDF Generator
 * Usage: node scripts/generate-cv-pdf.cjs
 */
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 210
    const H = doc.internal.pageSize.getHeight();   // 297
    const LEFT = 14;
    const RIGHT = W - 14;
    const CONTENT_W = RIGHT - LEFT;

    // ── Color palette ──
    const NAVY   = [25, 42, 86];
    const ACCENT  = [41, 128, 185];
    const DARK    = [44, 62, 80];
    const MED     = [100, 100, 110];
    const LIGHT   = [130, 130, 140];
    const BULLET  = [41, 128, 185];

    let y = 0;

    // ══════════════════════════════════════════════════
    // HEADER BAND — dark navy bar
    // ══════════════════════════════════════════════════
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 38, 'F');

    // Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MARK GIL DOTILLOS', W / 2, 14, { align: 'center' });

    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sr. Application System Engineer  |  Enterprise Solutions Architect', W / 2, 21, { align: 'center' });

    // Contact line
    doc.setFontSize(8.5);
    doc.setTextColor(180, 200, 220);
    doc.text('Lipa City, Batangas  •  (+63) 988 483 8815  •  kramlig.dotillos@gmail.com', W / 2, 28, { align: 'center' });

    // Accent stripe
    doc.setFillColor(...ACCENT);
    doc.rect(0, 38, W, 1.5, 'F');

    y = 46;

    // ── Helpers ──────────────────────────────────
    function sectionTitle(title) {
      if (y > H - 20) { doc.addPage(); y = 14; }
      doc.setFillColor(...ACCENT);
      doc.rect(LEFT, y, 3, 6, 'F');
      doc.setTextColor(...NAVY);
      doc.setFontSize(11.5);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), LEFT + 5.5, y + 4.5);
      y += 8;
      doc.setDrawColor(200, 200, 210);
      doc.setLineWidth(0.3);
      doc.line(LEFT, y, RIGHT, y);
      y += 4;
    }

    function bodyText(text, indent, opts) {
      indent = indent || 0;
      const maxW = CONTENT_W - indent;
      doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
      doc.setFontSize(opts?.size || 9);
      doc.setTextColor(...(opts?.color || DARK));
      const lines = doc.splitTextToSize(text, maxW);
      for (const line of lines) {
        if (y > H - 10) { doc.addPage(); y = 14; }
        doc.text(line, LEFT + indent, y);
        y += (opts?.leading || 3.8);
      }
    }

    function bullet(text, indent) {
      if (y > H - 10) { doc.addPage(); y = 14; }
      doc.setFillColor(...BULLET);
      doc.circle(LEFT + (indent || 4) - 1.5, y - 1, 0.8, 'F');
      bodyText(text, indent || 4, { size: 8.5, leading: 4 });
    }

    function jobHeader(title, company, dates) {
      if (y > H - 16) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      doc.text(title, LEFT + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...LIGHT);
      doc.text(dates, RIGHT, y, { align: 'right' });
      y += 4;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...MED);
      doc.text(company, LEFT + 1, y);
      y += 5;
    }

    function keyAchievement(text) {
      if (y > H - 12) { doc.addPage(); y = 14; }
      doc.setFillColor(235, 245, 252);
      const lines = doc.splitTextToSize(text, CONTENT_W - 14);
      const boxH = lines.length * 3.4 + 3;
      doc.roundedRect(LEFT + 1, y - 2, CONTENT_W - 2, boxH, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(8);
      doc.setTextColor(...ACCENT);
      doc.text('Key:', LEFT + 3, y + 0.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      for (const line of lines) {
        doc.text(line, LEFT + 12, y + 0.8);
        y += 3.4;
      }
      y += 2.5;
    }

    function skillRow(label, skills) {
      if (y > H - 10) { doc.addPage(); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...NAVY);
      doc.text(label + ':', LEFT + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text(skills, LEFT + 42, y);
      y += 4.5;
    }

    // ══════════════════════════════════════════════════
    // PROFESSIONAL SUMMARY
    // ══════════════════════════════════════════════════
    sectionTitle('Professional Summary');
    bodyText(
      'Results-driven Sr. Application System Engineer with over 10 years of hands-on experience in enterprise system development, cloud infrastructure, and technical consulting. I specialize in building scalable solutions and standardizing DevOps practices that reduce complexity and accelerate delivery. From automating government billing systems to architecting multi-tenant school platforms, I bring a builder\'s mindset to every engagement — bridging business needs with reliable, well-architected technology.',
      1,
      { size: 9, leading: 4.2, color: MED }
    );
    y += 4;

    // ══════════════════════════════════════════════════
    // CORE COMPETENCIES
    // ══════════════════════════════════════════════════
    sectionTitle('Core Competencies');
    skillRow('Languages & Frameworks', 'Java  •  PHP  •  COBOL  •  Spring Boot  •  CodeIgniter  •  React  •  TypeScript');
    skillRow('Database & Data',        'MySQL  •  PostgreSQL  •  Redshift  •  Firestore  •  ETL (Talend/Spoon)');
    skillRow('Cloud & DevOps',         'AWS  •  Azure (AZ-900)  •  Firebase  •  Infrastructure Automation  •  CI/CD');
    skillRow('Analytics & BI',         'Power BI  •  Spago BI  •  Business Intelligence');
    skillRow('AI-Augmented Dev',       'GitHub Copilot  •  AI-assisted code generation, review & architecture');
    y += 3;

    // ══════════════════════════════════════════════════
    // PROFESSIONAL EXPERIENCE
    // ══════════════════════════════════════════════════
    sectionTitle('Professional Experience');

    // --- Fujitsu Sr ---
    jobHeader(
      'Sr. Application System Engineer / Consultant',
      'FUJITSU PHILIPPINES INC., Taguig City',
      'Jun 2022 – Present'
    );
    bullet('Spearhead INFRA Standardization initiative — enterprise-wide cloud infrastructure and DevOps standards, upskilling teams across organizational units');
    bullet('Led IPv3 Conversion project — seamless transition from legacy infrastructure with zero downtime impact');
    bullet('Drive business analysis, system architecture, and technical documentation for enterprise clients');
    keyAchievement('Reduced deployment cycle time by 40% through infrastructure automation; DevOps framework adopted across 5+ business units');

    // --- Fujitsu ---
    jobHeader(
      'Application System Engineer / Consultant',
      'FUJITSU PHILIPPINES INC., Taguig City',
      'Mar 2021 – Jun 2022'
    );
    bullet('Architected JKA 2021 & 2022 automated application testing systems — reduced processing time by 35%');
    bullet('Developed JDI Microservices platform supporting 1,000+ concurrent users with high scalability');
    bullet('Designed comprehensive automated testing frameworks and microservices infrastructure');
    y += 1;

    // --- Intercommerce ---
    jobHeader(
      'Senior Web Developer',
      'INTERCOMMERCE NETWORK SERVICES, Makati City',
      'Jun 2018 – Feb 2021'
    );
    bullet('Engineered Electronic Billing Payment System for SBMA — reduced billing errors by 60%');
    bullet('Developed Customer Service Monitoring System & Finance Reporting Suite for real-time analytics');
    bullet('Built IBM SkyTrust Integration for Bureau of Customs and centralized International Data Warehouse');
    y += 2;

    // --- Earlier roles ---
    jobHeader(
      'Web Developer',
      "MAX'S GROUP INC. & HP OUTSOURCING PHIL. INC., Makati / Davao City",
      'Jul 2013 – May 2018'
    );
    bullet('Developed e-commerce platforms (Magento), internal systems, and data repositories supporting 50,000+ records');
    bullet('Built Store Profile System & Commissary Feedback System, streamlining internal operations');

    y += 3;

    // ══════════════════════════════════════════════════
    // PERSONAL PROJECTS
    // ══════════════════════════════════════════════════
    sectionTitle('Personal Projects');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text('EduSync.ph — School Information System', LEFT + 1, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text('edusync.ph', RIGHT, y, { align: 'right' });
    y += 4.5;
    bullet('Full-stack offline-first PWA (React + TypeScript + Firebase) for Philippine K-12 schools — manages enrollment, grading, DepEd forms, attendance, and real-time reporting for multiple tenants', 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text('Game Reporting App', LEFT + 1, y);
    y += 4.5;
    bullet('Real-time game analytics and reporting application — tracks scores, player stats, and generates automated performance reports', 4);

    y += 2;

    // ══════════════════════════════════════════════════
    // EDUCATION & CERTIFICATION (combined row)
    // ══════════════════════════════════════════════════
    sectionTitle('Education & Certification');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text('BS Information Technology', LEFT + 2, y);
    // Chess varsity badge
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...ACCENT);
    doc.text('|  Chess Varsity', LEFT + 52, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MED);
    doc.text('Davao Oriental State University  •  2013', RIGHT, y, { align: 'right' });
    y += 6;
    // Certification badge row
    doc.setFillColor(235, 245, 252);
    doc.roundedRect(LEFT + 1, y - 3, CONTENT_W - 2, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...ACCENT);
    doc.text('CERTIFIED:', LEFT + 4, y + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text('Microsoft Azure Fundamentals (AZ-900)  •  AWS Cloud Foundations  •  Agile / Scrum', LEFT + 28, y + 1);
    y += 8;

    // ══════════════════════════════════════════════════
    // FOOTER accent stripe
    // ══════════════════════════════════════════════════
    doc.setFillColor(...ACCENT);
    doc.rect(0, H - 4, W, 4, 'F');

    // ── Save ────────────────────────────────────────
    const outputPath = path.join(__dirname, '..', 'MARK_GIL_DOTILLOS_CV.pdf');
    const buffer = doc.output('arraybuffer');
    fs.writeFileSync(outputPath, Buffer.from(buffer));

    console.log(`✅ PDF generated: ${outputPath}`);
    console.log(`📄 Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
    console.log(`📃 Pages: ${doc.internal.getNumberOfPages()}`);
    console.log(`📐 Final y: ${y.toFixed(1)} / page height: ${H}`);
    if (doc.internal.getNumberOfPages() > 1) {
      console.log('⚠️  WARNING: PDF exceeded 1 page! Final y position:', y, '/ max:', H);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
