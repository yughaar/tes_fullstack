package repositories

import (
	"fleetify/config"
	"fleetify/models"
)

type VehicleRepository struct{}

func NewVehicleRepository() *VehicleRepository {
	return &VehicleRepository{}
}

func (r *VehicleRepository) FindAll() ([]models.Vehicle, error) {
	var vehicles []models.Vehicle
	result := config.DB.Find(&vehicles)
	return vehicles, result.Error
}

func (r *VehicleRepository) FindByID(id uint) (*models.Vehicle, error) {
	var vehicle models.Vehicle
	result := config.DB.First(&vehicle, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &vehicle, nil
}
