# 058 - API documentation and versioning: example

This example documents one authenticated product endpoint with OpenAPI and mounts it under an explicit `/api/v1` path. The same contract is served through Swagger UI in development, and a linter command can be added to CI so documentation changes are checked with the code.

The code is educational material and is not run. Integrate it into the existing Express and MongoDB application. It assumes the project has an `Order`-style authentication middleware, a `Product` Mongoose model with `name`, `priceCents`, and `currency` fields, and the request ID middleware from the previous chapter.

## What the example demonstrates

- Describe a versioned endpoint with parameters, authentication, schemas, examples, and response codes.
- Keep API response objects separate from raw Mongoose documents.
- Mount an Express router under `/api/v1`.
- Serve interactive API documentation in development.
- Use a stable error shape and match the documented contract.
- Add an OpenAPI linter command that can run in local development and CI.

## Create the OpenAPI document

Create **openapi.json** at the project root with this contract. The `openapi` field is the specification format version; `info.version` describes this API contract revision; `/api/v1` is the versioned URL path clients call.

~~~json
{
  "openapi": "3.1.0",
  "info": {
    "title": "MERN Products API",
    "version": "1.0.0",
    "description": "A versioned API for reading product details."
  },
  "servers": [
    {
      "url": "/api/v1",
      "description": "Current API version on this host"
    }
  ],
  "tags": [
    {
      "name": "Products",
      "description": "Product read operations"
    }
  ],
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/products/{productId}": {
      "get": {
        "tags": ["Products"],
        "operationId": "getProductById",
        "summary": "Get a product by ID",
        "description": "Returns a product that the authenticated user is allowed to view.",
        "parameters": [
          {
            "name": "productId",
            "in": "path",
            "required": true,
            "description": "A 24-character MongoDB ObjectId string.",
            "schema": {
              "type": "string",
              "pattern": "^[0-9a-fA-F]{24}$",
              "examples": ["66a123456789abcdef012345"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Product returned successfully.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProductResponse"
                },
                "examples": {
                  "found": {
                    "value": {
                      "data": {
                        "id": "66a123456789abcdef012345",
                        "name": "Notebook",
                        "priceCents": 1299,
                        "currency": "USD"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "The product ID is malformed.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "examples": {
                  "invalidId": {
                    "value": {
                      "error": {
                        "code": "INVALID_PRODUCT_ID",
                        "message": "Product ID must be a 24-character hexadecimal string.",
                        "requestId": "server-generated-id"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Authentication is required.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "The product does not exist or is not available to this user.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                },
                "examples": {
                  "notFound": {
                    "value": {
                      "error": {
                        "code": "PRODUCT_NOT_FOUND",
                        "message": "Product not found.",
                        "requestId": "server-generated-id"
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "An unexpected server error occurred.",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    },
    "schemas": {
      "ProductResponse": {
        "type": "object",
        "required": ["data"],
        "properties": {
          "data": {
            "$ref": "#/components/schemas/Product"
          }
        }
      },
      "Product": {
        "type": "object",
        "required": ["id", "name", "priceCents", "currency"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Public product identifier."
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "example": "Notebook"
          },
          "priceCents": {
            "type": "integer",
            "minimum": 0,
            "description": "Price in minor currency units."
          },
          "currency": {
            "type": "string",
            "pattern": "^[A-Z]{3}$",
            "description": "Three-letter currency code."
          }
        },
        "additionalProperties": false
      },
      "ErrorResponse": {
        "type": "object",
        "required": ["error"],
        "properties": {
          "error": {
            "type": "object",
            "required": ["code", "message"],
            "properties": {
              "code": {
                "type": "string"
              },
              "message": {
                "type": "string"
              },
              "requestId": {
                "type": "string",
                "description": "Optional server-generated support reference."
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    }
  }
}
~~~

The schema exposes only fields intended for clients. Adjust the synthetic product fields to the project's real public contract; keep database-only fields out of the response.

## Mount the versioned route and documentation UI

Create or update **app.js**. The router path and the OpenAPI server URL combine to form `/api/v1/products/{productId}`. The documentation UI is enabled locally and only exposed in production when the deployment explicitly opts in.

~~~js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./openapi.json");
const { Product } = require("./models/product");
const { requireAuth } = require("./middleware/require-auth");

const app = express();
app.use(express.json({ limit: "100kb" }));

function sendError(req, res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
      ...(req.id ? { requestId: req.id } : {}),
    },
  });
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

const v1Router = express.Router();

v1Router.get(
  "/products/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.productId)) {
      return sendError(
        req,
        res,
        400,
        "INVALID_PRODUCT_ID",
        "Product ID must be a 24-character hexadecimal string.",
      );
    }

    // Adapt this ownership/filter rule to the actual product visibility model.
    const product = await Product.findOne({
      _id: req.params.productId,
      isPublished: true,
    })
      .select("name priceCents currency")
      .lean();

    if (!product) {
      return sendError(req, res, 404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    // Map database data to the public response schema explicitly.
    return res.json({
      data: {
        id: String(product._id),
        name: product.name,
        priceCents: product.priceCents,
        currency: product.currency,
      },
    });
  }),
);

app.use("/api/v1", v1Router);

if (process.env.NODE_ENV !== "production" || process.env.EXPOSE_API_DOCS === "true") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}

app.use((error, req, res, next) => {
  req.log?.error({ event: "api.request.failed", err: error }, "API request failed");
  if (res.headersSent) return next(error);
  return sendError(req, res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
});

module.exports = app;
~~~

Use the existing server entry point to connect MongoDB and call `app.listen`. Keep the error handler after routes. Make sure `requireAuth` returns the documented `401` error shape; an OpenAPI declaration does not install or enforce authentication by itself.

## Try the endpoint

After connecting the existing app and database, call the endpoint with an authorized bearer token and a valid published product ID:

~~~http
GET /api/v1/products/66a123456789abcdef012345 HTTP/1.1
Host: localhost:3000
Authorization: Bearer your-own-development-token
Accept: application/json
~~~

A successful response looks like this:

~~~json
{
  "data": {
    "id": "66a123456789abcdef012345",
    "name": "Notebook",
    "priceCents": 1299,
    "currency": "USD"
  }
}
~~~

A malformed ID returns `400` with `INVALID_PRODUCT_ID`; an unavailable product returns `404` with `PRODUCT_NOT_FOUND`; a request without valid authentication should return `401`. Internal errors return a generic `500` response and can include the request ID for log lookup.

Open `/api-docs` in development to browse the contract and try the endpoint. The interactive UI does not create a product or bypass authentication; it sends requests to the configured server using the authorization details provided by the developer.

## Lint the contract in CI

Install the OpenAPI linter as a development dependency and save its version in the project's lockfile:

~~~powershell
npm install --save-dev @redocly/cli
~~~

Add a script to the existing `package.json`:

~~~json
{
  "scripts": {
    "api:lint": "redocly lint openapi.json"
  }
}
~~~

Run the same command locally and in the CI job after `npm ci`:

~~~powershell
npm run api:lint
~~~

A successful lint confirms the document passes the configured structural and style rules. It does not prove the Express route matches the contract, so keep route/contract tests and review the API description with each implementation change.

## Add a future version safely

If a future product response must make a breaking change, add a separately documented route such as `/api/v2/products/{productId}` and decide whether both versions need to coexist during a migration window. Prefer mapping v1 and v2 responses from shared application logic rather than duplicating database behavior. Publish the replacement, migration steps, and retirement timeline before removing v1.

## Production considerations

- Choose an OpenAPI specification version supported by the team's documentation, validation, and client-generation tools.
- Keep `openapi.json` in the same review workflow as the routes and schemas it describes.
- Configure production server URLs and decide whether interactive documentation should be public, authenticated, or disabled.
- Keep bearer tokens and private hostnames out of committed examples and documents.
- Match `requireAuth`, validation, status codes, and response bodies to the documented behavior.
- Review changes for compatibility with deployed web and mobile clients; do not treat every additive change as safe.
- Keep the linter version locked and update it through normal dependency review.
- Linting checks the description's structure; it does not enforce authorization or validate every live response.

## Chapter navigation

| Previous chapter | Chapter Q&A | Next chapter |
| --- | --- | --- |
| [057 - Logging and request tracing](../lessons/057-logging-and-request-tracing.md) | [Q&A](../qnas/058-api-documentation-and-versioning.md) | [059 - Test Express routes and services](../lessons/059-test-express-routes-and-services.md) |
