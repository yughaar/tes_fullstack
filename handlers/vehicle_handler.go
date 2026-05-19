package handlers

import (
	"fleetify/repositories"

	"github.com/gofiber/fiber/v2"
)

type VehicleHandler struct {
	repo *repositories.VehicleRepository
}

func NewVehicleHandler() *VehicleHandler {
	return &VehicleHandler{
		repo: repositories.NewVehicleRepository(),
	}
}

// GetAllVehicles returns all vehicles
func (h *VehicleHandler) GetAllVehicles(c *fiber.Ctx) error {
	vehicles, err := h.repo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch vehicles",
		})
	}
	return c.JSON(fiber.Map{"data": vehicles})
}
