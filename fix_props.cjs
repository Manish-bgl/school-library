const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace('              setBookFormData={setBookFormData}\n', '');
code = code.replace('              setStudentFormData={setStudentFormData}\n', '');
fs.writeFileSync('src/App.jsx', code, 'utf8');

let booksTab = fs.readFileSync('src/components/tabs/BooksTab.jsx', 'utf8');
booksTab = booksTab.replace(' setBookFormData, ', ' ');
fs.writeFileSync('src/components/tabs/BooksTab.jsx', booksTab, 'utf8');

let studentsTab = fs.readFileSync('src/components/tabs/StudentsTab.jsx', 'utf8');
studentsTab = studentsTab.replace(' setStudentFormData, ', ' ');
fs.writeFileSync('src/components/tabs/StudentsTab.jsx', studentsTab, 'utf8');
