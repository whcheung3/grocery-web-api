const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  // Universal Product Code, UPC-A barcode contains 12 digits
  upc: String,
  // product category, can have more than one category
  category: [String],
  // product brand name
  brand: String,
  // product name
  name: String,
  // product size, e.g. 500 / 1.2
  size: Number,
  // product unit, e.g. ml / g / lb
  unit: String,
  // product picture url
  image: String,
  // product price history, keep different prices in array
  history: [
    {
      store: String, // store name
      price: Number, // sale price
      valid_to: Date, // sale ends date
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

  getAllProducts(page, perPage, q) {
    let regex = new RegExp(q, "i");

    if (+page && +perPage) {
      return this.Product.find({
        $or: [
          { name: regex },
          { category: regex },
          { brand: regex },
          { upc: q }, // UPC must be exactly matched
        ],
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
    return this.Product.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();
  }

  addNewHistoryById(data, id) {
    return this.Product.findByIdAndUpdate(
      id,
      { $addToSet: { history: data } },
      { new: true }
    ).exec();
  }

  deleteHistoryByHistoryId(historyId, id) {
    return this.Product.findByIdAndUpdate(
      id,
      { $pull: { history: { _id: historyId } } },
      { new: true }
    ).exec();
  }

  deleteProductById(id) {
    return this.Product.deleteOne({ _id: id }).exec();
  }
};
