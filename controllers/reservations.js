let reservationModel = require("../schemas/reservations");
let cartModel = require("../schemas/cart");
let productModel = require("../schemas/products");
let mongoose = require("mongoose");

module.exports = {
  // Get all reservations của user
  GetReservationsByUser: async function (userId) {
    return await reservationModel
      .findOne({
        user: userId,
      })
      .populate("items.product");
  },

  // Get reservation by ID của user
  GetReservationById: async function (reservationId, userId) {
    return await reservationModel
      .findOne({
        _id: reservationId,
        user: userId,
      })
      .populate("items.product");
  },

  // Reserve toàn bộ cart
  ReserveACart: async function (userId, session) {
    // Tìm cart của user
    let cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product");
    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Tính toán giá và tổng tiền
    let items = [];
    let totalAmount = 0;

    for (let item of cart.items) {
      let subtotal = item.product.price * item.quantity;
      items.push({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: subtotal,
      });
      totalAmount += subtotal;
    }

    // Tạo hoặc update reservation
    let reservation = await reservationModel.findOneAndUpdate(
      { user: userId },
      {
        items: items,
        totalAmount: totalAmount,
        status: "actived",
        ExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      {
        upsert: true,
        new: true,
        session: session,
      },
    );

    // Xóa cart sau khi reserve
    await cartModel.findOneAndUpdate(
      { user: userId },
      { items: [] },
      { session: session },
    );

    return reservation;
  },

  // Reserve specific items
  ReserveItems: async function (userId, itemsList, session) {
    let items = [];
    let totalAmount = 0;

    // Validate và tính toán cho từng item
    for (let item of itemsList) {
      let product = await productModel.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }

      let subtotal = product.price * item.quantity;
      items.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        subtotal: subtotal,
      });
      totalAmount += subtotal;
    }

    // Tạo hoặc update reservation
    let reservation = await reservationModel.findOneAndUpdate(
      { user: userId },
      {
        items: items,
        totalAmount: totalAmount,
        status: "actived",
        ExpiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      {
        upsert: true,
        new: true,
        session: session,
      },
    );

    return reservation;
  },

  // Cancel reservation
  CancelReserve: async function (reservationId, userId) {
    return await reservationModel.findOneAndUpdate(
      {
        _id: reservationId,
        user: userId,
      },
      {
        status: "cancelled",
      },
      { new: true },
    );
  },
};
