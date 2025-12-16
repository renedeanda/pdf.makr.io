import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set headers for WASM and PDF.js workers
  async headers() {
    return [
      {
        // COEP/COOP headers for SharedArrayBuffer support (desktop browsers)
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // More compatible than 'credentialless' for iOS
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // Specific headers for worker files to ensure they load properly
        source: '/pdf.worker.:path*.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Webpack config for WASM support
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add WASM file handling
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Exclude WASM from server-side rendering
    if (isServer) {
      config.output = {
        ...config.output,
        webassemblyModuleFilename: 'static/wasm/[modulehash].wasm',
      };
    }

    return config;
  },
};

export default nextConfig;
