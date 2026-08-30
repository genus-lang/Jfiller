const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/extension/src');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the mangled replacements
  content = content.replace(/'A'SK_CHATGPT/g, "'ASK_CHATGPT'");
  content = content.replace(/'C'HATGPT_ANSWER_READY/g, "'CHATGPT_ANSWER_READY'");
  content = content.replace(/'P'ASTE_PROMPT_IN_CHATGPT/g, "'PASTE_PROMPT_IN_CHATGPT'");
  content = content.replace(/'S'CAN_FORM/g, "'SCAN_FORM'");
  content = content.replace(/'A'UTOFILL_FORM/g, "'AUTOFILL_FORM'");
  content = content.replace(/'G'ET_PROFILE/g, "'GET_PROFILE'");
  content = content.replace(/'S'AVE_PROFILE/g, "'SAVE_PROFILE'");
  
  // Fix any remaining MessageType. usages correctly just in case
  content = content.replace(/MessageType\.([A-Z_]+)/g, "'$1'");
  
  fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fixFile(fullPath);
    }
  });
}

walkDir(directoryPath);
console.log('Fix complete.');
