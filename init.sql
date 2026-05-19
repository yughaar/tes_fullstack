-- Fleetify Database Initialization Script
-- This script runs automatically when the MySQL container starts for the first time

CREATE DATABASE IF NOT EXISTS fleetify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fleetify;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('SA', 'APPROVAL') NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Master Items table
CREATE TABLE IF NOT EXISTS master_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(200) NOT NULL,
    type ENUM('PART', 'SERVICE') NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Reports table
CREATE TABLE IF NOT EXISTS maintenance_reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    odometer INT NOT NULL,
    complaint TEXT NOT NULL,
    status ENUM('PENDING_APPROVAL', 'APPROVED', 'COMPLETED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    initial_photo VARCHAR(500),
    proof_photo VARCHAR(500),
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_vehicle_id (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Items table
CREATE TABLE IF NOT EXISTS report_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT UNSIGNED NOT NULL,
    item_id BIGINT UNSIGNED NOT NULL,
    quantity INT NOT NULL,
    price_snapshot DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (report_id) REFERENCES maintenance_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES master_items(id) ON DELETE RESTRICT,
    INDEX idx_report_id (report_id),
    INDEX idx_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Data
INSERT IGNORE INTO users (id, username, role) VALUES
(1, 'budi_sa', 'SA'),
(2, 'manager_andi', 'APPROVAL');

INSERT IGNORE INTO vehicles (id, license_plate, model) VALUES
(1, 'B 1234 XYZ', 'Toyota Avanza 2022'),
(2, 'B 5678 ABC', 'Mitsubishi L300 2021'),
(3, 'D 9012 DEF', 'Isuzu Elf NMR 2023');

INSERT IGNORE INTO master_items (id, item_name, type, price) VALUES
(1, 'Oli Mesin SAE 10W-40', 'PART', 350000.00),
(2, 'Filter Oli', 'PART', 85000.00),
(3, 'Kampas Rem Depan', 'PART', 275000.00),
(4, 'Jasa Ganti Oli', 'SERVICE', 50000.00),
(5, 'Jasa Tune Up Mesin', 'SERVICE', 250000.00);
