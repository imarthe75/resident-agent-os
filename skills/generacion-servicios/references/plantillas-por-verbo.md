# 5. Plantillas por verbo HTTP

> Detalle de la skill `generacion-servicios` (se lee al generar; las reglas están en su SKILL.md).

Todos los métodos retornan `Observable<ResponseDto<T>>` **sin unwrappear** (el `ResponseDto` completo viaja al componente).

### 5.1 GET — Sin parámetros

```typescript
/**
 * Obtiene [descripción de lo que retorna].
 * @returns Lista/objeto de [NombreDTO]
 */
getAll(): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE
  );
}
```

---

### 5.2 GET — Con parámetros en query string

Los parámetros se pasan como objeto; el `ApiService` se encarga de serializarlos:

```typescript
/**
 * Obtiene [descripción] filtrando por los parámetros indicados.
 * @param params - Objeto con los parámetros de filtro
 */
getByParams(params: {
  idParam1: string;
  idParam2: string;
}): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    params
  );
}
```

---

### 5.3 GET — Con parámetros opcionales

```typescript
/**
 * Obtiene [descripción] con parámetros opcionales/dinámicos.
 * @param filtros - Objeto con los filtros opcionales a aplicar
 */
getByFiltros(filtros: {
  idParam1?: string;
  idParam2?: string;
  idParam3?: string;
}): Observable<ResponseDto<MiEntidadModel[]>> {
  return this.apiService.get<ResponseDto<MiEntidadModel[]>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    filtros
  );
}
```

> **Nota:** El `ApiService` maneja internamente `HttpParams` y la serialización de parámetros opcionales. No es necesario usar `HttpParams` manualmente en los feature services.

---

### 5.4 GET — Con parámetro en path (path variable)

Usar funciones flecha en `API_ENDPOINTS` para rutas dinámicas:

```typescript
/**
 * Obtiene [descripción] por su identificador.
 * @param id - Identificador único del recurso
 */
getById(id: string): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.get<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id)
  );
}
```

---

### 5.5 POST

```typescript
/**
 * Crea un nuevo [nombre del recurso].
 * @param payload - Datos del [nombre del recurso] a crear
 */
crear(payload: MiEntidadModel): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.post<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    payload
  );
}
```

---

### 5.6 PUT

```typescript
/**
 * Actualiza [nombre del recurso] de forma completa.
 * @param payload - Objeto completo del [nombre del recurso] con los valores actualizados
 */
actualizar(payload: MiEntidadModel): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.put<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.BASE,
    payload
  );
}
```

---

### 5.7 PATCH

**Cuándo usarlo:** Cuando solo se actualiza **una parte** del recurso (ej.: cambiar estatus, modificar un campo puntual).

```typescript
/**
 * Actualiza parcialmente [nombre del recurso].
 * @param id - Identificador del recurso a modificar
 * @param cambios - Objeto parcial con los campos a actualizar
 */
actualizarParcial(id: string, cambios: Partial<MiEntidadModel>): Observable<ResponseDto<MiEntidadModel>> {
  return this.apiService.patch<ResponseDto<MiEntidadModel>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id),
    cambios
  );
}
```

> **PUT vs PATCH:**
> - **PUT**: Reemplaza el recurso completo. El body debe incluir todos los campos.
> - **PATCH**: Modifica campos específicos. El body solo incluye los campos que cambian.

---

### 5.8 DELETE

```typescript
/**
 * Elimina [nombre del recurso] por su identificador.
 * @param id - Identificador del recurso a eliminar
 */
eliminar(id: string): Observable<ResponseDto<void>> {
  return this.apiService.delete<ResponseDto<void>>(
    API_ENDPOINTS.MI_MODULO.DETAILS(id)
  );
}
```

---
