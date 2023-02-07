const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  // Universal Product Code, UPC-A barcode contains 12 digits
  upc: {
    type: String,
    minLength: 12,
    maxLength: 12,
    unique: true,
  },
  // product category, can have more than one category
  category: [String],
  // product brand name
  brand: String,
  // product name
  name: String,
  // product size with unit, e.g. 500ml / 450g / 18lb
  size: String,
  // product picture url
  image: String,
  // product price history, keep different prices in array
  history: [
    {
      store: String, // store name
      was_price: Number, // original price
      price: Number, // sale price
      valid_to: Date, // price valid date
    },
  ],
});

module.exports = class ProductsDB {
  constructor() {
    // We don't have a `Product` object until initialize() is complete
    this.Product = null;
  }

  // Pass the connection string to `initialize()`
  initialize(connectionString) {
    return new Promise((resolve, reject) => {
      const db = mongoose.createConnection(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      db.once("error", (error) => {
        reject(error);
      });
      db.once("open", () => {
        this.Product = db.model("products", productSchema);
        resolve();
      });
    });
  }

  async addNewProduct(data) {
    const newProduct = new this.Product(data);
    await newProduct.save();
    return newProduct;
  }

  getAllProducts(page, perPage, category) {
    let findBy = category ? { category } : {};

    if (+page && +perPage) {
      return this.Product.find(findBy)
        .sort({ "history.valid_to": -1 })
        .skip((page - 1) * +perPage)
        .limit(+perPage)
        .exec();
    }

    return Promise.reject(
      new Error("page and perPage query parameters must be valid numbers")
    );
  }

  getProductByUpc(upc) {
    return this.Product.findOne({ upc: upc }).exec();
  }

  updateProductByUpc(data, upc) {
    // return this.Product.updateOne({ upc: upc }, { $set: data }).exec();
    return this.Product.updateOne(
      { upc: upc },
      { $set: { history: { $concatArrays: ["$history", [data]] } } }
    ).exec();
  }

  deleteProductByUpc(upc) {
    return this.Product.deleteOne({ upc: upc }).exec();
  }
};
