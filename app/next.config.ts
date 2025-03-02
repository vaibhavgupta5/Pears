import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["plus.unsplash.com"],
  },
  webpack: (config, { isServer }) => {
    // Replace sodium-native with a browser-compatible version
    config.resolve.alias['sodium-native'] = 'sodium-universal-browser';
    config.resolve.alias['sodium-universal'] = 'sodium-universal-browser';
    
    return config;
  },

};

export default nextConfig;