import fs from 'fs';
let code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

const extractTab = (tabName, componentName) => {
    const startStr = `tab === "${tabName}"`;
    const startIdx = lines.findIndex(l => l.includes(startStr));
    if(startIdx === -1) return null;
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
    const extracted = lines.slice(startIdx, endIdx + 1).join('\n');
    return {startIdx, endIdx, extracted};
}

const tabs = [
    {name: "books", component: "BooksTab", props: "t, theme, books, bookSearch, setBookSearch, bookFilters, setBookFilters, setBookModalOpen, setBookFormData, handleDeleteBook, user"},
    {name: "students", component: "StudentsTab", props: "t, theme, students, studentSearch, setStudentSearch, studentFilters, setStudentFilters, setStudentModalOpen, setStudentFormData, setSelectedStudent, handleDeleteStudent, handlePrintIdCard"},
    {name: "issues", component: "IssuesTab", props: "t, theme, issues, books, students, issueFilters, setIssueFilters, scanType, setScanType, scannerActive, setScannerActive, videoRef, issueStudentId, setIssueStudentId, issueBookId, setIssueBookId, isScanned, handleIssueBook, handleReturnBook"},
    {name: "fines", component: "FinesTab", props: "t, theme, issues, students, books, fineFilters, setFineFilters, settings, calcFine, fmt"},
    {name: "notifications", component: "NotificationsTab", props: "t, theme, testNotifyReason, setTestNotifyReason, settings"},
    {name: "librarians", component: "LibrariansTab", props: "t, theme, librarians, user, handleAddLibrarian, handleDeleteLibrarian, newLibrarian, setNewLibrarian"},
    {name: "reports", component: "ReportsTab", props: "t, theme, stats"},
    {name: "activity", component: "ActivityTab", props: "t, theme, log, activityFilters, setActivityFilters, stats"},
    {name: "settings", component: "SettingsTab", props: "t, theme, activeSettingsTab, setActiveSettingsTab, settings, setSettings, toggleTheme, exportData, handleDataImport"}
];

let appCode = code;

tabs.forEach(tabInfo => {
    const data = extractTab(tabInfo.name, tabInfo.component);
    if(data) {
        fs.writeFileSync(`src/components/tabs/${tabInfo.component}.jsx`, 
`import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin, Users, RotateCcw, Activity, Shield, Settings, AlertCircle, Bell, RefreshCw, X, LogOut, TrendingUp, UserCheck, BarChart2, IndianRupee, Clock, Send } from "lucide-react";
import { Badge, StatCard, Pg } from "../ui";
import { Inp, Sel, Field, Lbl } from "../ui/Forms";
import { fmt, calcFine } from "../../utils/helpers";

export default function ${tabInfo.component}({ ${tabInfo.props} }) {
  const tab = "${tabInfo.name}";
  return (
    <>
${data.extracted}
    </>
  );
}
`);
        console.log(`${tabInfo.component} created`);
        
        // Update App.jsx to use the component
        const linesToReplace = data.endIdx - data.startIdx + 1;
        const replacementStr = `          {tab === "${tabInfo.name}" && (\n            <${tabInfo.component}\n              ` + tabInfo.props.split(', ').map(p => `${p}={${p}}`).join('\n              ') + `\n            />\n          )}`;
        
        appCode = appCode.replace(data.extracted, replacementStr);
    } else {
        console.log(`Could not find ${tabInfo.name}`);
    }
});

// Add imports to App.jsx
const imports = tabs.map(t => `import ${t.component} from "./components/tabs/${t.component}";`).join('\n');
appCode = appCode.replace('import DashboardTab from "./components/tabs/DashboardTab";', `import DashboardTab from "./components/tabs/DashboardTab";\n${imports}`);

fs.writeFileSync('src/App.jsx', appCode, 'utf8');
console.log('App.jsx updated');
