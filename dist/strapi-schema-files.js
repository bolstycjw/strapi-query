import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
const IGNORED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules']);
export async function readStrapiSchemaFiles(paths) {
    const files = (await Promise.all(paths.map((path) => resolveSchemaFiles(path))))
        .flat()
        .sort((left, right) => left.localeCompare(right));
    if (files.length === 0) {
        throw new Error('No Strapi schema files were found.');
    }
    return Promise.all(files.map(async (path) => ({
        path,
        schema: JSON.parse(await readFile(path, 'utf8'))
    })));
}
async function resolveSchemaFiles(path) {
    const stats = await stat(path);
    if (stats.isFile()) {
        return [path];
    }
    if (!stats.isDirectory()) {
        return [];
    }
    return collectSchemaFiles(path);
}
async function collectSchemaFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const path = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
            if (!IGNORED_DIRECTORIES.has(entry.name)) {
                files.push(...await collectSchemaFiles(path));
            }
            continue;
        }
        if (entry.isFile() && isStrapiSchemaFile(path)) {
            files.push(path);
        }
    }
    return files;
}
function isStrapiSchemaFile(path) {
    const segments = path.split(/[\\/]+/);
    const fileName = basename(path);
    if (fileName === 'schema.json' && segments.includes('content-types')) {
        return true;
    }
    return extname(fileName) === '.json' && segments.includes('components');
}
//# sourceMappingURL=strapi-schema-files.js.map