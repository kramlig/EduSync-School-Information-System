<!-- EduSync Logo Component Usage Guide -->

# 🎨 EdusyncLogo Component

Reusable React component for displaying the EduSync brand logo throughout the application.

## 📍 Location
`components/EdusyncLogo.tsx`

## 🚀 Quick Usage

```tsx
import EdusyncLogo from '../components/EdusyncLogo';

// In your component:
<EdusyncLogo size="md" showText={true} />
```

## 🎛️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Logo size preset |
| `showText` | `boolean` | `true` | Show/hide "Edusync.ph" text |
| `className` | `string` | `''` | Additional CSS classes |

## 📏 Size Reference

| Size | Dimensions | Use Case |
|------|------------|----------|
| `sm` | 32px × 32px | Header navigation |
| `md` | 48px × 48px | Cards, sections |
| `lg` | 64px × 64px | Page headers |
| `xl` | 96px × 96px | Login, splash screens |

## 💡 Examples

### Header (Small, Icon Only)
```tsx
<EdusyncLogo size="sm" showText={false} />
```

### Page Header (Large with Text)
```tsx
<EdusyncLogo size="lg" showText={true} />
```

### Login Screen (Extra Large)
```tsx
<EdusyncLogo size="xl" showText={true} className="mb-6" />
```

### Footer (Medium)
```tsx
<EdusyncLogo size="md" showText={true} className="brightness-200" />
```

## 🖼️ Image Requirements

Place your logo at: `public/edusync-logo.png`

**Recommended:**
- Format: PNG with transparent background
- Resolution: 400px × 400px or higher
- File size: < 200KB

## 🔄 Fallback Behavior

If `public/edusync-logo.png` is not found, the component automatically displays:
- A gradient circle (blue → indigo → purple)
- Stylized "e" letter in white
- Matches brand colors perfectly

## 🎨 Gradient Colors

The logo text uses a custom gradient:
```css
/* "Edusync" part */
background: linear-gradient(to right, #2563eb, #4f46e5, #7c3aed);

/* ".ph" part */
background: linear-gradient(to right, #7c3aed, #ec4899);
```

## 📱 Responsive Design

The component is fully responsive:
- Scales properly on all devices
- Maintains aspect ratio
- Works in light and dark modes

## ✨ Features

- ✅ Auto-fallback if image is missing
- ✅ Responsive sizing
- ✅ Gradient text with brand colors
- ✅ TypeScript support
- ✅ Customizable via props
- ✅ Dark mode compatible

## 🔧 Customization

To change logo appearance, edit: `components/EdusyncLogo.tsx`

### Change Gradient Colors
```tsx
// Line ~55-60
<span className="bg-gradient-to-r from-YOUR-COLOR-1 via-YOUR-COLOR-2 to-YOUR-COLOR-3">
```

### Adjust Size Presets
```tsx
// Line ~28-33
const sizeClasses = {
  sm: 'w-8 h-8',    // Modify these
  md: 'w-12 h-12',
  // ...
};
```

## 📍 Already Integrated In

- ✅ Login Screen
- ✅ Header Component
- ✅ Landing Page
- ✅ Enrollment Portal
- ✅ Application Form
- ✅ Application Status

## 🐛 Troubleshooting

**Logo not showing?**
1. Check if `public/edusync-logo.png` exists
2. Clear browser cache
3. Restart dev server

**Image blurry?**
- Use higher resolution image (400px+)
- Ensure PNG format with transparency

**Wrong colors?**
- Update gradient classes in component
- Check Tailwind config for color definitions

---

**Need help?** Check `LOGO_INTEGRATION_COMPLETE.md` for full documentation.
