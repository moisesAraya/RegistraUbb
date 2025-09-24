-- Migración para agregar campos de aprobación a la tabla Justificacion

ALTER TABLE "Justificacions" 
ADD COLUMN "observaciones_admin" TEXT,
ADD COLUMN "aprobado_por" VARCHAR(255),
ADD COLUMN "rechazado_por" VARCHAR(255),
ADD COLUMN "fecha_aprobacion" TIMESTAMP WITH TIME ZONE,
ADD COLUMN "fecha_rechazo" TIMESTAMP WITH TIME ZONE;

-- Agregar restricciones de clave foránea
ALTER TABLE "Justificacions"
ADD CONSTRAINT "fk_justificacion_aprobado_por" 
FOREIGN KEY ("aprobado_por") REFERENCES "Usuarios"("rut_usuario");

ALTER TABLE "Justificacions"
ADD CONSTRAINT "fk_justificacion_rechazado_por" 
FOREIGN KEY ("rechazado_por") REFERENCES "Usuarios"("rut_usuario");

-- Actualizar valores por defecto para estado si es necesario
UPDATE "Justificacions" 
SET "estado" = 'PENDIENTE' 
WHERE "estado" NOT IN ('PENDIENTE', 'APROBADO', 'RECHAZADO');