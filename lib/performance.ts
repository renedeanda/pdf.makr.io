// Performance monitoring utilities for PDF operations

export interface PerformanceMetrics {
  operationType: string;
  duration: number;
  fileSize: number;
  pageCount?: number;
  memoryUsed?: number;
  success: boolean;
  deviceType: 'mobile' | 'desktop';
  error?: string;
}

export class PerformanceMonitor {
  private startTime: number = 0;
  private startMemory?: number;
  private operationType: string = '';
  private fileSize: number = 0;
  private pageCount?: number;

  start(operationType: string, fileSize: number, pageCount?: number) {
    this.operationType = operationType;
    this.fileSize = fileSize;
    this.pageCount = pageCount;
    this.startTime = performance.now();

    // Track memory if available
    if ('memory' in performance) {
      const perfMemory = (performance as any).memory;
      this.startMemory = perfMemory?.usedJSHeapSize;
    }

    performance.mark(`${operationType}-start`);
    console.log(`[Performance] Started ${operationType}`, {
      fileSize: this.formatBytes(fileSize),
      pageCount,
    });
  }

  end(success: boolean, error?: string): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    performance.mark(`${this.operationType}-end`);
    performance.measure(
      this.operationType,
      `${this.operationType}-start`,
      `${this.operationType}-end`
    );

    let memoryUsed: number | undefined;
    if (this.startMemory && 'memory' in performance) {
      const perfMemory = (performance as any).memory;
      const endMemory = perfMemory?.usedJSHeapSize;
      memoryUsed = endMemory - this.startMemory;
    }

    const deviceType = this.getDeviceType();

    const metrics: PerformanceMetrics = {
      operationType: this.operationType,
      duration,
      fileSize: this.fileSize,
      pageCount: this.pageCount,
      memoryUsed,
      success,
      deviceType,
      error,
    };

    console.log(`[Performance] Completed ${this.operationType}`, {
      duration: `${(duration / 1000).toFixed(2)}s`,
      fileSize: this.formatBytes(this.fileSize),
      pageCount: this.pageCount,
      memoryUsed: memoryUsed ? this.formatBytes(memoryUsed) : 'N/A',
      success,
      deviceType,
    });

    // Send to analytics if available
    this.sendToAnalytics(metrics);

    return metrics;
  }

  private getDeviceType(): 'mobile' | 'desktop' {
    if (typeof navigator === 'undefined') return 'desktop';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
      ? 'mobile'
      : 'desktop';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private sendToAnalytics(metrics: PerformanceMetrics) {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pdf_operation', {
        event_category: 'performance',
        event_label: metrics.operationType,
        value: Math.round(metrics.duration),
        custom_dimensions: {
          file_size: metrics.fileSize,
          page_count: metrics.pageCount,
          device_type: metrics.deviceType,
          success: metrics.success,
        },
      });
    }
  }
}

// Memory management utilities
export class MemoryManager {
  private static readonly MEMORY_THRESHOLD_MOBILE = 100 * 1024 * 1024; // 100MB
  private static readonly MEMORY_THRESHOLD_DESKTOP = 500 * 1024 * 1024; // 500MB

  static checkMemoryAvailable(): boolean {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return true; // Can't check, assume OK
    }

    const perfMemory = (performance as any).memory;
    if (!perfMemory) return true;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const threshold = isMobile
      ? this.MEMORY_THRESHOLD_MOBILE
      : this.MEMORY_THRESHOLD_DESKTOP;

    const available =
      perfMemory.jsHeapSizeLimit - perfMemory.usedJSHeapSize;

    console.log('[Memory] Available:', this.formatBytes(available), 'Threshold:', this.formatBytes(threshold));

    return available > threshold;
  }

  static getCurrentMemoryUsage(): { used: number; limit: number; percentage: number } | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const perfMemory = (performance as any).memory;
    if (!perfMemory) return null;

    return {
      used: perfMemory.usedJSHeapSize,
      limit: perfMemory.jsHeapSizeLimit,
      percentage: (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) * 100,
    };
  }

  static async processInChunks<T, R>(
    items: T[],
    chunkSize: number,
    processor: (item: T, index: number) => Promise<R>,
    onProgress?: (current: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Use smaller chunks on mobile
    const effectiveChunkSize = isMobile ? Math.min(chunkSize, 2) : chunkSize;

    for (let i = 0; i < items.length; i += effectiveChunkSize) {
      const chunk = items.slice(i, i + effectiveChunkSize);

      // Process chunk
      for (let j = 0; j < chunk.length; j++) {
        const result = await processor(chunk[j], i + j);
        results.push(result);

        onProgress?.(i + j + 1, items.length);

        // Yield to main thread more frequently on mobile
        if (isMobile || (i + j) % 2 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Force garbage collection opportunity between chunks
      await new Promise(resolve => setTimeout(resolve, isMobile ? 50 : 10));
    }

    return results;
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

// Device detection utilities
export function getDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      platform: 'unknown',
      supportsWasm: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // Detect platform
  let platform = 'unknown';
  if (/android/i.test(userAgent)) platform = 'android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) platform = 'ios';
  else if (/mac/i.test(userAgent)) platform = 'macos';
  else if (/win/i.test(userAgent)) platform = 'windows';
  else if (/linux/i.test(userAgent)) platform = 'linux';

  // Check WASM support
  const supportsWasm = typeof WebAssembly !== 'undefined';

  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
    supportsWasm,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
  };
}
