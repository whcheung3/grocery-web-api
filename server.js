const express = require("express");
const app = express();
const router = express.Router();
const cors = require("cors");
const dotenv = require("dotenv").config();
const ProductsDB = require("./modules/productsDB");
const db = new ProductsDB();
const HTTP_PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

app.use(cors());
app.use(express.json());
app.use("/api/v1", router);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Confirm server is on
router.get("/", function (req, res) {
  res.status(200).json({ message: "API Listening" });
});

// Get all products
router.get("/products", function (req, res) {
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
      else res.status(404).json({ message: "No Products" });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Get All Products: ${error}` });
    });
});

// Get one product
router.get("/products/:id", function (req, res) {
  db.getProductById(req.params.id)
    .then((data) => {
      if (data) res.status(200).json(data);
      else res.status(404).json({ message: "Product Not Found" });
    })
    .catch((error) => {
      res.status(500).json({ message: `Unable to Get Product: ${error}` });
    });
});

// Add new product
// Expect a JSON object in body, e.g. { "upc": 012345678901, "category": [ "bread" ], "brand": "Wonder" }
router.post("/products", function (req, res) {
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
router.put("/products/:id", function (req, res) {
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
router.put("/products/:id/add", function (req, res) {
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
router.delete("/products/:id/delete/:historyId", function (req, res) {
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
router.delete("/products/:id", function (req, res) {
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
