const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  // Universal Product Code, UPC-A barcode contains 12 digits
  upc: {
    type: String,
    minLength: 12,
    maxLength: 12,
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

  getAllProducts(page, perPage, name) {
    if (+page && +perPage) {
      return this.Product.find({
        name: { $regex: new RegExp(name, "i") },
      })
        .sort({ "history.valid_to": -1 })
        .skip((page - 1) * +perPage)
        .limit(+perPage)
        .exec();
    }

    return Promise.reject(
      new Error("page and perPage query parameters must be valid numbers")
    );
  }

  getProductById(id) {
    return this.Product.findOne({ _id: id }).exec();
  }

  updateProductById(data, id) {
    // return this.Product.updateOne({ _id: id }, { $set: data }).exec();
    return this.Product.updateOne(
      { _id: id },
      { $set: { history: { $concatArrays: ["$history", [data]] } } }
    ).exec();
  }

  deleteProductById(id) {
    return this.Product.deleteOne({ _id: id }).exec();
  }
};
