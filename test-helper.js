// Test helper để tạo dữ liệu test
let mongoose = require("mongoose");
let productModel = require("./schemas/products");
let slugify = require("slugify");

async function createTestProduct() {
  try {
    await mongoose.connect("mongodb://localhost:27017/NNPTUD-C2");

    let testProduct = new productModel({
      title: "Test Product for Reservation",
      slug: slugify("Test Product for Reservation", {
        replacement: "-",
        locale: "vi",
        trim: true,
      }),
      price: 150,
      description: "This is a test product for reservation testing",
      category: "electronics",
    });

    let savedProduct = await testProduct.save();
    console.log("Test product created:", savedProduct._id);

    mongoose.connection.close();
    return savedProduct._id;
  } catch (error) {
    console.error("Error creating test product:", error);
    mongoose.connection.close();
  }
}

createTestProduct();
