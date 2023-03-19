const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const ProductsDB = require("./modules/productsDB");
const db = new ProductsDB();
const HTTP_PORT = process.env.PORT || 8080;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Confirm server is on
app.get("/", function (req, res) {
  res.json({ message: "API Listening" });
});

// Get all products
app.get("/api/products", function (req, res) {
  let queryPromise = null;

  if (req.query.q) {
    queryPromise = db.getAllProducts(
      req.query.page,
      req.query.perPage,
      req.query.q
    );
  } else {
    queryPromise = db.getAllProducts(req.query.page, req.query.perPage);
  }

  queryPromise
    .then((data) => {
      if (data) res.status(200).json(data);
      else res.json({ message: "No Products" });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Get All Products: ${error}` });
    });
});

// Get one product
app.get("/api/products/:id", function (req, res) {
  db.getProductById(req.params.id)
    .then((data) => {
      if (data) res.status(200).json(data);
      else res.json({ message: "Product Not Found" });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Get Product: ${error}` });
    });
});

// Add new product
// Expect a JSON object in body, e.g. { "upc": 012345678901, "category": [ "bread" ], "brand": "Wonder" }
app.post("/api/products", function (req, res) {
  db.addNewProduct(req.body)
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Add Product: ${error}` });
    });
});

// Update product
// Expect a JSON object in body, e.g. { "brand": "Wonder", "name": "White Bread" }
app.put("/api/products/:id", function (req, res) {
  db.updateProductById(req.body, req.params.id)
    .then(() => {
      res.status(200).json({ message: `Product Updated: ${req.params.id}` });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Update Product: ${error}` });
    });
});

// Add new price history of product
// Expect a JSON object in body, e.g. { store: "No Frills", price: 9.99, valid_to: "2023-02-04" }
app.put("/api/products/:id/add", function (req, res) {
  db.addNewHistoryById(req.body, req.params.id)
    .then(() => {
      res
        .status(200)
        .json({ message: `New Price History Added: ${req.params.id}` });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: `Unable to Add New Price History : ${error}` });
    });
});

// Delete price history of product
// Expect a history objectID in URL, e.g. /63f41f2fe67f7c330b2b0832
app.delete("/api/products/:id/delete/:historyId", function (req, res) {
  db.deleteHistoryByHistoryId(req.params.historyId, req.params.id)
    .then(() => {
      res
        .status(204)
        .json({ message: `Price History Deleted: ${req.params.id}` });
    })
    .catch((error) => {
      res
        .status(500)
        .json({ message: `Unable to Delete Price History : ${error}` });
    });
});

// Delete product
app.delete("/api/products/:id", function (req, res) {
  db.deleteProductById(req.params.id)
    .then(() => {
      res.status(204).json({ message: `Product Deleted: ${req.params.id}` });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Delete Product: ${error}` });
    });
});

// 404
app.use((req, res) => {
  res.status(404).send("Resource not found");
});

db.initialize(process.env.MONGODB_CONN_STRING)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
