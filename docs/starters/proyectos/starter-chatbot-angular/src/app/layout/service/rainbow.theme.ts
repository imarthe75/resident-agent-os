import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * ============================================================================
 * ENTERPRISE THEME: RAINBOW "MASTER SHOWCASE" 
 * ============================================================================
 * Este archivo es la Guía Definitiva de todo lo que se puede personalizar 
 * en el Styled Mode de PrimeNG 20/21. Usar como referencia para crear nuevos
 * temas. Contiene ejemplos exhaustivos de Primitives, Semantics y Component CSS.
 */
export const RainbowPreset = definePreset(Aura, {
    // ------------------------------------------------------------------------
    // 1. SEMANTIC TOKENS: Variables globales de color y comportamiento
    // ------------------------------------------------------------------------
    semantic: {
        // A. PRIMITIVE COLORS: La base absoluta (escala 50-950)
        primary: {
            50: '#FCE4EC',
            100: '#F8BBD0',
            200: '#E1BEE7',
            300: '#D1C4E9',
            400: '#C5CAE9',
            500: '#9C27B0', // Vibrante / Base Rainbow
            600: '#00BCD4',
            700: '#4CAF50',
            800: '#FFEB3B',
            900: '#FF9800',
            950: '#F44336'
        },
        
        // B. ESQUEMAS DE COLOR (LIGHT / DARK)
        colorScheme: {
            light: {
                // Fondos base de la aplicación y componentes
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
                },
                // Sobrescritura de Inputs global: Todo input en la app
                formField: {
                    hoverBorderColor: '{primary.500}',
                    focusBorderColor: '{primary.600}',
                    invalidBorderColor: '#FF1744',
                    background: '{surface.50}',
                    color: '{surface.900}'
                },
                // Sobrescritura de 'Highlight' o Foco (Ej: Elementos seleccionados en Checkbox o Tablas)
                highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.100}',
                    color: '{primary.700}',
                    focusColor: '{primary.800}'
                },
                // Sobrescritura Textos Globales
                text: {
                    color: '{surface.800}',
                    hoverColor: '{primary.700}',
                    mutedColor: '{surface.500}'
                }
            },
            dark: {
                surface: {
                    0:   '#ffffff',
                    50:  '#f8f8f8',
                    100: '#e8e8e8',
                    200: '#cccccc',
                    300: '#b3b3b3',
                    400: '#808080',
                    500: '#666666',
                    600: '#4d4d4d',
                    700: '#333333',
                    800: '#2d2d2d',
                    900: '#1e1e1e',
                    950: '#0a0a0a'
                },
                formField: {
                    hoverBorderColor: '{primary.400}',
                    focusBorderColor: '{primary.300}',
                    invalidBorderColor: '#ff2c55',
                    background: '{surface.900}',
                    color: '{surface.100}'
                },
                highlight: {
                    background: 'rgba(156, 39, 176, 0.2)', // Overlay suave de primary500
                    focusBackground: 'rgba(156, 39, 176, 0.3)',
                    color: '{surface.50}',
                    focusColor: '{surface.0}'
                },
                text: {
                    color: '{surface.200}',
                    hoverColor: '{primary.400}',
                    mutedColor: '{surface.400}'
                }
            }
        }
    },

    // ------------------------------------------------------------------------
    // 2. COMPONENT TOKENS: Configuración Quirúrgica por Componente
    // ------------------------------------------------------------------------
    components: {
        // Muestra de Inyección CSS Avanzada en Paneles
        card: {
            colorScheme: {
                light: {
                    root: {
                        background: '#ffffff',
                        shadow: '0 10px 25px -5px rgba(156, 39, 176, 0.1), 0 8px 10px -6px rgba(0, 188, 212, 0.1)' // Sombra Rainbow
                    }
                },
                dark: {
                    root: {
                        background: '{surface.900}',
                        shadow: '0 10px 25px -5px rgba(156, 39, 176, 0.2), 0 8px 10px -6px rgba(0, 188, 212, 0.2)'
                    }
                }
            },
            // [MAGIA]: Puedes escupir CSS Nativo directo al componente
            css: `
                .p-card {
                    border-radius: 1.5rem;
                    border: 1px solid transparent;
                    background-clip: padding-box;
                    position: relative;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .p-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 25px -5px rgba(156, 39, 176, 0.15), 0 10px 10px -5px rgba(0, 188, 212, 0.15);
                }
            `
        },

        // Muestra de Sobrescritura de Inputs
        inputtext: {
            css: `
                .p-inputtext {
                    border-radius: 0.75rem;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .p-inputtext:focus {
                    box-shadow: 0 0 0 2px #fff, 0 0 0 4px {primary.500};
                }
            `
        },

        // Muestra de Botones con Degradados Complejos
        button: {
            colorScheme: {
                light: {
                    root: {
                        primary: {
                            background: 'linear-gradient(135deg, #9C27B0 0%, #00BCD4 100%)',
                            borderColor: 'transparent',
                            color: '#ffffff',
                            hoverBackground: 'linear-gradient(135deg, #7B1FA2 0%, #0097A7 100%)',
                            activeBackground: 'linear-gradient(135deg, #4A148C 0%, #006064 100%)'
                        },
                        secondary: {
                            background: 'linear-gradient(135deg, #FFEB3B 0%, #FF9800 100%)',
                            borderColor: 'transparent',
                            color: '#1e1e1e',
                            hoverBackground: 'linear-gradient(135deg, #FDD835 0%, #F57C00 100%)',
                            activeBackground: 'linear-gradient(135deg, #FBC02D 0%, #E65100 100%)'
                        }
                    }
                },
                dark: {
                    root: {
                        primary: {
                            background: 'linear-gradient(135deg, #E1BEE7 0%, #B2EBF2 100%)',
                            borderColor: 'transparent',
                            color: '#1e1e1e',
                            hoverBackground: 'linear-gradient(135deg, #CE93D8 0%, #80DEEA 100%)',
                            activeBackground: 'linear-gradient(135deg, #BA68C8 0%, #4DD0E1 100%)'
                        },
                        secondary: {
                            background: 'linear-gradient(135deg, #FFF59D 0%, #FFCC80 100%)',
                            borderColor: 'transparent',
                            color: '#1e1e1e',
                            hoverBackground: 'linear-gradient(135deg, #FFF176 0%, #FFB74D 100%)',
                            activeBackground: 'linear-gradient(135deg, #FFEE58 0%, #FFA726 100%)'
                        }
                    }
                }
            },
            // CSS Nativo para añadir animación pulsante al botón primario
            css: `
                .p-button {
                    border-radius: 999px; /* Botones totalmente redondos */
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
            `
        },

        // Muestra de Control Preciso de Tablas (DataTables)
        datatable: {
            colorScheme: {
                light: {
                    header: {
                        background: 'linear-gradient(90deg, #9C27B0 0%, #FF5722 100%)',
                        color: '#ffffff'
                    }
                },
                dark: {
                    header: {
                        background: 'linear-gradient(90deg, #7B1FA2 0%, #E64A19 100%)',
                        color: '#ffffff'
                    }
                }
            }
        }
    }
});
