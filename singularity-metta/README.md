# MeTTa Reasoning API

Simple FastAPI for reasoning with Singularity MeTTa.

## Installation

Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Start the server

```bash
python main.py
```

The server will be available at `http://localhost:5000`

### Interactive documentation

Once the server is running, you can access:
- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## Endpoints

### 1. Health Check
```bash
GET /
```

Verify the service is running.

Example:
```bash
curl http://localhost:5000/
```

### 2. Reasoning
```bash
POST /reason
```

Execute a reasoning query using the knowledge base.

Example:
```bash
curl -X POST http://localhost:5000/reason \
  -H "Content-Type: application/json" \
  -d '{"query": "who is mortal"}'
```

Request body:
```json
{
  "query": "who is mortal",
  "load_knowledge": true
}
```

Response:
```json
{
  "query": "who is mortal",
  "result": [...],
  "success": true
}
```

### 3. Execute MeTTa code
```bash
POST /execute
```

Execute MeTTa code directly.

Example:
```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "!(+ 1 2)"}'
```

Request body:
```json
{
  "code": "!(+ 1 2)"
}
```

Response:
```json
{
  "code": "!(+ 1 2)",
  "result": [3],
  "success": true
}
```

### 4. Get knowledge base
```bash
GET /knowledge
```

Returns the content of the `knowledge.metta` file.

Example:
```bash
curl http://localhost:5000/knowledge
```

## Knowledge base

The `knowledge.metta` file contains the rules and facts that the reasoner uses. You can edit it to add your own knowledge.

Example content:
```metta
(: human (-> Symbol Bool))
(human socrates)

(: mortal (-> Symbol Bool))
(= (mortal $x)
   (human $x))
```

## Python usage examples

```python
import requests

# Simple reasoning
response = requests.post(
    "http://localhost:5000/reason",
    json={"query": "is socrates mortal"}
)
print(response.json())

# Execute MeTTa code
response = requests.post(
    "http://localhost:5000/execute",
    json={"code": "!(human socrates)"}
)
print(response.json())
```

## Project structure

```
singularity-metta/
├── main.py           # FastAPI application
├── knowledge.metta   # Knowledge base
├── requirements.txt  # Dependencies
└── README.md         # This file
```

## Notes

- The server runs on port 5000 by default
- You can modify the host and port in `main.py`
- The knowledge base is loaded on each request to allow dynamic updates
