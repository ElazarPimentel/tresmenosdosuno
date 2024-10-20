#!/bin/bash
# file: getall.sh

temp_file=$(mktemp)

# Add timestamp as the first line
echo "### Timestamp: $(date) ###" >> $temp_file

# List directory tree excluding "node_modules", "dist", ".git", and ".vite"
tree -I "node_modules|dist|.git|.vite" >> $temp_file

# Append content of relevant files, excluding node_modules, dist, .git, and .vite
find . \( -path ./node_modules -o -path ./dist -o -path ./.git -o -path ./.vite \) -prune -false -o -type f \
    \( -iname "*.html" -o -iname "*.js" -o -iname "*.jsx" -o -iname "*.ts" -o -iname "*.scss" \
    -o -iname "package.json" -o -iname "vite.config.js" -o -iname "README.md" \
    -o -iname "*.eslintrc" -o -iname "*.eslintignore" -o -iname "babel.config.js" \
    -o -iname "webpack.config.js" -o -iname "tsconfig.json" -o -iname ".eslintcache" \
    -o -iname "eslint.config.js" \) \
    ! -iname "package-lock.json" | while read -r file
do
    echo "### File: $file ###" >> $temp_file
    cat "$file" >> $temp_file
done

gedit "$temp_file" && rm "$temp_file"

