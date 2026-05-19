package webhook

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

// WebhookPayload represents the data sent to the webhook URL
type WebhookPayload struct {
	Event     string    `json:"event"`
	ReportID  uint      `json:"report_id"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

// Notify sends an asynchronous HTTP POST to the configured webhook URL
// This function is designed to be called with `go webhook.Notify(...)` (Goroutine)
func Notify(status string, reportID uint, timestamp time.Time) {
	webhookURL := os.Getenv("WEBHOOK_URL")
	if webhookURL == "" {
		log.Println("[Webhook] No WEBHOOK_URL configured, skipping notification")
		return
	}

	payload := WebhookPayload{
		Event:     "report_status_changed",
		ReportID:  reportID,
		Status:    status,
		Timestamp: timestamp,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		log.Printf("[Webhook] Failed to marshal payload: %v", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(webhookURL, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[Webhook] Failed to send notification: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[Webhook] Notification sent for report #%d (status: %s) - Response: %d",
		reportID, status, resp.StatusCode)
}
