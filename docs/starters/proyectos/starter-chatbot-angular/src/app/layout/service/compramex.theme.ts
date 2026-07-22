import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Institutional Theme: COMPRAMEX
 * Government of the State of Mexico
 */
export const CompramexPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#FDF2F4',
            100: '#FBE6E9',
            200: '#F7CED5',
            300: '#F0A8B4',
            400: '#E5778A',
            500: '#83213C', // Guinda Institucional
            600: '#751D36',
            700: '#62192D',
            800: '#521526',
            900: '#451221',
            950: '#260A12'
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
                    50:  '#f5f5f5',
                    100: '#e6e6e6',
                    200: '#cccccc',
                    300: '#b3b3b3',
                    400: '#808080',
                    500: '#666666',
                    600: '#4d4d4d',
                    700: '#333333',
                    800: '#2d2d2d',
                    900: '#1e1e1e',
                    950: '#0d0d0d'
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
                            borderColor: '{primary.500}',
                            color: '#ffffff',
                            hoverBackground: '{primary.600}',
                            activeBackground: '{primary.700}'
                        },
                        secondary: {
                            background: '#BFA36D', // Oro Compramex
                            borderColor: '#BFA36D',
                            color: '#ffffff',
                            hoverBackground: '#A68C5B',
                            activeBackground: '#8C764D'
                        }
                    }
                }
            }
        },
        datatable: {
            header: {
                background: '{primary.500}',
                color: '#ffffff'
            }
        }
    }
});
