package models

import "time"

type MasterItem struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	ItemName  string    `json:"item_name" gorm:"type:varchar(200);not null"`
	Type      string    `json:"type" gorm:"type:enum('PART','SERVICE');not null"`
	Price     float64   `json:"price" gorm:"type:decimal(15,2);not null"`
	CreatedAt time.Time `json:"created_at"`
}

func (MasterItem) TableName() string {
	return "master_items"
}
