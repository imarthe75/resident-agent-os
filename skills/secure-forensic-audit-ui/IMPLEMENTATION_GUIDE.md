# Guía de Implementación: Replicación de la Interfaz de Auditoría Paginada

Esta guía proporciona el paso a paso técnico, dependencias y fragmentos de código genéricos para recrear la interfaz de **Auditoría y Evidencia Forense** en cualquier módulo de administración utilizando **Angular 21** y **PrimeNG 21**.

---

## Requisitos Previos y Dependencias (`package.json`)

Asegúrate de que tu proyecto cuenta con las siguientes dependencias en su `package.json`:

```json
"dependencies": {
    "@angular/common": "^21.0.0",
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "primeng": "^21.0.2",
    "primeicons": "^7.0.0",
    "@tailwindcss/postcss": "^4.1.11"
}
```

---

## Paso 1: Definir Interfaces y Contratos de Datos (Modelos DTO)

Crea las interfaces de tipado fuerte en tu directorio de modelos.

### A. Estructura Genérica de Paginación (`paginacion.model.ts`)
```typescript
// Interfaces genéricas y reutilizables para la Paginación en Angular 21
export interface PaginadoRequest {
  page: number;      // Página solicitada (comúnmente 0-indexed para Spring Boot)
  rows: number;      // Límite de registros por página
  sortBy: string;    // Nombre del campo para ordenamiento (ej: 'fecha')
  sortDir: number;   // Dirección del ordenamiento (0 = ASC, 1 = DESC)
}

export interface PaginadoResponse {
  totalRecords: number;
  pageCount: number;
  page: number;
  rows: number;
  sortBy: string;
  sortDir: number;
}

export interface Paginacion<T> {
  list: T[];
  paginado: PaginadoResponse;
}
```

### B. Estructura Específica de tu Auditoría (`auditoria.model.ts`)
```typescript
import { PaginadoRequest } from './paginacion.model';

// REEMPLAZA: Adapta estos enums a los módulos reales de tu backend
export enum AuditModule {
  MODULO_A = 'MODULO_A',
  MODULO_B = 'MODULO_B',
  SEGURIDAD = 'SEGURIDAD',
  SISTEMA = 'SISTEMA'
}

// REEMPLAZA: Adapta estos enums a las acciones reales que audita tu backend
export enum AuditAction {
  LOGIN_EXITOSO = 'LOGIN_EXITOSO',
  LOGIN_FALLIDO = 'LOGIN_FALLIDO',
  REGISTRO_CREADO = 'REGISTRO_CREADO',
  REGISTRO_MODIFICADO = 'REGISTRO_MODIFICADO',
  REGISTRO_ELIMINADO = 'REGISTRO_ELIMINADO'
}

export interface AuditSearchRequest {
  fechaInicio: string | null; // ISO DateTime o string formateado
  fechaFin: string | null;    // ISO DateTime o string formateado
  accion: AuditAction | null;
  modulo: AuditModule | null;
  folio: string | null;       // O identificador de negocio de tu entidad
  paginado: PaginadoRequest;
}

export interface AuditResponse {
  id: string;              // UUID único del log
  fecha: string;           // ISO DateTime de registro
  username: string;        // Identificador del usuario
  perfil: string;          // Rol o perfil del usuario
  accion: AuditAction;     // Acción auditada
  modulo: AuditModule;     // Módulo originador
  canal: string;           // WEB | MOBILE | API
  ipAddress: string;       // IP de origen del cliente
  folio: string | null;    // Folio de negocio relacionado (opcional)
  metadata: Record<string, unknown>; // Payload de evidencia forense estructurada (JSON/CBOR)
}
```

---

## Paso 2: Crear el Servicio de Datos (`auditoria.service.ts`)

Centraliza las llamadas HTTP consumiendo la API de auditoría de tu backend. Utiliza una envoltura de respuesta estándar (ej: `ResponseDto`).

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResponseDto } from '../models/response-dto.model'; // Envoltura estándar del backend
import { AuditSearchRequest, AuditResponse, AuditModule, AuditAction } from '../models/auditoria.model';
import { Paginacion } from '../models/paginacion.model';

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private http = inject(HttpClient);
  
  // REEMPLAZA: Define el endpoint correspondiente a tu microservicio o backend
  private readonly API_URL = `${environment.apiBaseUrl}/admin/auditoria`;

  /**
   * Consulta los logs de auditoría de manera paginada y filtrada.
   */
  search(request: AuditSearchRequest): Observable<Paginacion<AuditResponse>> {
    return this.http.post<ResponseDto<Paginacion<AuditResponse>>>(`${this.API_URL}/search`, request).pipe(
      map(res => res.data)
    );
  }

  /**
   * Obtiene la lista de módulos que generan logs en el sistema (catálogo).
   */
  getModulos(): Observable<AuditModule[]> {
    return this.http.get<ResponseDto<AuditModule[]>>(`${this.API_URL}/modulos`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Obtiene la lista de acciones de auditoría que son auditadas (catálogo).
   */
  getAcciones(): Observable<AuditAction[]> {
    return this.http.get<ResponseDto<AuditAction[]>>(`${this.API_URL}/acciones`).pipe(
      map(res => res.data)
    );
  }
}
```

---

## Paso 3: Controlador del Componente con Angular Signals (`auditoria.component.ts`)

Implementa la lógica reactiva y la interoperabilidad RxJS-Signals mediante `toSignal` y Signals nativos.

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

// PrimeNG Modules 21
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FluidModule } from 'primeng/fluid';

import { AuditoriaService } from '../../services/auditoria.service';
import { AuditSearchRequest, AuditResponse, AuditModule, AuditAction } from '../../models/auditoria.model';
import { PaginadoRequest } from '../../models/paginacion.model';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    FluidModule
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss'
})
export class AuditoriaComponent {
  private auditoriaService = inject(AuditoriaService);
  private fb = inject(FormBuilder);

  // Carga reactiva asíncrona de catálogos mediante toSignal (Angular 21 standard)
  modulos = toSignal(this.auditoriaService.getModulos(), { initialValue: [] as AuditModule[] });
  acciones = toSignal(this.auditoriaService.getAcciones(), { initialValue: [] as AuditAction[] });

  // Estado reactivo de los datos principales
  records = signal<AuditResponse[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(true);
  pageRows = signal<number>(10);

  // Estado de visibilidad del modal y elemento seleccionado
  selectedAudit = signal<AuditResponse | null>(null);
  showDetailDialog = signal<boolean>(false);

  // Paginación y ordenamiento reactivo interno
  private currentPage = signal<number>(0);
  private currentSortBy = signal<string>('fecha'); // Campo de ordenamiento default
  private currentSortDir = signal<number>(1);       // 1 = DESC por defecto, 0 = ASC

  // Formulario reactivo para filtros de auditoría
  filterForm = this.fb.group({
    fechaInicio: [null as Date | null],
    fechaFin: [null as Date | null],
    modulo: [null as AuditModule | null],
    accion: [null as AuditAction | null],
    folio: [''] // Reemplaza 'folio' por tu clave/id de búsqueda de negocio
  });

  constructor() {
    // Validación reactiva cruzada para asegurar que fechaFin >= fechaInicio
    this.filterForm.get('fechaInicio')?.valueChanges.subscribe(val => {
      const fechaFinControl = this.filterForm.get('fechaFin');
      if (val && fechaFinControl?.value) {
        const start = new Date(val);
        const end = new Date(fechaFinControl.value);
        if (end < start) {
          fechaFinControl.setValue(val);
        }
      }
    });
  }

  /**
   * Carga de datos con envoltura asíncrona de carga.
   */
  loadData(): void {
    this.loading.set(true);
    const formValue = this.filterForm.value;

    const paginado: PaginadoRequest = {
      page: this.currentPage(),
      rows: this.pageRows(),
      sortBy: this.currentSortBy(),
      sortDir: this.currentSortDir()
    };

    const searchRequest: AuditSearchRequest = {
      fechaInicio: this.formatOffsetDateTime(formValue.fechaInicio, false),
      fechaFin: this.formatOffsetDateTime(formValue.fechaFin, true),
      modulo: formValue.modulo || null,
      accion: formValue.accion || null,
      folio: formValue.folio ? formValue.folio.trim() : null,
      paginado: paginado
    };

    this.auditoriaService.search(searchRequest)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.records.set(res.list);
          this.totalRecords.set(res.paginado.totalRecords);
          this.pageRows.set(res.paginado.rows);
        },
        error: () => {
          this.records.set([]);
          this.totalRecords.set(0);
        }
      });
  }

  /**
   * Transforma eventos nativos de carga diferida de PrimeNG (Lazy Loading)
   * a contratos específicos del backend.
   */
  onLazyLoad(event: any): void {
    const page = Math.floor((event.first || 0) / (event.rows || 10));
    const rows = event.rows || 10;
    const sortBy = event.sortField || 'fecha';
    const sortDir = event.sortOrder === -1 ? 1 : 0; // -1 es DESC (1), 1 es ASC (0)

    this.currentPage.set(page);
    this.pageRows.set(rows);
    this.currentSortBy.set(sortBy);
    this.currentSortDir.set(sortDir);

    this.loadData();
  }

  ejecutarBusqueda(): void {
    this.currentPage.set(0);
    this.loadData();
  }

  limpiarFiltros(): void {
    this.filterForm.reset({
      fechaInicio: null,
      fechaFin: null,
      modulo: null,
      accion: null,
      folio: ''
    });
    this.ejecutarBusqueda();
  }

  verDetalle(registro: AuditResponse): void {
    this.selectedAudit.set(registro);
    this.showDetailDialog.set(true);
  }

  cerrarDetalle(): void {
    this.showDetailDialog.set(false);
    this.selectedAudit.set(null);
  }

  private formatOffsetDateTime(date: Date | null | undefined, endOfDay: boolean): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  }

  // REEMPLAZA: Adapta los colores y estilos visuales de PrimeNG severity a tus módulos
  getModuloSeverity(modulo: AuditModule): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' | undefined {
    switch (modulo) {
      case AuditModule.SEGURIDAD: return 'danger';
      case AuditModule.SISTEMA: return 'secondary';
      default: return 'info';
    }
  }

  formatAccionLabel(accion: AuditAction): string {
    return accion
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
```

---

## Paso 4: Creación de la Plantilla HTML Premium (`auditoria.component.html`)

Asegura el uso de layouts fluidos y adaptativos. Puedes adaptar los colores institucionales (como el `#9F2241` y `#BC955C` del ejemplo gubernamental) a la paleta de tu organización.

```html
<div class="animate-in fade-in duration-500">
    
    <!-- Cabecera Toolbar -->
    <p-toolbar styleClass="bg-white dark:bg-surface-900 border border-surface-100 rounded-2xl p-6 shadow-sm mb-6">
        <ng-template pTemplate="start">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100">
                    <i class="pi pi-shield text-xl"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-black tracking-tight m-0 text-slate-800 dark:text-slate-100">Bitácora de Auditoría</h1>
                    <p class="text-slate-500 text-sm font-medium m-0">Evidencia transaccional forense de seguridad</p>
                </div>
            </div>
        </ng-template>
        <ng-template pTemplate="end">
            <!-- Sello de verificación. Cambiar colores de acuerdo al tema de marca -->
            <div class="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-xl text-xs font-bold text-amber-700">
                <i class="pi pi-verified"></i>
                <span>Hash Chain Activo</span>
            </div>
        </ng-template>
    </p-toolbar>

    <!-- Filtros Reactivos -->
    <div class="bg-white rounded-2xl border border-surface-100 p-6 shadow-sm mb-6">
        <form [formGroup]="filterForm" (ngSubmit)="ejecutarBusqueda()">
            <p-fluid>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-surface-400">Fecha Inicio</label>
                        <p-datepicker formControlName="fechaInicio" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="dd/mm/aaaa"></p-datepicker>
                    </div>

                    <div class="col-span-12 md:col-span-3 flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-surface-400">Fecha Fin</label>
                        <p-datepicker formControlName="fechaFin" dateFormat="dd/mm/yy" [showIcon]="true" placeholder="dd/mm/aaaa" [minDate]="filterForm.get('fechaInicio')?.value || null"></p-datepicker>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-surface-400">Módulo</label>
                        <p-select formControlName="modulo" [options]="modulos()" placeholder="Todos los módulos" [showClear]="true"></p-select>
                    </div>

                    <div class="col-span-12 sm:col-span-6 md:col-span-3 flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-surface-400">Acción</label>
                        <p-select formControlName="accion" [options]="acciones()" placeholder="Todas las acciones" [showClear]="true" [filter]="true" filterBy="label">
                            <ng-template let-option pTemplate="item"><span>{{ formatAccionLabel(option) }}</span></ng-template>
                            <ng-template let-selectedOption pTemplate="selectedItem"><span>{{ formatAccionLabel(selectedOption) }}</span></ng-template>
                        </p-select>
                    </div>

                    <div class="col-span-12 md:col-span-9 flex flex-col gap-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-surface-400">Buscar por Folio / ID</label>
                        <p-iconfield iconPosition="left">
                            <p-inputicon class="pi pi-search text-surface-400" />
                            <input pInputText type="text" formControlName="folio" placeholder="Ingresa folio o identificador..." class="w-full h-11" />
                        </p-iconfield>
                    </div>

                    <div class="col-span-12 md:col-span-3 flex items-end gap-3 h-11 mt-4 md:mt-0">
                        <p-button label="Limpiar" icon="pi pi-filter-slash" severity="secondary" [outlined]="true" styleClass="h-11 w-full" (onClick)="limpiarFiltros()" type="button"></p-button>
                        <p-button label="Buscar" icon="pi pi-search" severity="primary" styleClass="h-11 w-full" type="submit"></p-button>
                    </div>
                </div>
            </p-fluid>
        </form>
    </div>

    <!-- Tabla Lazy Loaded -->
    <div class="border border-surface-100 rounded-2xl overflow-hidden shadow-sm bg-white">
        <p-table
            [value]="records()"
            [lazy]="true"
            [totalRecords]="totalRecords()"
            [rows]="pageRows()"
            [rowsPerPageOptions]="[10, 20, 50, 100]"
            [paginator]="true"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
            [loading]="loading()"
            [stripedRows]="true"
            size="small"
            (onLazyLoad)="onLazyLoad($event)">
            
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="fecha" class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[18%]">
                        Fecha / Hora <p-sortIcon field="fecha"></p-sortIcon>
                    </th>
                    <th pSortableColumn="username" class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[15%]">
                        Usuario <p-sortIcon field="username"></p-sortIcon>
                    </th>
                    <th pSortableColumn="modulo" class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[12%] text-center">
                        Módulo <p-sortIcon field="modulo"></p-sortIcon>
                    </th>
                    <th pSortableColumn="accion" class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[25%]">
                        Acción <p-sortIcon field="accion"></p-sortIcon>
                    </th>
                    <th class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[10%] text-center">Canal / IP</th>
                    <th pSortableColumn="folio" class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[12%]">
                        Folio <p-sortIcon field="folio"></p-sortIcon>
                    </th>
                    <th class="bg-surface-50 text-[10px] font-black uppercase text-surface-400 py-4 px-3 w-[8%] text-center">Evidencia</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-registro>
                <tr class="text-xs">
                    <td class="font-bold text-slate-700 py-3.5 px-3">
                        <div class="flex items-center gap-2">
                            <i class="pi pi-calendar text-surface-400"></i>
                            <span>{{ registro.fecha | date: 'dd/MM/yyyy HH:mm:ss' }}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-3">
                        <div class="flex flex-col">
                            <span class="font-bold text-slate-900 flex items-center gap-1.5"><i class="pi pi-user text-surface-400 text-[10px]"></i>{{ registro.username }}</span>
                            <span class="text-[9px] text-primary-600 font-black uppercase tracking-wider pl-4">{{ registro.perfil }}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-3 text-center">
                        <p-tag [value]="registro.modulo" [severity]="getModuloSeverity(registro.modulo)" styleClass="text-[9px] font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider"></p-tag>
                    </td>
                    <td class="font-medium text-slate-700 py-3.5 px-3">{{ formatAccionLabel(registro.accion) }}</td>
                    <td class="py-3.5 px-3 text-center">
                        <div class="flex flex-col gap-0.5 items-center">
                            <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold text-[9px] uppercase">{{ registro.canal }}</span>
                            <span class="text-[10px] font-mono text-slate-400 font-medium">{{ registro.ipAddress }}</span>
                        </div>
                    </td>
                    <td class="py-3.5 px-3">
                        @if (registro.folio) {
                            <span class="font-black text-primary-800 bg-primary-50 px-2 py-1 rounded border border-primary-100/50">{{ registro.folio }}</span>
                        } @else {
                            <span class="text-surface-300 italic">-</span>
                        }
                    </td>
                    <td class="py-3.5 px-3 text-center">
                        <p-button icon="pi pi-eye" [text]="true" [rounded]="true" severity="secondary" styleClass="text-slate-500 hover:text-primary-700" (onClick)="verDetalle(registro)"></p-button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7" class="text-center py-6 text-slate-400">
                        <i class="pi pi-filter-slash text-2xl mb-2 block"></i>
                        No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <!-- Modal Forense -->
    <p-dialog [(visible)]="showDetailDialog" [modal]="true" [style]="{ width: '600px' }" [draggable]="false" [resizable]="false" (onHide)="cerrarDetalle()">
        <ng-template pTemplate="header">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <i class="pi pi-lock-open text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-lg font-black text-surface-900 m-0">Evidencia Forense Encriptada</h2>
                    <p class="text-[10px] font-bold text-surface-400 uppercase tracking-widest m-0">Sello criptográfico de integridad</p>
                </div>
            </div>
        </ng-template>

        <div class="p-2">
            <div class="grid grid-cols-2 gap-4 mb-5 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                <div class="flex flex-col gap-0.5">
                    <span class="text-[9px] font-black text-surface-400 uppercase tracking-wider">Identificador de Evento (UUID)</span>
                    <span class="text-xs font-mono font-bold text-surface-700 select-all">{{ selectedAudit()?.id }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                    <span class="text-[9px] font-black text-surface-400 uppercase tracking-wider">Fecha / Hora de Registro</span>
                    <span class="text-xs font-bold text-surface-700">{{ selectedAudit()?.fecha | date: 'dd/MM/yyyy HH:mm:ss.sss ZZZ' }}</span>
                </div>
            </div>
            <div class="text-xs font-black text-surface-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <i class="pi pi-code"></i>
                <span>Metadatos Estructurados (CBOR Payload)</span>
            </div>
            <div class="border border-surface-200/60 rounded-xl overflow-hidden">
                <pre class="bg-surface-950 text-emerald-400 text-xs p-4 overflow-x-auto font-mono max-h-[300px] leading-relaxed m-0">{{ selectedAudit()?.metadata | json }}</pre>
            </div>
        </div>

        <ng-template pTemplate="footer">
            <div class="flex justify-end gap-3 pt-3 border-t border-surface-100">
                <p-button label="Cerrar evidencia" severity="secondary" [outlined]="true" (onClick)="cerrarDetalle()"></p-button>
            </div>
        </ng-template>
    </p-dialog>
</div>
```

---

## Paso 5: Hoja de Estilos de Integración SCSS (`auditoria.component.scss`)

Agrega pequeñas reglas de animación de entrada a las tarjetas del componente para mejorar la UX.

```scss
:host {
  display: block;
  width: 100%;
}

.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
