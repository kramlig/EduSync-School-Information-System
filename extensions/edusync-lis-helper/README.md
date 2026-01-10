# EduSync LIS Helper - Browser Extension

Chrome extension for bi-directional data flow between EduSync SIS and DepEd LIS.

## Features

### Tab 1: Fill LIS (EduSync → LIS)
- 📂 **Import Data**: Load student data exported from EduSync (JSON format)
- 🔍 **Search by LRN**: Quickly search for a student in LIS
- ✨ **Auto-Fill**: Automatically fill LIS forms with student data
- 📋 **Batch Mode**: Process multiple students sequentially
- 🎯 **Field Highlighting**: Visual feedback for filled fields

### Tab 2: Extract from LIS (LIS → EduSync) ⭐ NEW
- 📥 **Extract Students**: Scrape student data from LIS pages (SF1 lists, enrollment tables)
- 💾 **Download JSON**: Export extracted data as JSON file
- 📋 **Copy to Clipboard**: Quick copy for pasting into EduSync
- 🔄 **Import to EduSync**: Use with EduSync's "Import SF1" feature

## Installation

### Developer Mode (Testing)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extensions/edusync-lis-helper` folder
5. The extension icon should appear in your toolbar

### From Chrome Web Store (Future)

*Coming soon*

## Usage

### Workflow 1: EduSync → LIS (Auto-Fill)

#### Step 1: Export from EduSync
1. In EduSync, go to **Students** or **Reports**
2. Click **Export for LIS** (or similar)
3. Save the JSON file to your computer

#### Step 2: Import into Extension
1. Click the EduSync LIS Helper icon in Chrome
2. Make sure you're on the **✨ Fill LIS** tab
3. Click **Import EduSync Export**
4. Select the JSON file you exported

#### Step 3: Fill LIS Forms
1. Log into DepEd LIS as usual
2. Navigate to the enrollment/student form
3. Use the extension:
   - **Auto-Fill**: Fill current student's data
   - **Search LRN**: Search for student by LRN
   - **Batch Mode**: Enable for multiple students

### Workflow 2: LIS → EduSync (Extract)

#### Step 1: Navigate to Student List in LIS
1. Log into DepEd LIS
2. Navigate to a page with student data (SF1 list, enrollment table, etc.)

#### Step 2: Extract Data
1. Click the EduSync LIS Helper icon
2. Switch to the **📥 Extract from LIS** tab
3. Click **Extract Students from Page**
4. Review the extracted students preview

#### Step 3: Import to EduSync
1. Click **Download JSON** to save the file
2. In EduSync, go to **Students** → **Import SF1**
3. Upload the extracted JSON file
4. Review and import the students

## Export Format

The extension expects a JSON file with this structure:

```json
{
  "school": {
    "name": "School Name",
    "schoolId": "123456"
  },
  "students": [
    {
      "lrn": "123456789012",
      "name": "DELA CRUZ, JUAN SANTOS",
      "lastName": "DELA CRUZ",
      "firstName": "JUAN",
      "middleName": "SANTOS",
      "gender": "Male",
      "birthdate": "2010-05-15",
      "gradeLevel": 7,
      "section": "Einstein",
      "address": "123 Main St, Brgy. Sample",
      "barangay": "Sample",
      "municipality": "Sample City",
      "province": "Sample Province",
      "region": "Region XI",
      "motherName": "MARIA SANTOS DELA CRUZ",
      "fatherName": "PEDRO REYES DELA CRUZ",
      "guardianName": "",
      "contactNumber": "09171234567"
    }
  ],
  "exportedAt": "2026-01-09T10:30:00Z"
}
```

## Customizing Field Mappings

The extension needs to know which LIS form fields to fill. If the default mappings don't work:

1. Open `content/content.js`
2. Find the `FIELD_MAPPINGS` object
3. Update the `selectors` array for each field based on actual LIS page inspection

### How to Find Field Selectors

1. Open DepEd LIS in Chrome
2. Right-click on a form field
3. Click **Inspect**
4. Note the field's `id`, `name`, or unique `class`
5. Add it to the selectors array

## Troubleshooting

### "No fields could be filled"

- Make sure you're on the correct LIS page (enrollment form)
- Check if field selectors need updating (LIS may have changed)
- Open Developer Tools (F12) to see console logs

### Extension not appearing on LIS

- Check that the extension has permissions for `*.deped.gov.ph`
- Refresh the LIS page after installing the extension

### Data not loading

- Ensure the JSON file is valid
- Check the export format matches expected structure

## Development

### Project Structure

```
edusync-lis-helper/
├── manifest.json          # Extension manifest
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── content/
│   ├── content.js         # Content script (runs on LIS)
│   └── content.css        # Content script styles
├── background/
│   └── background.js      # Service worker
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on DepEd LIS

## Security & Privacy

- **No data uploaded**: All data stays local on your device
- **No credentials stored**: You log into LIS yourself
- **Open source**: Code is fully auditable

## License

MIT License - Part of EduSync SIS

## Support

For issues or feature requests, contact the EduSync team.
