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

	// Reports
	protected.Get("/reports", reportHandler.GetAllReports)
	protected.Get("/reports/:id", reportHandler.GetReportByID)

	// SA-only routes
	saRoutes := protected.Group("", middleware.RoleGuard("SA"))
	saRoutes.Post("/reports", reportHandler.CreateReport)
	saRoutes.Put("/reports/:id/complete", reportHandler.CompleteReport)

	// Approval-only routes
	approvalRoutes := protected.Group("", middleware.RoleGuard("APPROVAL"))
	approvalRoutes.Put("/reports/:id/approve", reportHandler.ApproveReport)
}
