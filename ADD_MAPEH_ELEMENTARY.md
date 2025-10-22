# Add MAPEH Elementary to Production Firebase (Browser Console Script)

## 🚀 Run this in your browser console (F12 → Console)

**Prerequisites:** 
- You must be logged in as admin
- Navigate to Learning Areas page first
- Press F12 to open DevTools → Console tab

## 📋 Copy and paste this entire script:

```javascript
// Add MAPEH Elementary to Production Firebase
(async function addMAPEHElementary() {
  console.log('📚 Adding MAPEH Elementary to Production...');
  
  const mapehElem = {
    id: 'la_mapeh_elem',
    name: 'MAPEH',
    credits: 4,
    isComposite: true,
    subSubjects: ['Music', 'Arts', 'PE', 'Health'],
    category: 'specialized',
    gradeLevel: [1, 2, 3, 4, 5, 6],
    department: 'Arts & Sports',
    kToTwelveCode: 'MAPEH-ELEM',
    isActive: true,
    order: 7,
    description: 'Music, Arts, Physical Education, Health for Elementary',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    await firebase.firestore().collection('learningAreas').doc('la_mapeh_elem').set(mapehElem);
    console.log('✅ MAPEH Elementary added successfully!');
    console.log('🔄 Refresh the page to see it in the Elementary section');
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

## 🎯 After running:
1. You should see: ✅ MAPEH Elementary added successfully!
2. Refresh the page (F5)
3. Check Elementary section - should now show 8 subjects (including MAPEH)

---

## 🔍 Verify it was added (optional):

```javascript
firebase.firestore().collection('learningAreas').doc('la_mapeh_elem').get().then(doc => {
  if (doc.exists) {
    console.log('✅ MAPEH Elementary exists:', doc.data());
  } else {
    console.log('❌ Not found');
  }
});
```
