package routes

import (
	"fleetify/handlers"
	"fleetify/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	// Initialize handlers
	userHandler := handlers.NewUserHandler()
	vehicleHandler := handlers.NewVehicleHandler()
	masterItemHandler := handlers.NewMasterItemHandler()
	reportHandler := handlers.NewReportHandler()

	// API group
	api := app.Group("/api")

	// Public routes (for user selection on login)
	api.Get("/users", userHandler.GetAllUsers)

	// Protected routes (require X-User-ID header)
	protected := api.Group("", middleware.AuthMiddleware)

	// Current user
	protected.Get("/me", userHandler.GetCurrentUser)

	// Vehicles (accessible by all authenticated users)
	protected.Get("/vehicles", vehicleHandler.GetAllVehicles)

	// Master Items (accessible by all authenticated users)
	protected.Get("/master-items", masterItemHandler.GetAllItems)

	// Reports - accessible by all authenticated users
	protected.Get("/reports", reportHandler.GetAllReports)
	protected.Get("/reports/:id", reportHandler.GetReportByID)

	// SA-only routes (inline role guard)
	protected.Post("/reports", middleware.RoleGuard("SA"), reportHandler.CreateReport)
	protected.Put("/reports/:id/complete", middleware.RoleGuard("SA"), reportHandler.CompleteReport)

	// Approval-only routes (inline role guard)
	protected.Put("/reports/:id/approve", middleware.RoleGuard("APPROVAL"), reportHandler.ApproveReport)
}
