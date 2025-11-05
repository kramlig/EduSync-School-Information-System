# 🔌 Offline Protection Quick Reference

## For Developers

### Adding Offline Protection to New Components

**Step 1: Import the hook**
```typescript
import { useOnlineStatus, getOfflineMessage } from '../src/services/connectionService';
```

**Step 2: Add the hook to component**
```typescript
const MyComponent: React.FC = () => {
  const isOnline = useOnlineStatus();
  // ... rest of component
};
```

**Step 3: Add offline warning banner**
```typescript
{!isOnline && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-yellow-700">
          <strong className="font-medium">Offline Mode</strong>
        </p>
        <p className="mt-1 text-sm text-yellow-700">
          {getOfflineMessage('PAYMENT')} {/* or 'FEE_STRUCTURE', 'VERIFICATION', etc. */}
        </p>
      </div>
    </div>
  </div>
)}
```

**Step 4: Disable buttons**
```typescript
<button
  onClick={handleSave}
  disabled={!isOnline || processing}
  className={`your-classes ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
>
  Save
</button>
```

### Adding Service Layer Protection

**In your service function**:
```typescript
import { requireOnlineConnection } from './connectionService';

export async function myFinancialFunction(...) {
  // Add this at the very start
  requireOnlineConnection('Operation name');
  
  // ... rest of function
}
```

## For Users

### What Works Offline? ✅

- ✅ View student records
- ✅ View payment history
- ✅ View fee structures
- ✅ Search and filter
- ✅ Download receipts
- ✅ View reports
- ✅ Export data (cached)

### What Needs Internet? 🔴

- 🔴 Record new payments
- 🔴 Generate receipts
- 🔴 Create fee structures
- 🔴 Edit fee structures
- 🔴 Verify payment proofs
- 🔴 Upload payment proofs

### Visual Indicators

**Yellow Banner** = Feature needs internet, explanation provided
**Blue Banner** = Info only, you're viewing cached data
**Gray Banner** = Data may not be current
**Disabled Button** = Can't use this feature offline

## Error Messages

### Payment Operations
> "Payment recording requires an internet connection to ensure receipt number sequence integrity and prevent duplicate transactions. Please check your connection and try again."

### Fee Structures
> "Fee structure changes require an internet connection to ensure all devices have consistent data. Please check your connection and try again."

### Payment Proofs
> "Payment proof verification requires an internet connection to update student records in real-time. Please check your connection and try again."

### Receipts
> "Receipt generation requires an internet connection to maintain sequential numbering and BIR compliance. Please check your connection and try again."

## Testing Offline Mode

### Chrome DevTools Method
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Online" dropdown
4. Select "Offline"
5. Test your features

### Manual Method
1. Disconnect WiFi/Ethernet
2. Test your features
3. Reconnect
4. Verify auto-re-enable

## Troubleshooting

### "Button stays disabled even when online"
- Refresh the page
- Check browser console for errors
- Verify `useOnlineStatus()` is called

### "Error says offline but I'm online"
- Check `navigator.onLine` in console
- Some networks report false offline
- Try actual internet test (google.com)

### "No warning banner shows"
- Verify `!isOnline` conditional is correct
- Check if banner code is placed correctly
- Look for React rendering errors

## Files Reference

**Connection Service**: `src/services/connectionService.ts`
**Billing Service**: `src/services/billingService.ts`
**Components**: 
- `components/PaymentRecording.tsx`
- `components/FeeStructureManager.tsx`
- `components/ParentBilling.tsx`
- `components/FinancialReports.tsx`

## Quick Commands

```bash
# Search for offline protection usage
grep -r "useOnlineStatus" components/

# Find all requireOnlineConnection calls
grep -r "requireOnlineConnection" src/

# Find all offline warning banners
grep -r "Offline Mode" components/
```

---

**Last Updated**: November 6, 2025  
**Status**: ✅ Production Ready
