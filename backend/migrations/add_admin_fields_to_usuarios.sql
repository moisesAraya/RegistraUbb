-- Migración para agregar campos de administración a la tabla Usuarios

-- Agregar columnas para gestión administrativa
ALTER TABLE "Usuarios" 
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "departamento" VARCHAR(255) DEFAULT 'Sistemas de Información',
ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Crear índices para mejorar rendimiento en consultas
CREATE INDEX idx_usuarios_isactive ON "Usuarios"("isActive");
CREATE INDEX idx_usuarios_departamento ON "Usuarios"("departamento");
CREATE INDEX idx_usuarios_created_at ON "Usuarios"("createdAt");

-- Actualizar timestamps para registros existentes (opcional)
-- UPDATE "Usuarios" 
-- SET "createdAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP 
-- WHERE "createdAt" IS NULL OR "updatedAt" IS NULL;