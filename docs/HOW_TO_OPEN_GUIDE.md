# 📄 How to Get the Teacher Testing Guide

## Quick Instructions

### ✅ **EASIEST WAY - Open the HTML File**

1. **Find the file:** `TEACHER_UAT_GUIDE.html` (in the `docs` folder)
2. **Double-click it** - it will open in your web browser
3. **That's it!** You can now read the guide

### 📥 **To Save as PDF:**

Once the HTML file is open in your browser:

1. Press **Ctrl + P** (or click the Print button)
2. Choose **"Save as PDF"** or **"Microsoft Print to PDF"**
3. Click **"Save"**
4. Done! Now you have a PDF file you can email or print

### 🖨️ **To Print Physical Copies:**

1. Open `TEACHER_UAT_GUIDE.html` in your browser
2. Press **Ctrl + P**
3. Select your printer
4. Click **"Print"**

---

## 🤔 Alternative Ways

### If the HTML file won't open:

**Option 1: Choose a browser**
- Right-click `TEACHER_UAT_GUIDE.html`
- Click "Open with"
- Choose Chrome, Edge, or Firefox

**Option 2: Run the conversion script**
```
.\scripts\convert-guide-to-pdf.ps1
```

### If you want to convert to PDF automatically:

We recommend using your browser's "Print to PDF" feature (steps above), but if you want other options:

1. **Microsoft Word**
   - Open the HTML file in Word
   - File → Save As → PDF

2. **Online Converter**
   - Go to https://www.markdowntopdf.com/
   - Upload the `.md` file
   - Download the PDF

3. **Install Pandoc** (for developers)
   ```
   winget install --id JohnMacFarlane.Pandoc
   pandoc docs\TEACHER_UAT_GUIDE.md -o docs\TEACHER_UAT_GUIDE.pdf
   ```

---

## 📁 Files Available

| File | Format | Best For |
|------|--------|----------|
| `TEACHER_UAT_GUIDE.html` | HTML | Opening in browser, printing to PDF |
| `TEACHER_UAT_GUIDE.md` | Markdown | Editing, version control |
| `TEACHER_UAT_GUIDE.pdf` | PDF | Sharing via email, printing *(you create this)* |

---

## 💡 Tips

- **For Teachers:** Use the `.html` file - it's the easiest!
- **For Email:** Convert to PDF first (Ctrl+P → Save as PDF)
- **For Editing:** Use the `.md` file (developers only)
- **For Printing:** Print directly from the HTML file

---

## ❓ Need Help?

If you're having trouble opening or converting the file:

1. Make sure you have a web browser (Chrome, Edge, Firefox)
2. Try right-clicking the HTML file and choosing "Open with" → Your browser
3. Contact IT support

---

**File Locations:**
- HTML: `docs/TEACHER_UAT_GUIDE.html`
- Markdown: `docs/TEACHER_UAT_GUIDE.md`
- Conversion Script: `scripts/convert-guide-to-pdf.ps1`
