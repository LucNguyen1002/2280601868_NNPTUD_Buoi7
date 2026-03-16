var express = require("express");
var router = express.Router();
let reservationController = require("../controllers/reservations");
let authHandler = require("../utils/authHandler");
let mongoose = require("mongoose");

// GET all reservations của user
router.get("/", authHandler.checkLogin, async function (req, res, next) {
  try {
    let userId = req.userId;
    let reservations =
      await reservationController.GetReservationsByUser(userId);

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET reservation by ID
router.get("/:id", authHandler.checkLogin, async function (req, res, next) {
  try {
    let userId = req.userId;
    let reservationId = req.params.id;

    let reservation = await reservationController.GetReservationById(
      reservationId,
      userId,
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// POST reserve toàn bộ cart
router.post(
  "/reserveACart",
  authHandler.checkLogin,
  async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let userId = req.userId;

      let reservation = await reservationController.ReserveACart(
        userId,
        session,
      );

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Cart reserved successfully",
        data: reservation,
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  },
);

// POST reserve specific items
router.post(
  "/reserveItems",
  authHandler.checkLogin,
  async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let userId = req.userId;
      let { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Items list is required and must be a non-empty array",
        });
      }

      // Validate items format
      for (let item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: "Each item must have product ID and positive quantity",
          });
        }
      }

      let reservation = await reservationController.ReserveItems(
        userId,
        items,
        session,
      );

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: "Items reserved successfully",
        data: reservation,
      });
    } catch (error) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } finally {
      session.endSession();
    }
  },
);

// POST cancel reservation
router.post(
  "/cancelReserve/:id",
  authHandler.checkLogin,
  async function (req, res, next) {
    try {
      let userId = req.userId;
      let reservationId = req.params.id;

      let reservation = await reservationController.CancelReserve(
        reservationId,
        userId,
      );

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reservation not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Reservation cancelled successfully",
        data: reservation,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

module.exports = router;
