# 042 - Separate routes, controllers, and services: Example

## Question

How can a small Express API be split into route, validation, controller, service, and repository modules while keeping each module focused on one responsibility?

## What you will build

This Express 5 application exposes three product endpoints:

- GET /api/products lists products.
- GET /api/products/:productId reads one product.
- POST /api/products creates a product.

The router composes input middleware and controller handlers. The controller handles HTTP responses. The service enforces the duplicate-name rule. A repository provides in-memory data operations. The app entry point wires these pieces together.

The repository is intentionally in memory. The next chapter connects an Express application to MongoDB.

## Project structure

~~~text
routes-controllers-services/
|-- package.json
|-- src/
    |-- app.js
    |-- server.js
    |-- controllers/
    |   |-- product.controller.js
    |-- errors/
    |   |-- app-error.js
    |-- middleware/
    |   |-- error-handler.js
    |   |-- product-validation.js
    |   |-- not-found.js
    |-- repositories/
    |   |-- product.repository.js
    |-- routes/
    |   |-- product.routes.js
    |-- services/
        |-- product.service.js
~~~

The request path is:

~~~text
product.routes.js
    -> product-validation.js
    -> product.controller.js
    -> product.service.js
    -> product.repository.js
~~~

## Setup

~~~powershell
mkdir routes-controllers-services
cd routes-controllers-services
npm init -y
npm install express@5
~~~

Use this package.json:

~~~json
{
  "name": "routes-controllers-services",
  "version": "1.0.0",
  "private": true,
  "description": "Modular Express request flow example",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "express": "^5.1.0"
  }
}
~~~

If you replaced package.json after installing Express, run npm install again to synchronize package.json and the lock file.

## Complete source files

### src/errors/app-error.js

This error represents an expected application failure that can be safely mapped to an HTTP status and code.

~~~js
class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = AppError;
~~~

### src/repositories/product.repository.js

The repository owns the in-memory records and exposes operations the service needs. Its async methods behave like asynchronous data access and can later be replaced by MongoDB-backed operations.

~~~js
function createProductRepository() {
  let nextId = 3;

  const products = [
    { id: 1, name: "Desk lamp", price: 24.5, inStock: true },
    { id: 2, name: "Notebook", price: 5.75, inStock: false }
  ];

  function copy(product) {
    return product ? { ...product } : null;
  }

  return {
    async findAll() {
      return products.map(copy);
    },

    async findById(id) {
      const product = products.find((item) => item.id === id);
      return copy(product);
    },

    async findByName(name) {
      const normalizedName = name.toLowerCase();
      const product = products.find(
        (item) => item.name.toLowerCase() === normalizedName
      );
      return copy(product);
    },

    async create(input) {
      const product = {
        id: nextId++,
        name: input.name,
        price: input.price,
        inStock: input.inStock
      };

      products.push(product);
      return copy(product);
    }
  };
}

module.exports = createProductRepository;
~~~

The repository returns copies so a caller cannot mutate the stored object by changing a returned reference.

### src/services/product.service.js

The service applies the product rule that names must be unique. It knows about application errors and repository operations, but it does not know about Express requests or responses.

~~~js
const AppError = require("../errors/app-error");

function createProductService({ productRepository }) {
  return {
    async listProducts() {
      return productRepository.findAll();
    },

    async getProductById(id) {
      const product = await productRepository.findById(id);

      if (!product) {
        throw new AppError(
          404,
          "PRODUCT_NOT_FOUND",
          "The requested product was not found."
        );
      }

      return product;
    },

    async createProduct(input) {
      const existing = await productRepository.findByName(input.name);

      if (existing) {
        throw new AppError(
          409,
          "PRODUCT_NAME_EXISTS",
          "A product with that name already exists."
        );
      }

      return productRepository.create(input);
    }
  };
}

module.exports = createProductService;
~~~

A database-backed application should also enforce uniqueness in the database. A service check alone can race when multiple requests arrive at once; the next chapter introduces the database connection.

### src/middleware/product-validation.js

This module validates HTTP input before a controller runs. Normalized values are stored in res.locals, which is scoped to this request.

~~~js
const AppError = require("../errors/app-error");

function validateProductId(req, res, next) {
  const value = req.params.productId;

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT_ID",
      "productId must be a canonical positive integer."
    ));
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id)) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT_ID",
      "productId must be a safe positive integer."
    ));
  }

  res.locals.productId = id;
  return next();
}

function validateCreateProduct(req, res, next) {
  const body = req.body;

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "The request body must be a JSON object."
    ));
  }

  const allowedKeys = new Set(["name", "price", "inStock"]);
  const hasUnknownKey = Object.keys(body).some(
    (key) => !allowedKeys.has(key)
  );

  if (hasUnknownKey) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "The request contains unsupported fields."
    ));
  }

  if (typeof body.name !== "string") {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "name must be a string."
    ));
  }

  const name = body.name.trim();

  if (name.length < 1 || name.length > 80) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "name must contain between 1 and 80 characters."
    ));
  }

  if (typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price < 0) {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "price must be a non-negative finite number."
    ));
  }

  if (typeof body.inStock !== "boolean") {
    return next(new AppError(
      400,
      "INVALID_PRODUCT",
      "inStock must be a boolean."
    ));
  }

  res.locals.productInput = {
    name,
    price: body.price,
    inStock: body.inStock
  };

  return next();
}

module.exports = {
  validateProductId,
  validateCreateProduct
};
~~~

### src/controllers/product.controller.js

The controller adapts validated HTTP input to service calls and formats the HTTP response. It does not implement the duplicate-name rule or access the repository directly.

~~~js
function createProductController({ productService }) {
  return {
    async list(req, res) {
      const products = await productService.listProducts();
      return res.json({ data: products });
    },

    async getById(req, res) {
      const product = await productService.getProductById(
        res.locals.productId
      );

      return res.json({ data: product });
    },

    async create(req, res) {
      const product = await productService.createProduct(
        res.locals.productInput
      );

      return res.status(201).json({ data: product });
    }
  };
}

module.exports = createProductController;
~~~

These async handlers return their promises to Express 5. If a service call rejects, Express forwards the error to the error middleware.

### src/routes/product.routes.js

The router declares the endpoints and their middleware order. It does not implement the business workflow.

~~~js
const express = require("express");
const {
  validateProductId,
  validateCreateProduct
} = require("../middleware/product-validation");

function createProductRouter({ productController }) {
  const router = express.Router();

  router.get("/", productController.list);
  router.get(
    "/:productId",
    validateProductId,
    productController.getById
  );
  router.post(
    "/",
    validateCreateProduct,
    productController.create
  );

  return router;
}

module.exports = createProductRouter;
~~~

### src/middleware/not-found.js

This middleware runs only if no mounted route has handled the request.

~~~js
const AppError = require("../errors/app-error");

function notFound(req, res, next) {
  return next(new AppError(
    404,
    "ROUTE_NOT_FOUND",
    "The requested route was not found."
  ));
}

module.exports = notFound;
~~~

### src/middleware/error-handler.js

This is the final error boundary. It maps known application and body-parser errors to safe responses and hides unexpected internal details.

~~~js
const AppError = require("../errors/app-error");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error && error.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "BODY_TOO_LARGE",
        message: "The request body is too large."
      }
    });
  }

  if (error && error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON."
      }
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred."
    }
  });
}

module.exports = errorHandler;
~~~

### src/app.js

The app module creates the Express app and wires its dependencies. Middleware order matters: body parsing comes before the product router, and error handling comes after routes and not-found handling.

~~~js
const express = require("express");
const createProductController = require("./controllers/product.controller");
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const createProductRepository = require("./repositories/product.repository");
const createProductRouter = require("./routes/product.routes");
const createProductService = require("./services/product.service");

function createApp() {
  const app = express();

  const productRepository = createProductRepository();
  const productService = createProductService({ productRepository });
  const productController = createProductController({ productService });

  app.use(express.json({ limit: "16kb" }));

  app.use(
    "/api/products",
    createProductRouter({ productController })
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
~~~

### src/server.js

The server entry point starts listening. Keeping listen() out of app.js means creating an app does not automatically open a network port.

~~~js
const createApp = require("./app");

const app = createApp();
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log("Product API listening on port " + port);
});
~~~

## Start the server

~~~powershell
npm start
~~~

## Try the endpoints

### List products

~~~powershell
curl.exe -i http://localhost:3000/api/products
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "data": [
    {
      "id": 1,
      "name": "Desk lamp",
      "price": 24.5,
      "inStock": true
    },
    {
      "id": 2,
      "name": "Notebook",
      "price": 5.75,
      "inStock": false
    }
  ]
}
~~~

### Read one product

~~~powershell
curl.exe -i http://localhost:3000/api/products/1
~~~

Expected response:

~~~http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "data": {
    "id": 1,
    "name": "Desk lamp",
    "price": 24.5,
    "inStock": true
  }
}
~~~

An invalid path ID such as /api/products/01 produces a 400 response. A valid but missing ID such as /api/products/99 produces a 404 response with code PRODUCT_NOT_FOUND.

### Create a product

~~~powershell
curl.exe -i -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"name":"Travel mug","price":12.5,"inStock":true}'
~~~

Expected response:

~~~http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{
  "data": {
    "id": 3,
    "name": "Travel mug",
    "price": 12.5,
    "inStock": true
  }
}
~~~

Posting a product with an existing name, such as Desk lamp, produces a 409 response with code PRODUCT_NAME_EXISTS. Posting an unknown property produces a 400 response before the controller calls the service.

### Request an unknown route

~~~powershell
curl.exe -i http://localhost:3000/api/unknown
~~~

Expected status: 404 Not Found, with code ROUTE_NOT_FOUND.

## What to notice

- app.js is the composition root: it creates modules and supplies dependencies.
- The route declares method, path, middleware order, and controller handler.
- Validation middleware converts the path ID and request body into normalized request-scoped values.
- The controller uses HTTP objects and chooses success response formats.
- The service enforces a rule that is independent of HTTP.
- The repository owns the in-memory data operations.
- The not-found middleware runs after the mounted route.
- The error handler is last and keeps unexpected details out of client responses.
- The server entry point starts listening separately from app creation.
- Each file has a distinct responsibility, while the complete request flow remains visible.

## Common mistakes

- Importing a route into a service or a service into a route module.
- Passing req and res to the service instead of plain application values.
- Letting a controller implement business rules and repository queries.
- Putting response formatting inside the repository.
- Registering the JSON parser after the router.
- Forgetting to return async work from the handler.
- Defining an error handler with only three parameters.
- Registering error middleware before the routes.
- Adding layers that only forward calls without isolating a real responsibility.
- Assuming an in-memory duplicate check is enough to guarantee uniqueness in a concurrent database.

## Chapter navigation

| Previous chapter | Chapter Q&A | Lesson | Next chapter |
| --- | --- | --- | --- |
| [041 - Parse path, query, and body inputs](../lessons/041-parse-path-query-and-body-inputs.md) | [Q&A](../qnas/042-separate-routes-controllers-and-services.md) | [Lesson](../lessons/042-separate-routes-controllers-and-services.md) | [043 - Connect an Express app to MongoDB](../lessons/043-connect-an-express-app-to-mongodb.md) |
