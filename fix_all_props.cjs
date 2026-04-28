const fs = require('fs');

// Fix IssuesTab
let appCode = fs.readFileSync('src/App.jsx', 'utf8');
appCode = appCode.replace('issueFilters={issueFilters}', 'issueHistoryFilters={issueHistoryFilters}');
appCode = appCode.replace('setIssueFilters={setIssueFilters}', 'setIssueHistoryFilters={setIssueHistoryFilters}');
let issuesCode = fs.readFileSync('src/components/tabs/IssuesTab.jsx', 'utf8');
issuesCode = issuesCode.replace('issueFilters, setIssueFilters', 'issueHistoryFilters, setIssueHistoryFilters');
fs.writeFileSync('src/components/tabs/IssuesTab.jsx', issuesCode);

// Fix LibrariansTab
appCode = appCode.replace('              librarians={librarians}', '              librarians={librarians}\n              librarianFilters={librarianFilters}\n              setLibrarianFilters={setLibrarianFilters}');
let libCode = fs.readFileSync('src/components/tabs/LibrariansTab.jsx', 'utf8');
libCode = libCode.replace('librarians, user,', 'librarians, user, librarianFilters, setLibrarianFilters,');
fs.writeFileSync('src/components/tabs/LibrariansTab.jsx', libCode);

// Fix ReportsTab
appCode = appCode.replace('              stats={stats}', '              stats={stats}\n              reportFilters={reportFilters}\n              setReportFilters={setReportFilters}\n              issues={issues}\n              students={students}\n              books={books}');
let repCode = fs.readFileSync('src/components/tabs/ReportsTab.jsx', 'utf8');
repCode = repCode.replace('stats }) {', 'stats, reportFilters, setReportFilters, issues, students, books }) {');
fs.writeFileSync('src/components/tabs/ReportsTab.jsx', repCode);

// Fix ActivityTab
appCode = appCode.replace('              activityFilters={activityFilters}\n', '');
appCode = appCode.replace('              setActivityFilters={setActivityFilters}\n', '');
let actCode = fs.readFileSync('src/components/tabs/ActivityTab.jsx', 'utf8');
actCode = actCode.replace(' activityFilters, setActivityFilters,', '');
fs.writeFileSync('src/components/tabs/ActivityTab.jsx', actCode);

fs.writeFileSync('src/App.jsx', appCode);
console.log('Props fixed!');
