const fs = require('fs');

const varsToInject = {
  ActivityTab: ['setActivityView', 'activityView', 'activitySearch', 'setActivitySearch', 'activityFilter', 'setActivityFilter', 'activityRange', 'setActivityRange', 'activityDateFrom', 'setActivityDateFrom', 'issues', 'students', 'books'],
  BooksTab: ['issues', 'setSelectedBook', 'setTab', 'toast'],
  FinesTab: ['setFineView', 'fineView', 'fineStatus', 'fineSearch', 'fineSort', 'setFineSearch', 'setFineSort', 'setFineStatus', 'todayStr', 'toast'],
  IssuesTab: ['stopScan', 'setScanStudent', 'setScanBook', 'scanStudent', 'scanBook', 'setIssueView', 'issueView', 'issueHistorySearch', 'setIssueHistorySearch', 'parseStudentIdFromQr', 'parseBookIdFromQr', 'settings'],
  LibrariansTab: ['setLibrarianEditId', 'setLibrarianModalOpen', 'librarianSearch', 'setLibrarianSearch', 'setCardLibrarian', 'setLibrarians'],
  NotificationsTab: ['issues', 'students', 'books', 'bulkClass', 'setBulkClass', 'classOptions', 'bulkSection', 'setBulkSection', 'sectionOptions', 'bulkFineThreshold', 'setBulkFineThreshold', 'newArrivalWindow', 'setNewArrivalWindow', 'overdueTargets', 'toast', 'bulkStudents'],
  ReportsTab: ['toast', 'settings', 'daysAgo'],
  SettingsTab: ['isDir', 'handleLogoUpload', 'backupText', 'setBackupText'],
  StudentsTab: ['setStudentImportOpen', 'issues', 'getStudentFine', 'getStudentActivity', 'settings', 'openCard', 'handleToggleStudentStatus']
};

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

for (const [comp, vars] of Object.entries(varsToInject)) {
  const filePath = 'src/components/tabs/' + comp + '.jsx';
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix props in App.jsx
  const tagStart = '<' + comp;
  let tIdx = appCode.indexOf(tagStart);
  if (tIdx !== -1) {
    let tEnd = appCode.indexOf('/>', tIdx);
    if (tEnd !== -1) {
      let existingBlock = appCode.substring(tIdx, tEnd);
      for (const v of vars) {
        if (!existingBlock.includes(v + '={') && v !== 'todayStr' && v !== 'daysAgo') {
          existingBlock += '\n              ' + v + '={' + v + '}';
        }
      }
      appCode = appCode.substring(0, tIdx) + existingBlock + appCode.substring(tEnd);
    }
  }

  // Fix props in component
  const exportStr = 'export default function ' + comp + '({ ';
  for (const v of vars) {
      if(v !== 'todayStr' && v !== 'daysAgo') {
          if (!code.includes(exportStr)) {
            code = code.replace('export default function ' + comp + '({', 'export default function ' + comp + '({ ' + v + ', ');
          } else {
            code = code.replace(exportStr, exportStr + v + ', ');
          }
      }
  }
  
  if(comp === 'FinesTab') {
      code = code.replace('import { fmt, calcFine } from "../../utils/helpers";', 'import { fmt, calcFine, todayStr } from "../../utils/helpers";');
      if(!code.includes('AlertTriangle')) {
          code = code.replace('import { Badge, StatCard, Pg }', 'import { AlertTriangle, CheckCircle, Gift } from "lucide-react";\nimport { Badge, StatCard, Pg }');
      }
  }
  
  if(comp === 'ReportsTab') {
      code = code.replace('import { fmt, calcFine } from "../../utils/helpers";', 'import { fmt, calcFine, daysAgo } from "../../utils/helpers";');
      if(!code.includes('AlertTriangle')) {
          code = code.replace('import { Badge, StatCard, Pg }', 'import { AlertTriangle, CheckCircle } from "lucide-react";\nimport { Badge, StatCard, Pg }');
      }
  }

  fs.writeFileSync(filePath, code);
}

fs.writeFileSync('src/App.jsx', appCode);
console.log('Fixed massive missing variables!');
