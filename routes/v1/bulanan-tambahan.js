const apicache = require("apicache");
const cache = apicache.middleware;
const response = require("../../components/response");
const { body, param, query, validationResult } = require("express-validator");
const validator = require("../../middlewares/validator");
const verifyToken = require("../../middlewares/verifyToken")
const express = require("express");
const router = express.Router();

const bulananTambahanController = require("../../controllers/BulananTambahan");

const index = function (req, res, next) {
  response.res404(res);
};

router.route("/")
  .post((req, res, next) => {
    bulananTambahanController.insertOrUpdateAdditionalMonthlyExpense(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
  .delete((req, res, next) => {
    bulananTambahanController.deleteAdditionalMonthlyExpense(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/verifikasi")
  .post((req, res, next) => {
    bulananTambahanController.verifyMonthlySpending(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.all("*", index);

module.exports = router;