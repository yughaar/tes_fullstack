package seeders

import (
	"fleetify/config"
	"fleetify/models"
	"log"
)

func Run() {
	db := config.DB

	// Auto-migrate tables
	err := db.AutoMigrate(
		&models.User{},
		&models.Vehicle{},
		&models.MasterItem{},
		&models.MaintenanceReport{},
		&models.ReportItem{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}
	log.Println("Database migrated successfully")

	// Seed Users (only if table is empty)
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		users := []models.User{
			{Username: "budi_sa", Role: "SA"},
			{Username: "manager_andi", Role: "APPROVAL"},
		}
		db.Create(&users)
		log.Println("Seeded users")
	}

	// Seed Vehicles (only if table is empty)
	var vehicleCount int64
	db.Model(&models.Vehicle{}).Count(&vehicleCount)
	if vehicleCount == 0 {
		vehicles := []models.Vehicle{
			{LicensePlate: "B 1234 XYZ", Model: "Toyota Avanza 2022"},
			{LicensePlate: "B 5678 ABC", Model: "Mitsubishi L300 2021"},
			{LicensePlate: "D 9012 DEF", Model: "Isuzu Elf NMR 2023"},
		}
		db.Create(&vehicles)
		log.Println("Seeded vehicles")
	}

	// Seed Master Items (only if table is empty)
	var itemCount int64
	db.Model(&models.MasterItem{}).Count(&itemCount)
	if itemCount == 0 {
		items := []models.MasterItem{
			{ItemName: "Oli Mesin SAE 10W-40", Type: "PART", Price: 350000},
			{ItemName: "Filter Oli", Type: "PART", Price: 85000},
			{ItemName: "Kampas Rem Depan", Type: "PART", Price: 275000},
			{ItemName: "Jasa Ganti Oli", Type: "SERVICE", Price: 50000},
			{ItemName: "Jasa Tune Up Mesin", Type: "SERVICE", Price: 250000},
		}
		db.Create(&items)
		log.Println("Seeded master items")
	}

	log.Println("Seeder completed")
}
