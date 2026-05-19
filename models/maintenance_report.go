package models

import "time"

type MaintenanceReport struct {
	ID           uint         `json:"id" gorm:"primaryKey"`
	VehicleID    uint         `json:"vehicle_id" gorm:"not null;index"`
	CreatedBy    uint         `json:"created_by" gorm:"not null;index"`
	Odometer     int          `json:"odometer" gorm:"not null"`
	Complaint    string       `json:"complaint" gorm:"type:text;not null"`
	Status       string       `json:"status" gorm:"type:enum('PENDING_APPROVAL','APPROVED','COMPLETED');default:'PENDING_APPROVAL';not null"`
	InitialPhoto string       `json:"initial_photo" gorm:"type:varchar(500)"`
	ProofPhoto   string       `json:"proof_photo" gorm:"type:varchar(500)"`
	CreatedAt    time.Time    `json:"created_at"`

	// Relations
	Vehicle    Vehicle      `json:"vehicle" gorm:"foreignKey:VehicleID;constraint:OnDelete:RESTRICT"`
	Creator    User         `json:"creator" gorm:"foreignKey:CreatedBy;constraint:OnDelete:RESTRICT"`
	Items      []ReportItem `json:"items" gorm:"foreignKey:ReportID;constraint:OnDelete:CASCADE"`
}

func (MaintenanceReport) TableName() string {
	return "maintenance_reports"
}
