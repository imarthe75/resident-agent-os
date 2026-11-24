# 3. Plantillas de prueba por verbo HTTP

> Detalle de la skill `generacion-pruebas-servicios` (se lee al generar; las reglas están en su SKILL.md).

### 3.1 GET — Sin parámetros (happy path + error)

```typescript
describe('getAll', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200',
    responseMessage: 'OK',
    data: [
      { id: 1, nombre: 'Item 1', activo: true },
      { id: 2, nombre: 'Item 2', activo: false },
    ],
    errorList: [],
  };

  it('debería retornar el ResponseDto completo (happy path)', (done) => {
    // Arrange
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getAll().subscribe({
      next: (response) => {
        // Assert: recibe ResponseDto<T> completo, no datos unwrappeado
        expect(response.data.length).toBe(2);
        expect(response.responseCode).toBe('200');
        expect(response.data[0].nombre).toBe('Item 1');
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert: verificar endpoint y que se llamó a ApiService.get
    expect(apiServiceSpy.get).toHaveBeenCalledWith(API_ENDPOINTS.MI_MODULO.BASE);
  });

  it('debería propagar el error cuando ApiService falla (error path)', (done) => {
    // Arrange
    apiServiceSpy.get.and.returnValue(throwError(() => new Error('Error de conexión')));

    // Act
    service.getAll().subscribe({
      next: () => fail('Se esperaba un error'),
      error: (err) => {
        expect(err).toBeDefined();
        done();
      },
    });
  });
});
```

---

### 3.2 GET — Con parámetros en query string

```typescript
describe('getByParams', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200', responseMessage: 'OK',
    data: [{ id: 1, nombre: 'Test', activo: true }],
    errorList: [],
  };

  it('debería pasar los parámetros a ApiService.get', (done) => {
    // Arrange
    const params = { idParam1: 'ABC', idParam2: 'OFC01' };
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getByParams(params).subscribe({
      next: (response) => {
        expect(response.data.length).toBe(1);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert: los parámetros se delegan a ApiService
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      params
    );
  });
});
```

---

### 3.3 GET — Con parámetros opcionales

```typescript
describe('getByFiltros', () => {
  const mockResponse: ResponseDto<MiEntidadModel[]> = {
    responseCode: '200', responseMessage: 'OK',
    data: [], errorList: [],
  };

  it('debería pasar solo los filtros proporcionados', (done) => {
    // Arrange: solo se pasa idEstatus
    const filtros = { idEstatus: 'ACTIVO' };
    apiServiceSpy.get.and.returnValue(of(mockResponse));

    // Act
    service.getByFiltros(filtros).subscribe({
      next: () => done(),
      error: () => fail('No se esperaba un error'),
    });

    // Assert: ApiService recibe el objeto de filtros completo
    expect(apiServiceSpy.get).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      filtros
    );
  });
});
```

---

### 3.4 POST

```typescript
describe('crear', () => {
  const payload: MiEntidadModel = { id: 0, nombre: 'Nuevo item', activo: true };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '201', responseMessage: 'Creado',
    data: { id: 99, nombre: 'Nuevo item', activo: true },
    errorList: [],
  };

  it('debería llamar a ApiService.post con el payload y endpoint correctos', (done) => {
    // Arrange
    apiServiceSpy.post.and.returnValue(of(mockResponse));

    // Act
    service.crear(payload).subscribe({
      next: (response) => {
        expect(response.data.id).toBe(99);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    // Assert
    expect(apiServiceSpy.post).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      payload
    );
  });

  it('debería propagar el error en caso de fallo', (done) => {
    // Arrange
    const errorResponse = { status: 400, message: 'Bad Request' };
    apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

    // Act
    service.crear(payload).subscribe({
      next: () => fail('Se esperaba un error'),
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      },
    });
  });
});
```

---

### 3.5 PUT

```typescript
describe('actualizar', () => {
  const payload: MiEntidadModel = { id: 5, nombre: 'Item actualizado', activo: false };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '200', responseMessage: 'OK',
    data: payload, errorList: [],
  };

  it('debería enviar PUT con el payload al endpoint correcto', (done) => {
    apiServiceSpy.put.and.returnValue(of(mockResponse));

    service.actualizar(payload).subscribe({
      next: (response) => {
        expect(response.data).toEqual(payload);
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.put).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.BASE,
      payload
    );
  });
});
```

---

### 3.6 PATCH

```typescript
describe('actualizarParcial', () => {
  const id = '42';
  const cambios: Partial<MiEntidadModel> = { activo: false };
  const mockResponse: ResponseDto<MiEntidadModel> = {
    responseCode: '200', responseMessage: 'OK',
    data: { id: 42, nombre: 'Item', activo: false },
    errorList: [],
  };

  it('debería llamar a ApiService.patch con los cambios parciales', (done) => {
    apiServiceSpy.patch.and.returnValue(of(mockResponse));

    service.actualizarParcial(id, cambios).subscribe({
      next: (response) => {
        expect(response.data.activo).toBeFalse();
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.patch).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.DETAILS(id),
      cambios
    );
  });
});
```

---

### 3.7 DELETE

```typescript
describe('eliminar', () => {
  const id = '10';
  const mockResponse: ResponseDto<boolean> = {
    responseCode: '200', responseMessage: 'Eliminado',
    data: true, errorList: [],
  };

  it('debería llamar a ApiService.delete con el endpoint correcto', (done) => {
    apiServiceSpy.delete.and.returnValue(of(mockResponse));

    service.eliminar(id).subscribe({
      next: (response) => {
        expect(response.data).toBeTrue();
        done();
      },
      error: () => fail('No se esperaba un error'),
    });

    expect(apiServiceSpy.delete).toHaveBeenCalledWith(
      API_ENDPOINTS.MI_MODULO.DETAILS(id)
    );
  });
});
```

---
