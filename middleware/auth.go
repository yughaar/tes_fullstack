package middleware

import (
	"fleetify/repositories"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

var userRepo = repositories.NewUserRepository()

// AuthMiddleware validates X-User-ID header and attaches user info to context
func AuthMiddleware(c *fiber.Ctx) error {
	userIDStr := c.Get("X-User-ID")
	if userIDStr == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "X-User-ID header is required",
		})
	}

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid X-User-ID format",
		})
	}

	user, err := userRepo.FindByID(uint(userID))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Store user info in context locals
	c.Locals("userID", user.ID)
	c.Locals("userRole", user.Role)
	c.Locals("username", user.Username)

	return c.Next()
}

// RoleGuard creates a middleware that restricts access to specific roles
func RoleGuard(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("userRole").(string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Access denied",
			})
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied. Required role: " + joinRoles(allowedRoles),
		})
	}
}

func joinRoles(roles []string) string {
	result := ""
	for i, r := range roles {
		if i > 0 {
			result += " or "
		}
		result += r
	}
	return result
}
