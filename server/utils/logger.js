/**
 * Logger utility for consistent logging across the application
 * Only logs in development environment to avoid exposing sensitive data in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Log general information (only in development)
     */
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Log errors (always logged)
     */
    error: (...args) => {
        console.error('[ERROR]', ...args);
    },

    /**
     * Log debug information (only in development)
     */
    debug: (...args) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    },

    /**
     * Log warnings (always logged)
     */
    warn: (...args) => {
        console.warn('[WARN]', ...args);
    },

    /**
     * Log info (only in development)
     */
    info: (...args) => {
        if (isDevelopment) {
            console.info('[INFO]', ...args);
        }
    }
};

export default logger;

