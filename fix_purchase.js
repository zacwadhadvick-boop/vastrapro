const fs = require('fs');
const path = './src/modules/Purchase.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the activeTab ternary transitions
content = content.replace(
  /}\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\) : \(/,
  '}</div></div></div>) : ('
);
// Actually, let\'s be even more direct using line numbers
let lines = content.split('\n');
// Line 263 (1-indexed) was the extra div
if (lines[262].trim() === '</div>' && lines[263].trim() === ') : (') {
  console.log('Removing extra div at line 263');
  lines.splice(262, 1);
}

// Line 467 (after splice it might be 466)
// We need to find the bill end and close it.
// Let\'s just search for the pattern.
const billEndPattern = /}\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<div className="max-w-7xl mx-auto space-y-6">/; 
// No, that\'s the start.

// Let\'s just find the exact lines 465-467
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes(')}') && lines[i+1]?.includes('</div>') && lines[i+2]?.trim() === ')}' && lines[i+3]?.includes('AnimatePresence')) {
     console.log('Fixing bill branch end at line', i+1);
     lines[i+2] = '          </div>';
     lines.splice(i+3, 0, '        )}');
     break;
  }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('Fixed Purchase.tsx');
