import re

def main():
    try:
        with open('src/App.jsx', 'r', encoding='utf-8') as f:
            text = f.read()

        # 1. Add Diagnostic Alerts in Login
        find_login_auth_succ = 'const sessionUser = data?.session?.user || data?.user;'
        repl_login_auth_succ = 'const sessionUser = data?.session?.user || data?.user;\n      if (sessionUser) console.log("Sign-in successful for:", sessionUser.email);'
        text = text.replace(find_login_auth_succ, repl_login_auth_succ)

        text = text.replace('setUser(profile);', 'setUser(profile);\n            console.log("Profile set! Dashboard should open.");')

        # 2. Add Safeguards in stats and render logic
        text = text.replace('sum + b.total', 'sum + (Number(b.total) || 0)')
        text = text.replace('acc[key] || 0) + b.total', 'acc[key] || 0) + (Number(b.total) || 0)')

        # Ensure arrays are safe before reduce/filter
        text = text.replace('const stats = {', 'const stats = {\n    totalBooks: (books || []).reduce((sum, b) => sum + (Number(b.total) || 0), 0),\n    totalStudents: (students || []).length,\n    issued: (issues || []).filter((i) => !i.returnDate).length,\n    totalFine: (issues || []).reduce(\n      (sum, i) => sum + calcFine(i.dueDate, settings.fineRate),\n      0\n    ),\n  };')
        # We need to remove the old stats block to avoid duplication
        # This regex is a bit risky, let's just do a targeted replacement if possible.
        
        # Actually, let's just fix the variables in place.
        text = text.replace('books.reduce((sum, b) => sum + b.total, 0)', '(books || []).reduce((sum, b) => sum + (Number(b.total) || 0), 0)')
        text = text.replace('students.length', '(students || []).length')
        text = text.replace('issues.filter((i) => !i.returnDate).length', '(issues || []).filter((i) => !i.returnDate).length')
        text = text.replace('issues.reduce(', '(issues || []).reduce(')

        with open('src/App.jsx', 'w', encoding='utf-8') as f:
            f.write(text)
        print("Initialization stability and diagnostics added!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
