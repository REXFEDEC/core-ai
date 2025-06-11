package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type RequestPayload struct {
	Abstract string `json:"abstract"`
}

type Recommendation struct {
	Journal string  `json:"journal"`
	Score   float64 `json:"score"`
}

func recommendHandler(w http.ResponseWriter, r *http.Request) {
	var payload RequestPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil || payload.Abstract == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Placeholder for recommendation logic
	recommendations := []Recommendation{
		{"Journal of AI", 0.93},
		{"Journal of ML", 0.89},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recommendations)
}

func main() {
	http.HandleFunc("/recommend", recommendHandler)
	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
