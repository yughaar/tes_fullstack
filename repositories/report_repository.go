package repositories

import (
	"fleetify/config"
	"fleetify/models"

	"gorm.io/gorm"
)

type ReportRepository struct{}

func NewReportRepository() *ReportRepository {
	return &ReportRepository{}
}

func (r *ReportRepository) Create(report *models.MaintenanceReport, items []models.ReportItem) error {
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// Create the report header
		if err := tx.Create(report).Error; err != nil {
			return err
		}

		// Set report_id for each item and create them
		for i := range items {
			items[i].ReportID = report.ID
		}

		if len(items) > 0 {
			if err := tx.Create(&items).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *ReportRepository) FindAll() ([]models.MaintenanceReport, error) {
	var reports []models.MaintenanceReport
	result := config.DB.
		Preload("Vehicle").
		Preload("Creator").
		Preload("Items").
		Preload("Items.Item").
		Order("created_at DESC").
		Find(&reports)
	return reports, result.Error
}

func (r *ReportRepository) FindByID(id uint) (*models.MaintenanceReport, error) {
	var report models.MaintenanceReport
	result := config.DB.
		Preload("Vehicle").
		Preload("Creator").
		Preload("Items").
		Preload("Items.Item").
		First(&report, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &report, nil
}

func (r *ReportRepository) UpdateStatus(id uint, status string) error {
	return config.DB.Model(&models.MaintenanceReport{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *ReportRepository) UpdateProofPhoto(id uint, proofPhoto string) error {
	return config.DB.Model(&models.MaintenanceReport{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"proof_photo": proofPhoto,
			"status":      "COMPLETED",
		}).Error
}
