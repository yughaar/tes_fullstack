package models

import "time"

type Vehicle struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	LicensePlate string    `json:"license_plate" gorm:"type:varchar(20);uniqueIndex;not null"`
	Model        string    `json:"model" gorm:"type:varchar(100);not null"`
	CreatedAt    time.Time `json:"created_at"`
}

func (Vehicle) TableName() string {
	return "vehicles"
}
