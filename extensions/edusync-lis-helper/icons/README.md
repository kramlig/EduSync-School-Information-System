# Extension Icons

These icons need to be created as PNG files. For now, you can use placeholder icons.

## Required Sizes
- icon16.png (16x16)
- icon32.png (32x32)  
- icon48.png (48x48)
- icon128.png (128x128)

## Quick Solution

You can create simple icons using any image editor or online tool:

1. Go to https://favicon.io/ or similar
2. Create an icon with "ES" text or the EduSync logo
3. Download in multiple sizes
4. Place the PNG files in this folder

## For Development

You can temporarily comment out the icon references in manifest.json to test without icons:

```json
// "default_icon": { ... }
```

The extension will still work with a default icon.
