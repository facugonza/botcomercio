import typescript from 'rollup-plugin-typescript2';

export default [
    {
        input: 'src/app.ts',
        output: {
            file: 'dist/app.js',
            format: 'esm', // Formato ECMAScript Module para app.js
        },
        plugins: [typescript()],
    },
    {
        input: 'src/dailyreport.ts',
        output: {
            file: 'dist/dailyreport.cjs',
            format: 'cjs', // Formato CommonJS para dailyreport.cjs
        },
        plugins: [typescript()],
    }
];

