import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Phaser is intentionally a large standalone vendor chunk.
    chunkSizeWarningLimit: 1_500,
    rollupOptions: {
      output: {
        // Keep Phaser in a content-hashed chunk so game-only deployments can
        // continue using an already cached framework bundle from the CDN.
        manualChunks: (id) =>
          id.includes('/node_modules/phaser/') ? 'phaser' : undefined,
      },
    },
  },
});
