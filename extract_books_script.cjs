const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
const lines = code.split('\n');

const extractTab = (tabName, componentName) => {
    const startStr = 	ab === "";
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

const booksData = extractTab("books", "BooksTab");
fs.writeFileSync('src/components/tabs/BooksTab.jsx', 
import React from "react";
import { BookOpen, Search, Edit2, Trash2, Printer, MapPin } from "lucide-react";
import { Badge, StatCard } from "../ui";
import { Inp, Sel, Field } from "../ui/Forms";
import { fmt } from "../../utils/helpers";

export default function BooksTab({
  t, theme, books, bookSearch, setBookSearch, bookFilters, setBookFilters,
  setBookModalOpen, setBookFormData, handleDeleteBook
}) {
  const tab = "books";
  return (
    <>

    </>
  );
}
);
console.log('BooksTab created');
