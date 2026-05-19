package repositories

import (
	"fleetify/config"
	"fleetify/models"
)

type MasterItemRepository struct{}

func NewMasterItemRepository() *MasterItemRepository {
	return &MasterItemRepository{}
}

func (r *MasterItemRepository) FindAll() ([]models.MasterItem, error) {
	var items []models.MasterItem
	result := config.DB.Find(&items)
	return items, result.Error
}

func (r *MasterItemRepository) FindByID(id uint) (*models.MasterItem, error) {
	var item models.MasterItem
	result := config.DB.First(&item, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &item, nil
}
