import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';
import { existsSync } from 'fs';
import path from 'path';

const transpileTypescript = () => ({
    name: 'transpile-typescript',
    resolveId(source, importer) {
        if (source.startsWith('~/')) {
            const resolved = path.resolve('src', source.slice(2));
            const tsFile = `${resolved}.ts`;

            return existsSync(tsFile) ? tsFile : null;
        }

        if (!importer || !source.startsWith('.')) {
            return null;
        }

        const resolved = path.resolve(path.dirname(importer), source);
        const tsFile = `${resolved}.ts`;

        return existsSync(tsFile) ? tsFile : null;
    },
    transform(code, id) {
        if (!id.endsWith('.ts')) {
            return null;
        }

        const output = ts.transpileModule(code, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.ES2022,
                esModuleInterop: true,
                sourceMap: false,
            },
            fileName: id,
        });

        return {
            code: output.outputText,
            map: null,
        };
    },
});

const external = (id) => !id.startsWith('.') && !id.startsWith('~/') && !path.isAbsolute(id);

export default [
    {
        input: 'src/app.ts',
        external,
        output: {
            file: 'dist/app.js',
            format: 'esm', // Formato ECMAScript Module para app.js
        },
        plugins: [transpileTypescript(), typescript()],
    },
    {
        input: 'src/dailyreport.ts',
        external,
        output: {
            file: 'dist/dailyreport.cjs',
            format: 'cjs', // Formato CommonJS para dailyreport.cjs
        },
        plugins: [transpileTypescript(), typescript()],
    },
    {
        input: 'src/monthreport.ts',
        external,
        output: {
            file: 'dist/monthreport.cjs',
            format: 'cjs', // Formato CommonJS para dailyreport.cjs
        },
        plugins: [transpileTypescript(), typescript()],
    }
];
