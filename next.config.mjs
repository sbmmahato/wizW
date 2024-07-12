/** @type {import('next').NextConfig} */
const nextConfig = {
    externals: {
        'node:crypto': 'commonjs crypto'
    }//
};

export default nextConfig;
