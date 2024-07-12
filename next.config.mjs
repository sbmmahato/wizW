/** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

module.exports = {
    externals: {
        'node:crypto': 'commonjs crypto'
    }
 }
