package models

type ReportItem struct {
	ID            uint    `json:"id" gorm:"primaryKey"`
	ReportID      uint    `json:"report_id" gorm:"not null;index"`
	ItemID        uint    `json:"item_id" gorm:"not null;index"`
	Quantity      int     `json:"quantity" gorm:"not null"`
	PriceSnapshot float64 `json:"price_snapshot" gorm:"type:decimal(15,2);not null"`

	// Relations
	Item MasterItem `json:"item" gorm:"foreignKey:ItemID;constraint:OnDelete:RESTRICT"`
}

func (ReportItem) TableName() string {
	return "report_items"
}
