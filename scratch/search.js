const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.next', 'dist', 'uploads', 'scratch', 'prisma'];
const regex = /(api[_-]?key|secret|password|token)\s*[:=]\s*['"]([^'"]{6,})['"]/i;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!excludeDirs.some(ex => file.includes(ex))) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.match(/\.(ts|tsx|js|json)$/)) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const lines = content.split('\n');
                    lines.forEach((line, i) => {
                        const match = line.match(regex);
                        if (match) {
                            // Filter out "process.env" or simple things
                            if (!line.includes('process.env') && !line.includes('import ') && !line.includes('require(')) {
                                results.push(`${file}:${i + 1}: ${line.trim()}`);
                            }
                        }
                    });
                } catch (e) {}
            }
        }
    });
    return results;
}

const frontendRes = walk('./frontend');
const backendRes = walk('./backend');

console.log("=== FRONTEND ===");
frontendRes.forEach(r => console.log(r));
console.log("\n=== BACKEND ===");
backendRes.forEach(r => console.log(r));
