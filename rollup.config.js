import typescript from 'rollup-plugin-typescript2'

const onwarn = (warning) => {
    if (warning.code === 'UNRESOLVED_IMPORT') return
}

const plugins = [typescript()]

export default [
    {
        input: 'src/app.ts',
        output: {
            file: 'dist/app.js',
            format: 'esm',
        },
        onwarn,
        plugins,
    },
    {
        input: 'src/dailyreport.ts',
        output: {
            file: 'dist/dailyreport.js',
            format: 'esm',
        },
        onwarn,
        plugins,
    },
]
