#!/usr/bin/env node
/**
 * Fix filenames with multiple dots that cause Firebase CLI deployment errors
 * Renames files and updates all references
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// Find and rename problematic files
function findAndRenameFiles(dir) {
  const renames = [];
  
  function scan(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else {
        // Check if filename has multiple dots (e.g., file.prod.es5-hash.js)
        const dotCount = (item.match(/\./g) || []).length;
        if (dotCount > 2) {
          // Replace problematic patterns
          const newName = item
            .replace(/\.prod\.es5-/, '-prod-es5-')
            .replace(/\.png-/, '-png-');
          
          if (newName !== item) {
            const newPath = path.join(directory, newName);
            fs.renameSync(fullPath, newPath);
            renames.push({ old: item, new: newName });
            console.log(`✅ Renamed: ${item} -> ${newName}`);
          }
        }
      }
    }
  }
  
  scan(dir);
  return renames;
}

// Update references in all text files
function updateReferences(dir, renames) {
  const textExtensions = ['.html', '.js', '.json', '.webmanifest'];
  
  function updateFile(filePath) {
    const ext = path.extname(filePath);
    if (!textExtensions.includes(ext)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const { old, new: newName } of renames) {
      const regex = new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newName);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated references in: ${path.relative(distDir, filePath)}`);
    }
  }
  
  function scan(directory) {
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else {
        updateFile(fullPath);
      }
    }
  }
  
  scan(dir);
}

// Main execution
console.log('🔧 Fixing problematic filenames in dist/...');
const renames = findAndRenameFiles(distDir);

if (renames.length > 0) {
  console.log(`\n🔄 Updating references to ${renames.length} renamed files...`);
  updateReferences(distDir, renames);
  console.log('\n✅ All filenames fixed and references updated!');
} else {
  console.log('✅ No problematic filenames found!');
}
