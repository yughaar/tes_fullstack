package handlers

import (
	"fleetify/repositories"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	repo *repositories.UserRepository
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		repo: repositories.NewUserRepository(),
	}
}

// GetAllUsers returns all users
func (h *UserHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.repo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}
	return c.JSON(fiber.Map{"data": users})
}

// GetCurrentUser returns the authenticated user info
func (h *UserHandler) GetCurrentUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	user, err := h.repo.FindByID(userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}
	return c.JSON(fiber.Map{"data": user})
}
