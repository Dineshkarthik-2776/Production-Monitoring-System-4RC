# Backend API Test Report

> **Generated:** 2026-04-19  |  **Base URL:** `http://127.0.0.1:8000`  |  **Auth:** Knox Token  
> All tests run with credentials `manager@jkti.com` / `12345678`

---

## Summary

| # | Endpoint | Method | Status | Result |
| :- | :------- | :----- | :----- | :----- |
| 1 | `/auth/login/` | `POST` | `200` | PASS ✅ |
| 2 | `/api/auth/login/` | `POST` | `400` | EXPECTED ⚠️ |
| 3 | `/api/recipe-master/` | `GET` | `200` | PASS ✅ |
| 4 | `/api/recipe-master/ABC/` | `PATCH` | `200` | PASS ✅ |
| 5 | `/api/recipe-master/ABC/` | `PATCH` | `200` | PASS ✅ |
| 6 | `/api/recipe-export-master/?format=json` | `GET` | `200` | PASS ✅ |
| 7 | `/api/standard-time/` | `GET` | `200` | PASS ✅ |
| 8 | `/api/standard-time/` | `POST` | `200` | PASS ✅ |
| 9 | `/api/changeover-stats/` | `GET` | `200` | PASS ✅ |
| 10 | `/api/changeover-stats/?from_date=2026-04-05&to_date=2026-04-08` | `GET` | `200` | PASS ✅ |
| 11 | `/api/changeover-stats/?from_date=2026-04-05&to_date=2026-04-08&shift=A` | `GET` | `200` | PASS ✅ |
| 12 | `/api/changeover/update/94/` | `PATCH` | `200` | PASS ✅ |
| 13 | `/api/missing-recipes-warning/` | `GET` | `200` | PASS ✅ |
| 14 | `/api/correction-requests/` | `GET` | `403` | EXPECTED ⚠️ |
| 15 | `/api/correction-requests/<id>/action/` | `POST` | `N/A` | FAIL ❌ |
| 16 | `/api/auth/signup/` | `POST` | `N/A` | NOT TESTED ℹ️ |
| 17 | `/api/recipe-upload/` | `POST` | `N/A` | NOT TESTED ℹ️ |
| 18 | `/api/changeover-export/?from_date=<date>&to_date=<date>&shift=<A|B|C>&format=csv` | `GET` | `N/A` | NOT TESTED ℹ️ |
| 19 | `/api/changeover-export/?from_date=<date>&to_date=<date>&shift=<A|B|C>` | `GET` | `N/A` | NOT TESTED ℹ️ |
| 20 | `/api/standard-time/<id>/` | `DELETE` | `N/A` | NOT TESTED ℹ️ |
| 21 | `/api/overshoot-options/` | `GET` | `N/A` | NOT TESTED ℹ️ |
| 22 | `/api/reports/summary/?start_date=<date>&end_date=<date>` | `GET` | `N/A` | NOT TESTED ℹ️ |

---

## Detailed Results

### 1. POST /auth/login/ (valid credentials)

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/auth/login/`  
**Status:** `200`  
> **Note:** Use the returned token as: Authorization: Token <token>

**Request Payload:**
```json
{
  "email": "manager@jkti.com",
  "password": "12345678"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "3faac63d90c1f8ff596846bf5fb74c427fdbf444",
  "user": {
    "email": "manager@jkti.com",
    "name": "",
    "role": "admin"
  }
}
```

---

### 2. POST /api/auth/login/ (invalid credentials)

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/auth/login/`  
**Status:** `400`  
> **Note:** Expected 400/401

**Request Payload:**
```json
{
  "email": "manager@jkti.com",
  "password": "wrongpass"
}
```

**Response:**
```json
{
  "non_field_errors": [
    "Invalid email or password"
  ]
}
```

---

### 3. GET /api/recipe-master/ (list all)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/recipe-master/`  
**Status:** `200`  

**Response:**
```json
[
  {
    "recipe_code": "ABC",
    "sap_code": null,
    "target_speed": 40.0,
    "recipe_type": "fabric"
  },
  {
    "recipe_code": "BRTTL",
    "sap_code": null,
    "target_speed": 40.0,
    "recipe_type": "fabric"
  },
  "... (truncated)"
]
```

---

### 4. PATCH /api/recipe-master/<pk>/ (update target_speed + type)

**Method:** `PATCH`  
**URL:** `http://127.0.0.1:8000/api/recipe-master/ABC/`  
**Status:** `200`  
> **Note:** recipe_code and sap_code are read-only and will be ignored even if passed

**Request Payload:**
```json
{
  "target_speed": 42.5,
  "recipe_type": "fabric"
}
```

**Response:**
```json
{
  "recipe_code": "ABC",
  "sap_code": null,
  "target_speed": 42.5,
  "recipe_type": "fabric"
}
```

---

### 5. PATCH /api/recipe-master/<pk>/ (try changing recipe_code - ignored)

**Method:** `PATCH`  
**URL:** `http://127.0.0.1:8000/api/recipe-master/ABC/`  
**Status:** `200`  
> **Note:** recipe_code in payload is silently ignored - stays unchanged

**Request Payload:**
```json
{
  "recipe_code": "HACK",
  "target_speed": 40.0
}
```

**Response:**
```json
{
  "recipe_code": "ABC",
  "sap_code": null,
  "target_speed": 40.0,
  "recipe_type": "fabric"
}
```

---

### 6. GET /api/recipe-export-master/?format=json

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/recipe-export-master/?format=json`  
**Status:** `200`  
> **Note:** Use ?format=excel to get Excel file download

**Response:**
```json
{
  "ABC": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "BRTTL": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "CAP 28": {
    "type": "fabric",
    "target_speed": 35.0
  },
  "CAP 30": {
    "type": "fabric",
    "target_speed": 20.0
  },
  "CP 034 HI": {
    "type": "steel",
    "target_speed": 35.0
  },
  "CP 500": {
    "type": "steel",
    "target_speed": 25.0
  },
  "CP 51": {
    "type": "steel",
    "target_speed": 27.0
  },
  "CP 650": {
    "type": "steel",
    "target_speed": 28.0
  },
  "CP 700": {
    "type": "steel",
    "target_speed": 35.0
  },
  "CP 840": {
    "type": "steel",
    "target_speed": 27.0
  },
  "CP200": {
    "type": "steel",
    "target_speed": 40.0
  },
  "CP31151": {
    "type": "steel",
    "target_speed": 30.0
  },
  "CP56542": {
    "type": "steel",
    "target_speed": 40.0
  },
  "CPJ 120": {
    "type": "steel",
    "target_speed": 40.0
  },
  "CPJ 1218": {
    "type": "steel",
    "target_speed": 40.0
  },
  "CPJ114": {
    "type": "steel",
    "target_speed": 27.0
  },
  "CPJ121": {
    "type": "steel",
    "target_speed": 30.0
  },
  "CPJ370": {
    "type": "steel",
    "target_speed": 10.0
  },
  "CWBHTCP100": {
    "type": "steel",
    "target_speed": 40.0
  },
  "ECOPOLY 13": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "ECOPOLY 350": {
    "type": "fabric",
    "target_speed": 30.0
  },
  "ECOPOLY1500": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "EHT1000": {
    "type": "fabric",
    "target_speed": 45.0
  },
  "HIRAD": {
    "type": "fabric",
    "target_speed": 45.0
  },
  "HTPOLY1300": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "HTPOLY350": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "MONOCHAFFER": {
    "type": "fabric",
    "target_speed": 20.0
  },
  "NYLRAD": {
    "type": "fabric",
    "target_speed": 45.0
  },
  "PLYTEC": {
    "type": "fabric",
    "target_speed": 40.0
  },
  "POLYESTER": {
    "type": "fabric",
    "target_speed": 45.0
  }
}
```

---

### 7. GET /api/standard-time/

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/standard-time/`  
**Status:** `200`  

**Response:**
```json
[
  {
    "id": 2,
    "changeover_key": "Steel to Fabric",
    "standard_time": 30.0
  },
  {
    "id": 3,
    "changeover_key": "Fabric to Steel",
    "standard_time": 61.0
  },
  "... (truncated)"
]
```

---

### 8. POST /api/standard-time/ (upsert array)

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/standard-time/`  
**Status:** `200`  
> **Note:** Send array to bulk-upsert. changeover_key is read-only.

**Request Payload:**
```json
[
  {
    "changeover_key": "Steel to Steel",
    "standard_time": 45.0
  },
  {
    "changeover_key": "Fabric to Fabric",
    "standard_time": 30.0
  }
]
```

**Response:**
```json
{
  "message": "Standard times updated successfully."
}
```

---

### 9. GET /api/changeover-stats/ (no filter)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/changeover-stats/`  
**Status:** `200`  

**Response:**
```json
{
  "table_data": [],
  "bar_chart_data": []
}
```

---

### 10. GET /api/changeover-stats/ (date range)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/changeover-stats/?from_date=2026-04-05&to_date=2026-04-08`  
**Status:** `200`  

**Response:**
```json
{
  "table_data": [
    {
      "id": 1,
      "type": "Fabric to Fabric",
      "Std": 10.0,
      "act": 11.74,
      "static": 7.1,
      "ramp": 4.64,
      "shoot": 1.74,
      "count": 8,
      "details": [
        {
          "id": 92,
          "material": "CAP 28",
          "from_recipe": "ECOPOLY 350",
          "to_recipe": "CAP 28",
          "start_time": "2026-04-07T00:30:00Z",
          "Std": 10.0,
          "act": 18.3,
          "static": 7.0,
          "ramp": 11.3,
          "shoot": 8.3,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-06",
          "shift": "C"
        },
        {
          "id": 91,
          "material": "ECOPOLY 350",
          "from_recipe": "HTPOLY350",
          "to_recipe": "ECOPOLY 350",
          "start_time": "2026-04-06T21:24:50Z",
          "Std": 10.0,
          "act": 2.6,
          "static": 1.3,
          "ramp": 1.3,
          "shoot": -7.4,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-06",
          "shift": "B"
        },
        {
          "id": 90,
          "material": "HTPOLY350",
          "from_recipe": "PLYTEC",
          "to_recipe": "HTPOLY350",
          "start_time": "2026-04-06T19:01:20Z",
          "Std": 10.0,
          "act": "NA",
          "static": "NA",
          "ramp": "NA",
          "shoot": "NA",
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": "Changeover statistics cannot be calculated because the target speed for the previous recipe 'PLYTEC' is 40.0 but the max speed ran was 25.0.",
          "production_date": "2026-04-06",
          "shift": "B"
        },
        {
          "id": 89,
          "material": "PLYTEC",
          "from_recipe": "BRTTL",
          "to_recipe": "PLYTEC",
          "start_time": "2026-04-06T18:33:20Z",
          "Std": 10.0,
          "act": "NA",
          "static": "NA",
          "ramp": "NA",
          "shoot": "NA",
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": "Changeover statistics cannot be calculated because the target speed for the current recipe 'PLYTEC' is 40.0 but the max speed ran was 25.0.",
          "production_date": "2026-04-06",
          "shift": "B"
        },
        {
          "id": 88,
          "material": "BRTTL",
          "from_recipe": "MONOCHAFFER",
          "to_recipe": "BRTTL",
          "start_time": "2026-04-06T17:19:40Z",
          "Std": 10.0,
          "act": 14.5,
          "static": 8.7,
          "ramp": 5.8,
          "shoot": 4.5,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-06",
          "shift": "B"
        },
        {
          "id": 85,
          "material": "ECOPOLY 350",
          "from_recipe": "HIRAD",
          "to_recipe": "ECOPOLY 350",
          "start_time": "2026-04-06T09:07:30Z",
          "Std": 10.0,
          "act": 10.5,
          "static": 9.0,
          "ramp": 1.5,
          "shoot": 0.5,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-06",
          "shift": "A"
        },
        {
          "id": 82,
          "material": "CAP 28",
          "from_recipe": "BRTTL",
          "to_recipe": "CAP 28",
          "start_time": "2026-04-06T01:09:10Z",
          "Std": 10.0,
          "act": "NA",
          "static": "NA",
          "ramp": "NA",
          "shoot": "NA",
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": "Changeover statistics cannot be calculated because required setup points could not be identified.",
          "production_date": "2026-04-05",
          "shift": "C"
        },
        {
          "id": 81,
          "material": "BRTTL",
          "from_recipe": "ECOPOLY 350",
          "to_recipe": "BRTTL",
          "start_time": "2026-04-06T00:02:50Z",
          "Std": 10.0,
          "act": 12.8,
          "static": 9.5,
          "ramp": 3.3,
          "shoot": 2.8,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-05",
          "shift": "C"
        }
      ]
    },
    "... (truncated)"
  ],
  "bar_chart_data": [
    {
      "value": 1,
      "category": "Operational"
    }
  ]
}
```

---

### 11. GET /api/changeover-stats/ (date + shift A)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/changeover-stats/?from_date=2026-04-05&to_date=2026-04-08&shift=A`  
**Status:** `200`  

**Response:**
```json
{
  "table_data": [
    {
      "id": 1,
      "type": "Fabric to Fabric",
      "Std": 10.0,
      "act": 10.5,
      "static": 9.0,
      "ramp": 1.5,
      "shoot": 0.5,
      "count": 1,
      "details": [
        {
          "id": 85,
          "material": "ECOPOLY 350",
          "from_recipe": "HIRAD",
          "to_recipe": "ECOPOLY 350",
          "start_time": "2026-04-06T09:07:30Z",
          "Std": 10.0,
          "act": 10.5,
          "static": 9.0,
          "ramp": 1.5,
          "shoot": 0.5,
          "overshoot_category": "NONE",
          "overshoot_reason": null,
          "remarks": null,
          "production_date": "2026-04-06",
          "shift": "A"
        }
      ]
    },
    "... (truncated)"
  ],
  "bar_chart_data": [
    {
      "value": 1,
      "category": "Operational"
    }
  ]
}
```

---

### 12. PATCH /api/changeover/update/<id>/ (overshoot - manager)

**Method:** `PATCH`  
**URL:** `http://127.0.0.1:8000/api/changeover/update/94/`  
**Status:** `200`  

**Request Payload:**
```json
{
  "overshoot_category": "Mechanical",
  "overshoot_reason": "Machine belt worn out"
}
```

**Response:**
```json
{
  "overshoot_category": "Mechanical",
  "overshoot_reason": "Machine belt worn out"
}
```

---

### 13. GET /api/missing-recipes-warning/

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/missing-recipes-warning/`  
**Status:** `200`  

**Response:**
```json
{
  "warning": false,
  "message": "All running recipes have target speeds.",
  "missing_recipe_codes": []
}
```

---

### 14. GET /api/correction-requests/

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/correction-requests/`  
**Status:** `403`  
> **Note:** Manager only endpoint

**Response:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 15. POST /api/correction-requests/<id>/action/

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/correction-requests/<id>/action/`  
**Status:** `N/A`  
> **Note:** Manager only. Created automatically when worker edit window expires.

**Request Payload:**
```json
{"action": "approve"}  OR  {"action": "reject"}
```

**Response:**
```json
{"note": "No PENDING correction requests in DB."}
```

---

### 16. POST /api/auth/signup/

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/auth/signup/`  
**Status:** `N/A`  
> **Note:** Creates a new user account.

**Sample Request Payload:**
```json
{
  "email": "newuser@jkti.com",
  "password": "StrongPassword123",
  "name": "New User",
  "role": "worker"
}
```

---

### 17. POST /api/recipe-upload/

**Method:** `POST`  
**URL:** `http://127.0.0.1:8000/api/recipe-upload/`  
**Status:** `N/A`  
> **Note:** Supports multipart file upload (`excel_file`) and JSON payload (`data`).

**Sample JSON Request Payload:**
```json
{
  "data": [
    {
      "recipe_code": "RC001",
      "sap_code": "SAP001",
      "recipe_type": "Fabric",
      "target_speed": 35
    }
  ]
}
```

---

### 18. GET /api/changeover-export/ (CSV)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/changeover-export/?from_date=2026-04-01&to_date=2026-04-24&shift=A&format=csv`  
**Status:** `N/A`  
> **Note:** Exports filtered changeover report as CSV.

---

### 19. GET /api/changeover-export/ (Excel)

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/changeover-export/?from_date=2026-04-01&to_date=2026-04-24&shift=A`  
**Status:** `N/A`  
> **Note:** Exports filtered changeover report as Excel (`.xlsx`).

---

### 20. DELETE /api/standard-time/<id>/

**Method:** `DELETE`  
**URL:** `http://127.0.0.1:8000/api/standard-time/1/`  
**Status:** `N/A`  
> **Note:** Deletes one standard time mapping.

---

### 21. GET /api/overshoot-options/

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/overshoot-options/`  
**Status:** `N/A`  
> **Note:** Returns available overshoot categories and reasons used by dropdowns.

---

### 22. GET /api/reports/summary/

**Method:** `GET`  
**URL:** `http://127.0.0.1:8000/api/reports/summary/?start_date=2026-04-01&end_date=2026-04-24`  
**Status:** `N/A`  
> **Note:** Generates/downloads summary PDF report.

---
