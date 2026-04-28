const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('tab === "books"'));
let endIdx = -1;
let brackets = 0;

for(let i = startIdx; i < lines.length; i++) {
    brackets += (lines[i].match(/{/g) || []).length;
    brackets -= (lines[i].match(/}/g) || []).length;
    if(brackets === 0) {
        endIdx = i;
        break;
    }
}

console.log(lines.slice(startIdx, endIdx + 1).join('\n'));
