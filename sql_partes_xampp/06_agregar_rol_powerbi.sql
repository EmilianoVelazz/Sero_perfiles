-- Ejecuta este archivo UNA vez en instalaciones existentes.
-- Agrega el perfil exclusivo para generar y consultar reportes de Power BI.

USE registro_seroperfiles;

ALTER TABLE usuarios
  MODIFY rol ENUM('admin', 'analista', 'consulta', 'powerbi')
  NOT NULL DEFAULT 'analista';
