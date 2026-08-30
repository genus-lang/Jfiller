const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/extension/src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace MessageType.SOMETHING with 'SOMETHING'
  content = content.replace(/MessageType\.([A_Z_]+)/g, "'$1'");
  
  // Remove import { MessageType } from ...
  content = content.replace(/,\s*MessageType\s*/g, '');
  content = content.replace(/MessageType\s*,\s*/g, '');
  content = content.replace(/import\s*{\s*MessageType\s*}\s*from\s*[^;]+;/g, '');
  
  fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  });
}

walkDir(directoryPath);
console.log('Refactoring complete.');
