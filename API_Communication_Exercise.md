# 16. Microservices API and Communication Exercise

## Design Table

| Item | User Service | Product Service | Order Service |
| :--- | :--- | :--- | :--- |
| **Responsibility** | Create, retrieve, update and delete User resources. | Manage Product resources used by the application. | Create and retrieve Orders; validate referenced User and Product data through APIs. |
| **Port** | :3001 | :3002 | :3003 |
| **Main resources** | Users | Products | Orders |
| **Key endpoints** | GET/POST/PUT/DELETE /users | GET/POST/PUT/DELETE /products | POST/GET /orders |
| **Data/database** | User-owned | Product-owned | Order-owned |

## Service-to-Service Call

| Field | Your design |
| :--- | :--- |
| **Calling service** | Order Service |
| **Target service** | User Service / Product Service |
| **HTTP method** | GET |
| **Endpoint** | /users/{id} or /products/{id} |
| **Request data** | Referenced user/product ID |
| **Expected response** | 200 + requested resource |
| **Failure response** | 404 for invalid resource; 503 when dependency is unavailable |
