import datetime
import math
from pathlib import Path

import openpyxl


WORKBOOK = Path(r"C:\Users\JonathanEmirLópezVel\Desktop\BD Dx Seoroperfiles_para Power BI_1 - revisado.xlsx")
OUTPUT = Path(r"C:\Users\JonathanEmirLópezVel\Desktop\Resgistro\schema_y_datos_seroperfiles.sql")
SHEET_NAME = "Acumulado (2)"

COLS = [
    "fecha",
    "semana",
    "trimestre",
    "anio",
    "razon",
    "empresa",
    "flujo",
    "granja",
    "caseta",
    "lote",
    "funcion",
    "edad",
    "identidad",
    "muestra",
    "laboratorio",
    "no_caso",
    "num_muestras",
    "enfermedad",
    "tecnica",
    "resultado",
    "punto_corte",
    "interpretacion",
    "comentarios",
]

NUMERIC_COLS = {"semana", "trimestre", "anio", "edad", "num_muestras", "resultado", "punto_corte"}
INTEGER_COLS = {"semana", "trimestre", "anio", "num_muestras"}


def clean_text(value):
    return str(value).replace("\\", "\\\\").replace("'", "''").strip()


def sql_value(value, column):
    if value is None or value == "":
        return "NULL"

    if column == "fecha":
        if isinstance(value, datetime.datetime):
            return f"'{value.date().isoformat()}'"
        if isinstance(value, datetime.date):
            return f"'{value.isoformat()}'"
        return f"'{clean_text(value)[:10]}'"

    if column in NUMERIC_COLS:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return "NULL"

        if math.isnan(number) or math.isinf(number):
            return "NULL"
        if column in INTEGER_COLS:
            return str(int(round(number)))
        return (f"{number:.4f}").rstrip("0").rstrip(".")

    return f"'{clean_text(value)}'"


def write_insert(file_handle, batch):
    file_handle.write("INSERT INTO seroperfiles (\n  ")
    file_handle.write(", ".join(COLS))
    file_handle.write(", creado_por\n) VALUES\n")
    file_handle.write(",\n".join(batch))
    file_handle.write(";\n\n")


def main():
    workbook = openpyxl.load_workbook(WORKBOOK, read_only=True, data_only=True)
    worksheet = workbook[SHEET_NAME]

    count = 0
    batch = []

    with OUTPUT.open("w", encoding="utf-8", newline="\n") as file_handle:
        file_handle.write("-- Base de datos completa generada desde: BD Dx Seoroperfiles_para Power BI_1 - revisado.xlsx\n")
        file_handle.write("-- Puedes importar este archivo completo en XAMPP / phpMyAdmin.\n\n")
        file_handle.write(
            "CREATE DATABASE IF NOT EXISTS registro_seroperfiles\n"
            "  CHARACTER SET utf8mb4\n"
            "  COLLATE utf8mb4_unicode_ci;\n\n"
            "USE registro_seroperfiles;\n\n"
            "CREATE TABLE IF NOT EXISTS usuarios (\n"
            "  id INT AUTO_INCREMENT PRIMARY KEY,\n"
            "  nombre VARCHAR(120) NOT NULL,\n"
            "  correo VARCHAR(160) NOT NULL UNIQUE,\n"
            "  password_hash VARCHAR(255) NOT NULL,\n"
            "  rol ENUM('admin', 'analista', 'consulta') NOT NULL DEFAULT 'analista',\n"
            "  activo TINYINT(1) NOT NULL DEFAULT 1,\n"
            "  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"
            ");\n\n"
            "CREATE TABLE IF NOT EXISTS seroperfiles (\n"
            "  id INT AUTO_INCREMENT PRIMARY KEY,\n"
            "  fecha DATE NOT NULL,\n"
            "  semana INT NULL,\n"
            "  trimestre INT NULL,\n"
            "  anio INT NULL,\n"
            "  razon VARCHAR(100) DEFAULT 'Seroperfil',\n"
            "  empresa VARCHAR(120) NOT NULL,\n"
            "  flujo VARCHAR(120) NULL,\n"
            "  granja VARCHAR(180) NOT NULL,\n"
            "  caseta VARCHAR(80) NULL,\n"
            "  lote VARCHAR(100) NULL,\n"
            "  funcion VARCHAR(100) NULL,\n"
            "  edad DECIMAL(8,2) NULL,\n"
            "  identidad VARCHAR(100) NULL,\n"
            "  muestra VARCHAR(100) DEFAULT 'Suero',\n"
            "  laboratorio VARCHAR(120) NULL,\n"
            "  no_caso VARCHAR(120) NULL,\n"
            "  num_muestras INT NULL,\n"
            "  enfermedad VARCHAR(140) NOT NULL,\n"
            "  tecnica VARCHAR(100) NULL,\n"
            "  resultado DECIMAL(12,4) NULL,\n"
            "  punto_corte DECIMAL(12,4) NULL,\n"
            "  interpretacion VARCHAR(80) NULL,\n"
            "  comentarios TEXT NULL,\n"
            "  creado_por INT NULL,\n"
            "  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
            "  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n"
            "  KEY idx_fecha (fecha),\n"
            "  KEY idx_empresa (empresa),\n"
            "  KEY idx_flujo (flujo),\n"
            "  KEY idx_granja (granja),\n"
            "  KEY idx_enfermedad (enfermedad),\n"
            "  KEY idx_laboratorio (laboratorio),\n"
            "  KEY idx_anio_trimestre (anio, trimestre),\n"
            "  CONSTRAINT fk_seroperfiles_usuario\n"
            "    FOREIGN KEY (creado_por) REFERENCES usuarios(id)\n"
            "    ON DELETE SET NULL\n"
            ");\n\n"
        )
        file_handle.write("SET FOREIGN_KEY_CHECKS = 0;\n")
        file_handle.write("TRUNCATE TABLE seroperfiles;\n")
        file_handle.write("SET FOREIGN_KEY_CHECKS = 1;\n\n")
        file_handle.write(
            "INSERT IGNORE INTO usuarios (id, nombre, correo, password_hash, rol)\n"
            "VALUES (1, 'Administrador', 'admin@empresa.com', 'scrypt$f7d96bb2d6b24a945e1f4146e11ee678$246e544d96b3446c38d69770a82706b908fda10132f320c3b9e77d9738ae1f95559b0392e6080fe34a5571a5670fdf4356dce3ad42889580c0c6ae2db50de4fd', 'admin');\n\n"
        )

        for row in worksheet.iter_rows(min_row=3, max_col=23, values_only=True):
            if not any(value not in (None, "") for value in row):
                continue

            values = [sql_value(row[index], COLS[index]) for index in range(len(COLS))]
            batch.append("(" + ", ".join(values) + ", 1)")
            count += 1

            if len(batch) >= 400:
                write_insert(file_handle, batch)
                batch = []

        if batch:
            write_insert(file_handle, batch)

        file_handle.write(f"-- Total de filas importadas desde Excel: {count}\n")

    print(OUTPUT)
    print(count)


if __name__ == "__main__":
    main()
