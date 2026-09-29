# Lab 7: API Gateway, Service Discovery & Cloud Deployment

## Architecture Diagram

```mermaid
flowchart TD
    Client[Client / Postman]
    Gateway[API Gateway]
    
    Client -->|HTTP| Gateway
    
    subgraph "Docker Network"
        Gateway -->|Route /users/*| US[User Service]
        Gateway -->|Route /products/*| PS[Product Service]
        Gateway -->|Route /orders/*| OS[Order Service]
        
        OS -->|REST GET /users/{id}| US
        OS -->|REST GET /products/{id}| PS
        
        US -.->|Owns| UDB[(MongoDB Atlas)]
        PS -.->|Owns| PDB[(MongoDB Atlas)]
        OS -.->|Owns| ODB[(MongoDB Atlas)]
    end
```

## Discussion Questions

### Why introduce an API Gateway instead of letting clients call each service directly?
Introducing an API Gateway provides a single, unified entry point for clients, effectively hiding the internal microservices architecture. Instead of clients needing to know the exact address and port of every individual service, they only talk to the Gateway. This allows for centralized handling of cross-cutting concerns such as request logging, authentication, and global error handling (like returning clean 502/503 errors when backend services are down). It also improves security by ensuring the internal microservices are not exposed directly to the public internet.

### Static/Config-Based Service Discovery vs. Dynamic Service Discovery
Our current approach uses **Static/Config-Based Service Discovery**, where the locations of backend services are defined in environment variables (e.g., `USER_SERVICE_URL`). The API Gateway reads these at startup. This is simple and effective for small, static deployments. 

In contrast, **Dynamic Service Discovery** (e.g., Consul, Eureka, Kubernetes DNS) involves a dynamic registry where microservices automatically register themselves when they start and deregister when they stop. 
**What Dynamic Adds:**
- **Auto-scaling support:** New instances of a service are automatically discovered by the gateway without manual config changes or restarts.
- **Health monitoring:** The registry actively checks if services are alive and removes them from the routing table if they fail.
- **Zero-downtime routing:** The gateway automatically load-balances across all healthy instances of a service dynamically.

## Cloud Deployment Steps (Render)

1. **Push to GitHub**: Push the entire project (including the `api-gateway` and microservices) to a GitHub repository.
2. **Deploy Microservices on Render**:
   - Create a new "Web Service" in Render for `user-service`, `product-service`, and `order-service`.
   - Set the Root Directory appropriately (e.g., `./user-service`).
   - Use the Docker environment.
   - Configure Environment Variables (e.g., `MONGO_URI` pointing to MongoDB Atlas).
3. **Deploy API Gateway on Render**:
   - Create a new "Web Service" in Render for `api-gateway`.
   - Set the Root Directory to `./api-gateway`.
   - Use the Docker environment.
   - Configure Environment Variables: Set `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, and `ORDER_SERVICE_URL` to the **Public URLs** provided by Render for the deployed microservices (e.g., `https://user-service-7f9k.onrender.com`). *Note: Internal URLs (e.g., `http://user-service-7f9k:10000`) only work if the microservices are deployed as 'Private Services', which may not be available on all free tiers.*
4. **Public URL**:
   - API Gateway Public URL: https://api-gateway-wqa7.onrender.com

## Troubleshooting Notes
- **502 Bad Gateway:** If the gateway returns a 502, it means the target microservice is unreachable. Verify that the environment variables in the Gateway correctly point to the microservices and that those services are running.
- **Routing Loop Detection (Render 502 HTML):** If the gateway proxies a request to a Render public URL without stripping `x-forwarded-*` headers, Render's Edge Router will detect its own headers coming back, assume an infinite routing loop, and return a 502 HTML error page. We resolved this by explicitly stripping `x-forwarded-for` and `x-forwarded-host` in the `http-proxy-middleware`'s `onProxyReq` event.
- **ENOTFOUND Error:** If the gateway logs show `ENOTFOUND` when trying to resolve a service name like `user-service-7f9k`, it indicates the service was deployed as a "Web Service" instead of a "Private Service". Web Services do not receive internal DNS resolution on Render's private network, so you must use their fully qualified public URLs in the Gateway configuration.
- **Render Port Binding:** Ensure the Dockerfiles expose the correct ports and that Render binds to them. Render automatically detects the `EXPOSE` instruction.

## Reflection
Implementing the API Gateway and deploying to the cloud fundamentally transformed how the system is operated. In Lab 6, clients had to connect to multiple disparate ports, exposing the internal structure, and all services ran locally. Now, the API Gateway acts as a secure, singular facade, handling routing and global error interception, which makes the client's job much easier. Furthermore, deploying to the cloud using configuration-based service discovery (environment variables) allowed us to decouple the code from the infrastructure. The microservices are now internet-accessible, scalable, and the gateway seamlessly routes traffic without any hard-coded dependencies, creating a truly production-ready architecture.
