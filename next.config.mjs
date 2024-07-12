/** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

module.exports = {
    externals: {
        'node:crypto': 'es6 crypto'
    }
 }
