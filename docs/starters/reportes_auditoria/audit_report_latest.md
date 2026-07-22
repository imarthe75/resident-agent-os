# 🛡️ Reporte Maestro de Auditoría Universal de Starters
**Fecha de Análisis:** 2026-07-20 15:54:43
**Total de Starters Auditados:** 15
**Total de Hallazgos Críticos:** 41

## 📊 Resumen por Proyecto
| Proyecto | Ruta | Hallazgos |
|---|---|---|
| **backend-microservicios** | `docs/starters/proyectos/backend-microservicios` | 🟢 Limpio |
| **backend-boveda-s3** | `docs/starters/proyectos/backend-boveda-s3` | 🔴 4 hallazgos |
| **starter-java-authentik** | `docs/starters/proyectos/starter-java-authentik` | 🔴 1 hallazgos |
| **frontend-homologado** | `docs/starters/proyectos/frontend-homologado` | 🔴 5 hallazgos |
| **frontend-envio-correos** | `docs/starters/proyectos/frontend-envio-correos` | 🔴 5 hallazgos |
| **frontend-agendador** | `docs/starters/proyectos/frontend-agendador` | 🟢 Limpio |
| **backend-agendador** | `docs/starters/proyectos/backend-agendador` | 🔴 6 hallazgos |
| **frontend-foliador** | `docs/starters/proyectos/frontend-foliador` | 🔴 3 hallazgos |
| **starter-chatbot-angular** | `docs/starters/proyectos/starter-chatbot-angular` | 🔴 5 hallazgos |
| **backend-envio-correos** | `docs/starters/proyectos/backend-envio-correos` | 🟢 Limpio |
| **front-sse** | `docs/starters/proyectos/front-sse` | 🔴 2 hallazgos |
| **starter-angular-authentik** | `docs/starters/proyectos/starter-angular-authentik` | 🔴 5 hallazgos |
| **angular21** | `docs/starters/proyectos/angular21` | 🔴 5 hallazgos |
| **wiki-docs** | `docs/starters/proyectos/wiki-docs` | 🟢 Limpio |
| **backend-foliador** | `docs/starters/proyectos/backend-foliador` | 🟢 Limpio |

---

## 🔍 Detalle de Hallazgos por Proyecto
### 📂 backend-boveda-s3
Ruta: `/opt/casmart/docs/starters/proyectos/backend-boveda-s3`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/test/java/com/casmart/bovedas3/integration/IngestDownloadIntegrationTest.java` | 124 | `doNothing().when(storageBovedaService).delete(any());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/com/casmart/bovedas3/controller/IngestController.java` | 225 | `storageService.delete(rutaMinio);` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/com/casmart/bovedas3/controller/DeleteController.java` | 109 | `storageService.delete(archivo.getRutaMinio());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `deployments/values-dev.yaml` | 25 | `existingSecret: "bdmiranda-secrets"` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 starter-java-authentik
Ruta: `/opt/casmart/docs/starters/proyectos/starter-java-authentik`

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/main/java/com/casmarts/starter/controllers/ProvisionamientoController.java` | 35 | `private static final String HEADER_BOOTSTRAP_TOKEN = "X-Bootstrap-Token";` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 frontend-homologado
Ruta: `/opt/casmart/docs/starters/proyectos/frontend-homologado`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 91 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/base-sistema/system-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/template-base/template-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/interceptors/mock.interceptor.ts` | 19 | `token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 frontend-envio-correos
Ruta: `/opt/casmart/docs/starters/proyectos/frontend-envio-correos`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 91 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/base-sistema/system-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/template-base/template-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/interceptors/mock.interceptor.ts` | 19 | `token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 backend-agendador
Ruta: `/opt/casmart/docs/starters/proyectos/backend-agendador`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/main/java/citas/agenda/web/controller/SedeDiaInhabilAdminController.java` | 33 | `diaInhabilService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/citas/agenda/web/controller/SedeAdminController.java` | 45 | `sedeService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/citas/agenda/web/controller/VigenciaAdminController.java` | 39 | `vigenciaService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/citas/agenda/web/controller/IntervaloAdminController.java` | 39 | `intervaloService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/citas/agenda/web/controller/UsuarioAdminController.java` | 44 | `usuarioService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/main/java/citas/agenda/web/controller/ServicioAdminController.java` | 44 | `servicioService.delete(request.getId());` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

---

### 📂 frontend-foliador
Ruta: `/opt/casmart/docs/starters/proyectos/frontend-foliador`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 91 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/layout/app.layout.ts` | 25 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/constants/storage-keys.ts` | 2 | `MOCK_TOKEN: 'mock_token'` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 starter-chatbot-angular
Ruta: `/opt/casmart/docs/starters/proyectos/starter-chatbot-angular`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 100 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/base-sistema/system-base.component.ts` | 38 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/template-base/template-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/interceptors/mock.interceptor.ts` | 19 | `token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 front-sse
Ruta: `/opt/casmart/docs/starters/proyectos/front-sse`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 91 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

---

### 📂 starter-angular-authentik
Ruta: `/opt/casmart/docs/starters/proyectos/starter-angular-authentik`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 100 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/base-sistema/system-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/template-base/template-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/interceptors/mock.interceptor.ts` | 19 | `token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.` | Posible secreto o credencial hardcodeada en texto plano. |

---

### 📂 angular21
Ruta: `/opt/casmart/docs/starters/proyectos/angular21`

#### ⚠️ UX / Estándares (Confirmación de Operaciones)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/layout/service/layout.service.ts` | 91 | `document.documentElement.classList.remove('app-dark');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/layout/component/app.layout.ts` | 34 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/base-sistema/system-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |
| `src/app/components/template-base/template-base.component.ts` | 36 | `document.body.classList.remove('blocked-scroll');` | Llamada a método destructivo o de eliminación. Verificar que cuente con confirmación. |

#### ⚠️ Seguridad (CWE-798 / OWASP A02:2021)
| Archivo | Línea | Código Coincidente | Descripción |
|---|---|---|---|
| `src/app/core/interceptors/mock.interceptor.ts` | 19 | `token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.` | Posible secreto o credencial hardcodeada en texto plano. |

---
