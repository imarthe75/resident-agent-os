import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Enterprise Theme: Greyscale
 * A monochromatic theme utilizing shades of grey for a highly professional, focused aesthetic.
 */
export const GreyscalePreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#F5F5F5',
            100: '#E5E5E5',
            200: '#D4D4D4',
            300: '#A3A3A3',
            400: '#737373',
            500: '#525252', // Main Grey
            600: '#404040',
            700: '#262626',
            800: '#171717',
            900: '#0A0A0A',
            950: '#000000'
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b'
                }
            },
            dark: {
                surface: {
                    0:   '#ffffff',
                    50:  '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b'
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
                            background: '{surface.200}',
                            borderColor: '{surface.200}',
                            color: '{surface.800}',
                            hoverBackground: '{surface.300}',
                            activeBackground: '{surface.400}'
                        }
                    }
                },
                dark: {
                    root: {
                        primary: {
                            background: '{primary.500}',
                            borderColor: '{primary.500}',
                            color: '#ffffff',
                            hoverBackground: '{primary.400}',
                            activeBackground: '{primary.300}'
                        },
                        secondary: {
                            background: '{surface.800}',
                            borderColor: '{surface.800}',
                            color: '{surface.100}',
                            hoverBackground: '{surface.700}',
                            activeBackground: '{surface.600}'
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
