const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('tab === "dashboard"'));
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

const replacement = '          {tab === "dashboard" && (\n            <DashboardTab\n              t={t}\n              theme={theme}\n              stats={stats}\n              log={log}\n              dashboardFocus={dashboardFocus}\n              weeklyIssued={weeklyIssued}\n              setTab={setTab}\n              setStudentModalOpen={setStudentModalOpen}\n              setBookModalOpen={setBookModalOpen}\n            />\n          )}';

lines.splice(startIdx, endIdx - startIdx + 1, replacement);
fs.writeFileSync('src/App.jsx', lines.join('\n'), 'utf8');
