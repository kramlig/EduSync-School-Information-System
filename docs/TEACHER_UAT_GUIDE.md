# 👩‍🏫 Teacher Feature Testing Guide

## 📋 Welcome!

Thank you for helping us test the new teacher features! This guide will walk you through checking that the system shows you **only your students, sections, and subjects** - making your work easier and more focused.

**What we're testing:** Making sure you see only the students and classes you teach, not everyone in the school.

**Time needed:** About 30-40 minutes

**What you need:** 
- A computer with internet
- Chrome, Edge, or Firefox browser
- A cup of coffee ☕ (optional but recommended!)

---

## 🔑 Getting Started

**Website to visit:** https://edusync-sis.web.app

**Test login details:**
- **Email:** pedro.reyes@edusync.edu
- **Password:** teacher123
- **This test account teaches:** Grade 4 (Math, English, ESP)

💡 **Note:** This is a practice account just for testing. You'll use your own account once testing is complete.

---

## ✅ What to Check

### ☑️ Check 1: Can you log in successfully?

**What to do:**
1. Open your web browser (Chrome, Edge, or Firefox)
2. Go to: https://edusync-sis.web.app
3. Type the email: `pedro.reyes@edusync.edu`
4. Type the password: `teacher123`
5. Click the "Sign In" button

**What you should see:**
- ✅ The page loads quickly (about 2-3 seconds)
- ✅ You see "Pedro Reyes" at the top of the page
- ✅ You see a main dashboard with your classes
- ✅ You DON'T see options like "Manage All Users" or "System Settings"

**Did it work?** [ ] Yes, worked perfectly!  [ ] No, something's wrong

**If something's wrong, tell us:**
```
What happened? ________________________________
_____________________________________________
```

---

### ☑️ Check 2: Do you see only YOUR students?

**What to do:**
1. Click on "Grades & Report" in the menu on the left side
2. Make sure you're on the "Overview & Analytics" tab (first tab)
3. Look for a box that says "Total Students" - it shows a big number
4. Look for a selection box at the top that shows different classes

**What you should see:**
- ✅ The selection box says "All My Sections" 
- ✅ When you click it, you ONLY see "Grade 4 - Section A", "Grade 4 - Section B", etc.
- ✅ You DON'T see Grade 1, Grade 2, Grade 3, or any other grades
- ✅ Total Students shows about **18-20 students** (the Grade 4 students)
- ✅ You should NOT see 100 students (that would mean it's showing everyone in school!)

**💡 Why this matters:** You should only see YOUR students, not everyone in the whole school!

**Did it work?** [ ] Yes, I see only my Grade 4 students  [ ] No, I see too many students

**How many students do you see?** `__________`

**What classes/sections do you see in the list?**
```
_____________________________________________
_____________________________________________
```

---

### ☑️ Check 3: Can you switch between your different classes?

**What to do:**
1. Stay on the "Grades & Report" page
2. Look at the student count with "All My Sections" showing
3. Click on the class selection box (where it says "All My Sections")
4. Choose one specific class like "Grade 4 - Section A"
5. Watch what happens to the student count
6. Switch back to "All My Sections"

**What you should see:**
- ✅ When you pick one specific class, the number of students gets smaller (maybe 5-10 students)
- ✅ When you switch back to "All My Sections", all your Grade 4 students show again
- ✅ The numbers make sense (one class = fewer students, all classes = more students)

**💡 Why this matters:** You need to easily switch between viewing all your students or just one class at a time!

**Did it work?** [ ] Yes, switching works perfectly  [ ] No, the numbers don't change

**Write down the numbers you see:**
```
All My Sections: __________ students
First class (Section A): __________ students  
Second class (Section B): __________ students
```

---

### ☑️ Check 4: Can you generate report cards for your students?

**What to do:**
1. Look for a tab that says "Report Cards" and click it
2. Check the class selection box again
3. Look at the list of students shown

**What you should see:**
- ✅ The class selection box still says "All My Sections" at the top
- ✅ You still only see your Grade 4 classes in the list
- ✅ The student names are all from Grade 4 (your students!)
- ✅ You can click checkboxes next to student names to select them

**💡 Why this matters:** When printing report cards, you should only print for YOUR students, not accidentally print for someone else's class!

**Did it work?** [ ] Yes, only my students are here  [ ] No, I see other students too

---

### ☑️ Check 5: Do you see only YOUR subjects?

**What to do:**
1. Go back to the "Overview & Analytics" tab
2. Look at any charts or lists showing subjects
3. Check what subjects are mentioned

**What you should see:**
- ✅ You see **Math, English, and ESP** (the subjects Grade 4 Pedro teaches)
- ✅ You DON'T see subjects like Science, Filipino, MAPEH, TLE, or subjects you don't teach
- ✅ Any graphs or numbers are only about your 3 subjects

**💡 Why this matters:** You shouldn't see data for subjects you don't teach - that would be confusing!

**Did it work?** [ ] Yes, only my 3 subjects  [ ] No, I see other subjects

**What subjects do you see listed?**
```
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________
```

---

### ☑️ Check 6: Can you search for a specific student?

**What to do:**
1. Look for a search box (usually says "Search by student name...")
2. Type in a common name like "Maria" or "Juan"
3. Look at what students pop up

**What you should see:**
- ✅ Only Grade 4 students appear in the search results
- ✅ You don't see students from other grades
- ✅ The search works and finds students quickly

**💡 Why this matters:** When you're looking for one student, you shouldn't have to dig through hundreds of names from other classes!

**Did it work?** [ ] Yes, found my students easily  [ ] No, search is confusing

---

### ☑️ Check 7: Can you filter by student performance?

**What to do:**
1. Look for a box that lets you filter students (might say "Performance" or "Filter")
2. Try selecting "Honor Roll (≥90%)"
3. Watch the student count change
4. Then try "Needs Improvement (<75%)"

**What you should see:**
- ✅ When you pick "Honor Roll", you see fewer students (only the high achievers)
- ✅ When you pick "Needs Improvement", you see the students who need help
- ✅ All the students shown are still only from YOUR Grade 4 classes

**💡 Why this matters:** This helps you quickly identify which students need extra attention!

**Did it work?** [ ] Yes, filtering works great  [ ] No, numbers seem wrong

---

### ☑️ Check 8: Can you view different quarters?

**What to do:**
1. Find a selection box that says quarters: Q1, Q2, Q3, Q4
2. Click it and choose "Quarter 1"
3. Watch to see if the information updates

**What you should see:**
- ✅ The grades and information change to show Quarter 1
- ✅ You're still only seeing your Grade 4 students
- ✅ Switching quarters is easy and makes sense

**Did it work?** [ ] Yes, quarters switch smoothly  [ ] No, nothing changes

---

### ☑️ Check 9: Try refreshing the page

**What to do:**
1. Look at your current student count
2. Press the refresh button in your browser (or press F5 on your keyboard)
3. Wait for the page to reload
4. Check if everything stayed the same

**What you should see:**
- ✅ After refreshing, you still see "All My Sections"
- ✅ The same number of students shows up
- ✅ Nothing changed or broke

**💡 Why this matters:** If you accidentally refresh the page, you shouldn't lose your place!

**Did it work?** [ ] Yes, everything stayed the same  [ ] No, something changed

---

### ☑️ Check 10: Does everything feel smooth and quick?

**What to do:**
1. Click around the system - switch tabs, change classes, etc.
2. Pay attention to how fast things load
3. Notice if anything feels slow or stuck

**What you should see:**
- ✅ Pages load quickly (not more than a few seconds)
- ✅ When you click something, it responds right away
- ✅ No spinning circles that never stop
- ✅ Everything feels smooth and easy to use

**💡 Why this matters:** The system should be fast enough that it doesn't slow down your work!

**Did it work?** [ ] Yes, nice and fast!  [ ] No, it's slow or freezing

**If it's slow, where?**
```
_____________________________________________
```

---

### ☑️ Check 11: Try it in a different browser (Optional)

**What to do:**
1. If you have time, try opening the site in a different browser
2. Log in again with the same test account
3. Check if everything works the same way

**Browsers to try:**
- [ ] Google Chrome - Works fine? [ ] Yes [ ] No
- [ ] Microsoft Edge - Works fine? [ ] Yes [ ] No  
- [ ] Firefox - Works fine? [ ] Yes [ ] No

**💡 Why this matters:** Teachers use different browsers, so we need to make sure it works for everyone!

---

## � If Something Doesn't Work Right

If you notice something wrong or confusing, please write it down here:

### Problem #1
**What were you trying to do?**
```
_____________________________________________
_____________________________________________
```

**What went wrong?**
```
_____________________________________________
_____________________________________________
```

**How bad is it?**
[ ] Really bad - can't use the system at all!
[ ] Pretty bad - hard to do my work
[ ] Minor - just a small annoyance
[ ] Just confusing - maybe I need help understanding

---

### Problem #2
**What were you trying to do?**
```
_____________________________________________
```

**What went wrong?**
```
_____________________________________________
```

---

## 🎯 Final Checklist

Before we finish, let's make sure these KEY things work:

**The most important things:**
- [ ] ✅ I see ONLY my Grade 4 students (around 18-20 students, not 100!)
- [ ] ✅ The class selection shows "All My Sections" and only my classes
- [ ] ✅ I can't accidentally see students from other grade levels
- [ ] ✅ Report Cards also shows only my students
- [ ] ✅ I only see data for subjects I teach (Math, English, ESP)
- [ ] ✅ The system feels easy and quick to use

**Overall, how did it go?**
[ ] 😊 Everything works great! Ready to use!
[ ] 😐 Works mostly, but found a few small issues
[ ] 😟 Found some problems that need fixing

---

## 📋 Your Information

**Your Name:** `_______________________________________`

**Date you tested this:** `_______________________________________`

**Which browser did you use?** `_______________________________________`

**Any other comments or suggestions?**
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## � Need Help?

**If you get stuck or have questions while testing:**

📧 **Email:** [Your Support Email]  
📱 **Phone:** [Your Support Number]  
💬 **Chat:** [Your Support Chat/Messenger]

**Or just ask any of the IT staff - we're here to help!**

---

## 🙏 Thank You!

**Thank you so much for taking the time to test this!** 

Your feedback helps us make sure the system works perfectly for teachers like you. We really appreciate your help in making EduSync better!

**What happens next:**
1. We'll review your feedback
2. Fix any problems you found
3. Let you know when everything is ready
4. You'll get your own teacher account to use

**Questions?** Don't hesitate to reach out - we're always happy to help!

---

**Project:** EduSync School Information System  
**Feature:** Teacher Assignment Filtering  
**Version:** v1.0.0  
**Testing Date:** October 24, 2025
