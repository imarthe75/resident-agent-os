# Guía de Implementación: Replicación del Subsistema de Auditoría Segura

Esta guía proporciona el paso a paso técnico, dependencias y esqueletos de código reales para recrear el subsistema de **Auditoría Segura y Evidencia Forense** en cualquier otro microservicio o monolito de Spring Boot (Java 21).

---

## Paso 1: Configurar Dependencias en Gradle

Añade las dependencias para serialización estructurada binaria en tu archivo `build.gradle`:

```groovy
dependencies {
    // Jackson para empaquetado estructurado CBOR
    implementation 'com.fasterxml.jackson.dataformat:jackson-dataformat-cbor'
    // Lombok (opcional pero recomendado)
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

---

## Paso 2: Propiedades del Entorno (`application.properties`)

Añade los parámetros de rotación, almacenamiento y claves criptográficas. **Importante**: En producción, estas claves deben inyectarse mediante variables de entorno del sistema (`AUDIT_AES_KEY` y `AUDIT_HMAC_KEY`).

```properties
# Habilitación y rutas del Subsistema Forense
audit.archive.enabled=true
audit.archive.path=./runtime/.sync/
audit.archive.fallback-path=./runtime/.cache/
audit.archive.temp-path=./runtime/.tmp/
audit.archive.rotation=daily
audit.archive.max-size-mb=100
audit.archive.compression=gzip
audit.archive.encryption.enabled=true

# Claves por defecto en Local (HEX de 64 caracteres / 256 bits)
audit.archive.secret-key=${AUDIT_AES_KEY:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
audit.archive.hmac-key=${AUDIT_HMAC_KEY:7468697369736176657279736563757265686d61636b6579666f726175646974}
```

---

## Paso 3: Aislamiento Asíncrono por Hilos Virtuales (`AsyncConfig.java`)

Crea un pool asíncrono exclusivo para la auditoría, aislado del resto de tareas asíncronas del negocio:

```java
package tu.proyecto.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "auditExecutor")
    public Executor auditExecutor() {
        // Hilos Virtuales nativos de Java 21 para escalabilidad horizontal infinita
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}
```

---

## Paso 4: Criptografía y Firma (`AuditCryptoService.java`)

Implementa el cifrado **AES-256-GCM** y la autenticación envolvente **HMAC-SHA256**:

```java
package tu.proyecto.service.audit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
public class AuditCryptoService {

    private final SecretKeySpec aesKey;
    private final SecretKeySpec hmacKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuditCryptoService(
            @Value("${audit.archive.secret-key}") String aesKeyHex,
            @Value("${audit.archive.hmac-key}") String hmacKeyHex) {
        this.aesKey = new SecretKeySpec(HexFormat.of().parseHex(aesKeyHex), "AES");
        this.hmacKey = new SecretKeySpec(HexFormat.of().parseHex(hmacKeyHex), "HmacSHA256");
    }

    public byte[] encrypt(byte[] plaintext, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv); // 128 bit auth tag
        cipher.init(Cipher.ENCRYPT_MODE, aesKey, spec);
        return cipher.doFinal(plaintext);
    }

    public byte[] decrypt(byte[] ciphertext, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        GCMParameterSpec spec = new GCMParameterSpec(128, iv);
        cipher.init(Cipher.DECRYPT_MODE, aesKey, spec);
        return cipher.doFinal(ciphertext);
    }

    public byte[] calculateHMAC(byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(hmacKey);
        return mac.doFinal(data);
    }

    public boolean verifyHMAC(byte[] data, byte[] signature) throws Exception {
        byte[] calculated = calculateHMAC(data);
        return MessageDigest.isEqual(calculated, signature); // Previene ataques de timing
    }

    public byte[] generateIV() {
        byte[] iv = new byte[12]; // IV estándar de 12 bytes para GCM
        secureRandom.nextBytes(iv);
        return iv;
    }
}
```

---

## Paso 5: Cadena de Hashes (`AuditHashChainService.java`)

Encadena lógicamente los logs para evitar borrado o reordenación de datos. Incluye el mecanismo de recuperación física y truncamiento de bloques corruptos ante caídas bruscas:

```java
package tu.proyecto.service.audit;

import org.springframework.stereotype.Service;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.security.MessageDigest;
import java.util.Arrays;

@Service
public class AuditHashChainService {

    public byte[] calculateNextHash(byte[] prevHash, byte[] encryptedPayload, long timestamp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(prevHash);
            digest.update(encryptedPayload);
            ByteBuffer buffer = ByteBuffer.allocate(Long.BYTES);
            buffer.putLong(timestamp);
            digest.update(buffer.array());
            return digest.digest();
        } catch (Exception e) {
            throw new RuntimeException("Fallo al calcular Hash Chain", e);
        }
    }

    public byte[] recoverLastValidHashAndTruncate(java.nio.file.Path activeFile, AuditCryptoService cryptoService) {
        byte[] lastHash = new byte[32]; // Hash semilla inicial (todo ceros)
        if (!java.nio.file.Files.exists(activeFile)) {
            return lastHash;
        }

        long lastValidPosition = 0;
        try (RandomAccessFile raf = new RandomAccessFile(activeFile.toFile(), "rw")) {
            long length = raf.length();
            while (raf.getFilePointer() < length) {
                long currentPosition = raf.getFilePointer();
                if (currentPosition + 18 > length) { // Tamaño mínimo de cabecera estructural
                    break;
                }

                int magic = raf.readInt();
                if (magic != 0xCAFE0A0D) {
                    break; // Magic corrupto
                }

                raf.readByte(); // Version
                raf.readByte(); // Suite
                int frameLength = raf.readInt();
                if (currentPosition + frameLength > length) {
                    break; // Frame incompleto por apagón
                }

                raf.seek(currentPosition);
                byte[] frameData = new byte[frameLength - 4]; // Todo menos CRC32
                raf.readFully(frameData);
                int crcCalculated = calculateCRC32(frameData);
                int crcStored = raf.readInt();

                if (crcCalculated != crcStored) {
                    break; // Corrupción física
                }

                // Descomponer para validar firma HMAC
                int ivLenPosition = 4 + 1 + 1 + 4 + 8;
                int ivLength = frameData[ivLenPosition] & 0xFF;
                int payloadOffset = ivLenPosition + 1 + ivLength + 32 + 32;
                int hmacOffset = frameData.length - 32;

                byte[] blockToSign = Arrays.copyOfRange(frameData, 0, hmacOffset);
                byte[] signature = Arrays.copyOfRange(frameData, hmacOffset, frameData.length);

                if (!cryptoService.verifyHMAC(blockToSign, signature)) {
                    break; // Firma rota o manipulada
                }

                // Frame 100% válido, guardar su hash actual
                int hashActualOffset = ivLenPosition + 1 + ivLength + 32;
                System.arraycopy(frameData, hashActualOffset, lastHash, 0, 32);
                lastValidPosition = raf.getFilePointer();
            }

            // Si se detectó truncamiento (datos huérfanos al final)
            if (lastValidPosition < length) {
                raf.setLength(lastValidPosition); // Truncamiento físico
            }
        } catch (Exception e) {
            // Manejar error de lectura forense
        }
        return lastHash;
    }

    private int calculateCRC32(byte[] data) {
        java.util.zip.CRC32 crc = new java.util.zip.CRC32();
        crc.update(data);
        return (int) crc.getValue();
    }
}
```

---

## Paso 6: Escritor Secuencial con Backpressure (`AuditFileWriter.java`)

Implementa el patrón **Single-Writer Thread** usando una cola acotada en memoria y un hilo de fondo dedicado, evitando colisiones del filesystem y bloqueos transaccionales:

```java
package tu.proyecto.service.audit;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class AuditFileWriter {

    private final LinkedBlockingQueue<byte[]> queue = new LinkedBlockingQueue<>(50000); // Límite para evitar OOM
    private final ExecutorService writerExecutor = Executors.newSingleThreadExecutor(); // Hilo exclusivo secuencial
    private final Path logDir = Path.of("./runtime/.sync/");
    private FileOutputStream fileStream;
    private Path activeFile;

    public AuditFileWriter() {
        try {
            Files.createDirectories(logDir);
            activeFile = logDir.resolve("audit-active.dat");
            fileStream = new FileOutputStream(activeFile.toFile(), true);
            
            // Arrancar el Single-Writer Thread
            writerExecutor.submit(this::processQueue);
        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar escritor forense", e);
        }
    }

    public void enqueue(byte[] frame) {
        boolean accepted = queue.offer(frame); // No bloqueante
        if (!accepted) {
            System.err.println("CRITICAL WARNING: Cola forense saturada. Descartando log en memoria para evitar crash!");
        }
    }

    private void processQueue() {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                byte[] frame = queue.take(); // Bloqueante si la cola está vacía
                fileStream.write(frame);
                fileStream.flush(); // Flush físico a disco inmediato por bloque
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            // Manejo crítico de error de escritura
        }
    }

    @PreDestroy
    public void shutdownAndFlush() {
        writerExecutor.shutdown();
        try {
            if (!writerExecutor.awaitTermination(3, TimeUnit.SECONDS)) {
                writerExecutor.shutdownNow();
            }
            
            // Drenar cola restante de forma síncrona
            while (!queue.isEmpty()) {
                byte[] frame = queue.poll();
                if (frame != null) {
                    fileStream.write(frame);
                }
            }
            fileStream.flush();
            fileStream.close();
            
            // Comprimir el log en GZIP de forma asíncrona tras cierre
            Path closedFile = logDir.resolve("audit-" + System.currentTimeMillis() + ".dat");
            Files.move(activeFile, closedFile);
            compressGZIP(closedFile);
        } catch (Exception e) {
            // Manejo de error de apagado
        }
    }

    private void compressGZIP(Path source) {
        Path target = Path.of(source.toString() + ".gz");
        try (java.io.InputStream in = Files.newInputStream(source);
             java.io.OutputStream out = new java.util.zip.GZIPOutputStream(Files.newOutputStream(target))) {
            in.transferTo(out);
            Files.delete(source); // Borrar el original plano cerrado
        } catch (Exception e) {
            // Error en compresión
        }
    }
}
```

---

## Paso 7: Diagnóstico de Integridad Criptográfica (`AuditIntegrityVerifier.java`)

Clase utilitaria de nivel forense para verificar de inicio a fin la inalterabilidad de los archivos:

```java
package tu.proyecto.service.audit;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

public class AuditIntegrityVerifier {

    public static void verifyFile(Path filePath, AuditCryptoService cryptoService, AuditHashChainService hashChainService) {
        byte[] expectedPrevHash = new byte[32]; // Semilla inicial cero
        int blockCount = 0;

        try (DataInputStream in = new DataInputStream(new BufferedInputStream(Files.newInputStream(filePath)))) {
            while (in.available() > 0) {
                blockCount++;
                int magic = in.readInt();
                if (magic != 0xCAFE0A0D) {
                    throw new SecurityException("Bloque #" + blockCount + ": Magic Bytes corruptos. Archivo alterado!");
                }

                byte version = in.readByte();
                byte suite = in.readByte();
                int frameLength = in.readInt();

                byte[] frameContent = new byte[frameLength - 4]; // Resto del frame excluyendo el CRC32
                in.readFully(frameContent);
                int crcStored = in.readInt();

                // Reconstruir estructura de validación
                ByteBuffer buffer = ByteBuffer.allocate(4 + 1 + 1 + 4 + frameContent.length);
                buffer.putInt(magic).put(version).put(suite).putInt(frameLength).put(frameContent);
                byte[] fullFrameCalculated = buffer.array();
                
                int crcCalculated = calculateCRC32(Arrays.copyOf(fullFrameCalculated, fullFrameCalculated.length - 4));
                if (crcCalculated != crcStored) {
                    throw new SecurityException("Bloque #" + blockCount + ": Fallo en checksum CRC32. Corrupción física!");
                }

                // Validar firma HMAC
                int hmacOffset = frameContent.length - 32;
                byte[] dataToSign = Arrays.copyOfRange(frameContent, 0, hmacOffset);
                byte[] signature = Arrays.copyOfRange(frameContent, hmacOffset, frameContent.length);
                
                // Reconstruir campos del bloque
                byte[] magicHeader = ByteBuffer.allocate(10)
                        .putInt(magic).put(version).put(suite).putInt(frameLength).array();
                ByteBuffer signBuffer = ByteBuffer.allocate(10 + dataToSign.length);
                signBuffer.put(magicHeader).put(dataToSign);

                if (!cryptoService.verifyHMAC(signBuffer.array(), signature)) {
                    throw new SecurityException("Bloque #" + blockCount + ": Fallo de firma HMAC. Evidencia alterada internamente!");
                }

                // Desarmar offsets para verificar el Hash Chain
                int ivLenPosition = 8; // Offset tras Timestamp (Long)
                int ivLength = dataToSign[ivLenPosition] & 0xFF;
                int hashPrevOffset = ivLenPosition + 1 + ivLength;
                int hashActualOffset = hashPrevOffset + 32;
                int payloadOffset = hashActualOffset + 32;

                byte[] prevHashStored = Arrays.copyOfRange(dataToSign, hashPrevOffset, hashActualOffset);
                byte[] actualHashStored = Arrays.copyOfRange(dataToSign, hashActualOffset, payloadOffset);
                byte[] encryptedPayload = Arrays.copyOfRange(dataToSign, payloadOffset, dataToSign.length);
                
                long timestamp = ByteBuffer.wrap(dataToSign, 0, 8).getLong();

                if (!Arrays.equals(expectedPrevHash, prevHashStored)) {
                    throw new SecurityException("Bloque #" + blockCount + ": Cadena rota! El hash anterior almacenado no coincide.");
                }

                // Recalcular hash chain
                byte[] calculatedHash = hashChainService.calculateNextHash(expectedPrevHash, encryptedPayload, timestamp);
                if (!Arrays.equals(calculatedHash, actualHashStored)) {
                    throw new SecurityException("Bloque #" + blockCount + ": Cadena rota! El hash actual recalculado difiere.");
                }

                expectedPrevHash = actualHashStored; // Actualizar semilla
            }
            System.out.println("INTEGRITY CONFIRMED: Archivo verificado con éxito de inicio a fin. Cero alteraciones!");
        } catch (Exception e) {
            System.err.println("CRITICAL EXCEPTION IN FORENSIC CHECK: " + e.getMessage());
        }
    }

    private static int calculateCRC32(byte[] data) {
        java.util.zip.CRC32 crc = new java.util.zip.CRC32();
        crc.update(data);
        return (int) crc.getValue();
    }
}
```

---

## Paso 8: Directrices de Integración de Negocio y Seguridad en Producción

Al integrar los flujos transaccionales del negocio con el `AuditService`, se deben seguir de forma estricta las siguientes directrices de ingeniería de software para prevenir fallos de concurrencia, degradación de rendimiento y strings mágicos.

### 1. Centralización de Llaves de Metadata (Cero Strings Mágicos)
Todos los metadatos inyectados en el mapa de auditoría del negocio deben definirse en una clase central de constantes (ej: `AuditConstants.java`). Queda estrictamente prohibido el uso de strings directos en las llaves del mapa de auditoría.
*   **Correcto**: `Map.of(AuditConstants.KEY_SERVICIO_ID, savedCita.getServicioId())`
*   **Incorrecto**: `Map.of("servicioId", savedCita.getServicioId())`

### 2. Acoplamiento Estricto para el Control de Reintentos (Mitigación de Concurrencia 2FA)
Cuando se verifiquen e incrementen intentos fallidos de autenticación 2FA para el mismo usuario, el repositorio y el servicio de tokens **deben acoplarse estrictamente** al flujo de negocio específico (ej: `correo`, `sedeId` y `servicioId`).
*   **El Riesgo Concurrente**: Si un ciudadano solicita concurrentemente tokens para trámites en sedes distintas, una consulta genérica basada únicamente en el correo penalizará incorrectamente al token del flujo equivocado.
*   **Implementación Fuerte**: Validar con `IllegalArgumentException` que los identificadores de relación no sean nulos, evitando el uso de "fallbacks" imprecisos que oculten bugs transaccionales.

### 3. Prevención de Out of Memory (OOM) en Auditoría de Lecturas
Queda prohibido implementar endpoints masivos no paginados ni acotados en el tiempo que recuperen volúmenes masivos de datos personales para su visualización o listado.
*   **El Impacto en Producción**: Cargar en memoria miles de registros históricos mapeándolos a DTOs con generación síncrona de imágenes Base64 (ej: códigos QR) provocará el agotamiento del Heap Space de la JVM y caídas inmediatas del microservicio.
*   **Práctica Correcta**: Si el frontend no consume o requiere un listado de lectura masiva histórica, la lógica del endpoint, servicio y consultas de BD asociadas debe ser erradicada en su totalidad del repositorio para mantener el código de producción limpio de código muerto y mitigar riesgos de denegación de servicio.

### 4. Optimización de Índices de Base de Datos para Alta Escritura (Evitar GIN genérico)
En tablas con un perfil de **alta escritura** y consultas esporádicas y estructuradas (como las tablas de auditoría de negocio), queda desaconsejado el uso de índices GIN dinámicos genéricos sobre toda la columna `JSONB` de metadatos.
*   **El Riesgo de Rendimiento**: Los índices GIN ralentizan severamente cada inserción (`INSERT`), multiplican el tamaño en disco de la base de datos (generando *bloat*) y desalojan de la RAM (`shared_buffers`) datos calientes críticos del negocio.
*   **Práctica Correcta (B-Tree Expresional Parcial)**: Crea índices estándar B-Tree específicos mapeados únicamente a las llaves o rutas más consultadas del JSON, agregando una cláusula parcial `WHERE ... IS NOT NULL`.
*   **Ejemplo SQL**:
    ```sql
    CREATE INDEX idx_trazabilidad_meta_correo 
    ON trazabilidad_negocio ((metadata->>'correoCiudadano')) 
    WHERE (metadata->>'correoCiudadano') IS NOT NULL;
    ```
    Esto garantiza inserciones ultraligeras sin overhead y búsquedas instantáneas en milisegundos para soporte técnico.


