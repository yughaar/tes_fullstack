package handlers

import (
	"fleetify/repositories"

	"github.com/gofiber/fiber/v2"
)

type MasterItemHandler struct {
	repo *repositories.MasterItemRepository
}

func NewMasterItemHandler() *MasterItemHandler {
	return &MasterItemHandler{
		repo: repositories.NewMasterItemRepository(),
	}
}

// GetAllItems returns all master items
func (h *MasterItemHandler) GetAllItems(c *fiber.Ctx) error {
	items, err := h.repo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch items",
		})
	}
	return c.JSON(fiber.Map{"data": items})
}
