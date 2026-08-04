-- Base de datos completa generada desde: BD Dx Seoroperfiles_para Power BI_1 - revisado.xlsx
-- Puedes importar este archivo completo en XAMPP / phpMyAdmin.

CREATE DATABASE IF NOT EXISTS registro_seroperfiles
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE registro_seroperfiles;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'analista', 'consulta') NOT NULL DEFAULT 'analista',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seroperfiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  semana INT NULL,
  trimestre INT NULL,
  anio INT NULL,
  razon VARCHAR(100) DEFAULT 'Seroperfil',
  empresa VARCHAR(120) NOT NULL,
  flujo VARCHAR(120) NULL,
  granja VARCHAR(180) NOT NULL,
  caseta VARCHAR(80) NULL,
  lote VARCHAR(100) NULL,
  funcion VARCHAR(100) NULL,
  edad DECIMAL(8,2) NULL,
  identidad VARCHAR(100) NULL,
  muestra VARCHAR(100) DEFAULT 'Suero',
  laboratorio VARCHAR(120) NULL,
  no_caso VARCHAR(120) NULL,
  num_muestras INT NULL,
  enfermedad VARCHAR(140) NOT NULL,
  tecnica VARCHAR(100) NULL,
  resultado DECIMAL(12,4) NULL,
  punto_corte DECIMAL(12,4) NULL,
  interpretacion VARCHAR(80) NULL,
  comentarios TEXT NULL,
  creado_por INT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_fecha (fecha),
  KEY idx_empresa (empresa),
  KEY idx_flujo (flujo),
  KEY idx_granja (granja),
  KEY idx_enfermedad (enfermedad),
  KEY idx_laboratorio (laboratorio),
  KEY idx_anio_trimestre (anio, trimestre),
  CONSTRAINT fk_seroperfiles_usuario
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
    ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE seroperfiles;
SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO usuarios (id, nombre, correo, password_hash, rol)
VALUES (1, 'Administrador', 'admin@empresa.com', 'scrypt$f7d96bb2d6b24a945e1f4146e11ee678$246e544d96b3446c38d69770a82706b908fda10132f320c3b9e77d9738ae1f95559b0392e6080fe34a5571a5670fdf4356dce3ad42889580c0c6ae2db50de4fd', 'admin');

