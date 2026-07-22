import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Institutional Theme: C&A Smart Systems
 * Metallic Silver & Steel Blue identity.
 */
export const CASmartPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#E6EEF3',
            100: '#C2D5E1',
            200: '#9AB9CD',
            300: '#729CB9',
            400: '#5587A9',
            500: '#4682B4', // Steel Blue
            600: '#3E76A3',
            700: '#33668D',
            800: '#2C3E50', // Midnight
            900: '#1B1464'  // Deep Brand Blue
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a'
                }
            },
            dark: {
                surface: {
                    0:   '#ffffff',
                    50:  '#f0f4f8',
                    100: '#dce8f2',
                    200: '#b3cde0',
                    300: '#8ab4cd',
                    400: '#5587a9',
                    500: '#4682B4',
                    600: '#33668D',
                    700: '#2C3E50',
                    800: '#1e2a3d',
                    900: '#1B1464',
                    950: '#0D0930'
                }
            }
        }
    },
    components: {
        button: {
            colorScheme: {
                light: {
                    root: {
                        primary: {
                            background: '{primary.500}',
                            hoverBackground: '{primary.600}',
                            activeBackground: '{primary.700}',
                            color: '#ffffff'
                        }
                    }
                },
                dark: {
                    root: {
                        primary: {
                            background: '{primary.500}',
                            hoverBackground: '{primary.400}',
                            activeBackground: '{primary.300}',
                            color: '#ffffff'
                        }
                    }
                }
            }
        }
    }
});
