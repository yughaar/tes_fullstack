package handlers

import (
	"encoding/json"
	"fleetify/models"
	"fleetify/repositories"
	"fleetify/webhook"
	"fmt"
	"path/filepath"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ReportHandler struct {
	reportRepo *repositories.ReportRepository
	itemRepo   *repositories.MasterItemRepository
}

func NewReportHandler() *ReportHandler {
	return &ReportHandler{
		reportRepo: repositories.NewReportRepository(),
		itemRepo:   repositories.NewMasterItemRepository(),
	}
}

// CreateReportRequest represents the request body for creating a report
type CreateReportRequest struct {
	VehicleID uint              `json:"vehicle_id"`
	Odometer  int               `json:"odometer"`
	Complaint string            `json:"complaint"`
	Items     []ReportItemInput `json:"items"`
}

type ReportItemInput struct {
	ItemID   uint `json:"item_id"`
	Quantity int  `json:"quantity"`
}

// CreateReport handles F-01: SA creates a new maintenance report
func (h *ReportHandler) CreateReport(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var req CreateReportRequest

	// Parse form fields (multipart/form-data)
	vehicleIDStr := c.FormValue("vehicle_id")
	odometerStr := c.FormValue("odometer")
	complaint := c.FormValue("complaint")
	itemsJSON := c.FormValue("items")

	if vehicleIDStr != "" {
		// Parse from form values
		var vehicleID uint
		fmt.Sscanf(vehicleIDStr, "%d", &vehicleID)
		req.VehicleID = vehicleID

		var odometer int
		fmt.Sscanf(odometerStr, "%d", &odometer)
		req.Odometer = odometer
		req.Complaint = complaint

		// Parse items JSON
		if itemsJSON != "" {
			if err := json.Unmarshal([]byte(itemsJSON), &req.Items); err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Invalid items format",
				})
			}
		}
	} else {
		// Try JSON body
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request body",
			})
		}
	}

	// Validate required fields
	if req.VehicleID == 0 || req.Odometer <= 0 || req.Complaint == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "vehicle_id, odometer, and complaint are required",
		})
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "At least one item is required",
		})
	}

	// Handle initial photo upload
	initialPhoto := ""
	file, err := c.FormFile("initial_photo")
	if err == nil && file != nil {
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("uploads/initial_%s%s", uuid.New().String(), ext)
		if err := c.SaveFile(file, "./frontend/"+filename); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to save initial photo",
			})
		}
		initialPhoto = filename
	}

	// Build report items with price snapshot from master_items
	var reportItems []models.ReportItem
	for _, item := range req.Items {
		masterItem, err := h.itemRepo.FindByID(item.ItemID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fmt.Sprintf("Item with ID %d not found", item.ItemID),
			})
		}

		reportItems = append(reportItems, models.ReportItem{
			ItemID:        item.ItemID,
			Quantity:      item.Quantity,
			PriceSnapshot: masterItem.Price, // Snapshot current price
		})
	}

	// Create report with PENDING_APPROVAL status
	report := &models.MaintenanceReport{
		VehicleID:    req.VehicleID,
		CreatedBy:    userID,
		Odometer:     req.Odometer,
		Complaint:    req.Complaint,
		Status:       "PENDING_APPROVAL",
		InitialPhoto: initialPhoto,
	}

	// Use atomic transaction to save header + detail
	if err := h.reportRepo.Create(report, reportItems); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create report: " + err.Error(),
		})
	}

	// Fetch complete report with relations
	createdReport, _ := h.reportRepo.FindByID(report.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Report created successfully",
		"data":    createdReport,
	})
}

// GetAllReports handles F-04: List all maintenance reports
func (h *ReportHandler) GetAllReports(c *fiber.Ctx) error {
	reports, err := h.reportRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch reports",
		})
	}
	return c.JSON(fiber.Map{"data": reports})
}

// GetReportByID returns a single report by ID
func (h *ReportHandler) GetReportByID(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid report ID",
		})
	}

	report, err := h.reportRepo.FindByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Report not found",
		})
	}

	return c.JSON(fiber.Map{"data": report})
}

// ApproveReport handles F-02: Approval approves a report
func (h *ReportHandler) ApproveReport(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid report ID",
		})
	}

	// Check report exists and is in PENDING_APPROVAL status
	report, err := h.reportRepo.FindByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Report not found",
		})
	}

	if report.Status != "PENDING_APPROVAL" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Report is not in PENDING_APPROVAL status",
		})
	}

	// Update status to APPROVED
	if err := h.reportRepo.UpdateStatus(uint(id), "APPROVED"); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to approve report",
		})
	}

	// Trigger webhook asynchronously (B-02)
	go webhook.Notify("APPROVED", uint(id), time.Now())

	return c.JSON(fiber.Map{
		"message": "Report approved successfully",
	})
}

// CompleteReport handles F-03: SA completes a report with proof photo
func (h *ReportHandler) CompleteReport(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid report ID",
		})
	}

	// Check report exists and is in APPROVED status
	report, err := h.reportRepo.FindByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Report not found",
		})
	}

	if report.Status != "APPROVED" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Report is not in APPROVED status. Current status: " + report.Status,
		})
	}

	// Handle proof photo upload
	proofPhoto := ""
	file, err := c.FormFile("proof_photo")
	if err != nil || file == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Proof photo is required",
		})
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("uploads/proof_%s%s", uuid.New().String(), ext)
	if err := c.SaveFile(file, "./frontend/"+filename); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save proof photo",
		})
	}
	proofPhoto = filename

	// Update report with proof photo and COMPLETED status
	if err := h.reportRepo.UpdateProofPhoto(uint(id), proofPhoto); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete report",
		})
	}

	// Trigger webhook asynchronously (B-02)
	go webhook.Notify("COMPLETED", uint(id), time.Now())

	return c.JSON(fiber.Map{
		"message": "Report completed successfully",
	})
}
