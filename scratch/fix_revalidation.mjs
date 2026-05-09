import fs from 'fs';
import path from 'path';

const apiDir = 'src/app/api';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk(apiDir, (filePath) => {
    if (!filePath.endsWith('route.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Fix revalidateTag calls
    if (content.includes("revalidateTag('")) {
        content = content.replace(/revalidateTag\('([^']+)',\s*'default'\)/g, "revalidateTag('$1')");
        content = content.replace(/revalidateTag\("([^"]+)",\s*"default"\)/g, "revalidateTag('$1')");
        changed = true;
    }
    
    // Add revalidatePath('/') after revalidateTag if not present
    if (content.includes("revalidateTag(")) {
        if (!content.includes("revalidatePath('/')") && !content.includes('revalidatePath("/")')) {
            content = content.replace(/(revalidateTag\(['"][^'"]+['"]\);)/g, "$1\n    revalidatePath('/');");
            changed = true;
        }
    }
    
    // Ensure revalidatePath is imported if used
    if (content.includes("revalidatePath(") && !content.includes("revalidatePath } from 'next/cache'")) {
        if (content.includes("revalidateTag } from 'next/cache'")) {
            content = content.replace("revalidateTag } from 'next/cache'", "revalidateTag, revalidatePath } from 'next/cache'");
        } else if (content.includes("revalidateTag, revalidatePath } from 'next/cache'")) {
            // Already good
        } else {
             content = "import { revalidatePath } from 'next/cache';\n" + content;
        }
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
});
