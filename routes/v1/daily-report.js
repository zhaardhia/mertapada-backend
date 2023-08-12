const apicache = require("apicache");
const cache = apicache.middleware;
const response = require("../../components/response");
const { body, param, query, validationResult } = require("express-validator");
const validator = require("../../middlewares/validator");
const verifyToken = require("../../middlewares/verifyToken")
const express = require("express");
const router = express.Router();

const dailyReportController = require("../../controllers/DailyReport");

const index = function (req, res, next) {
  response.res404(res);
};

// router.route("/")
  // .get(verifyToken.verifyToken, (req, res, next) => {
  //   userPengelolaController.getAllUidWithNoOss(req, res).catch((error) => {
  //     console.error(error);
  //     return response.res500(res, "Internal system error, please try again later!");
  //   });
  // })

router.route("/date-in-month")
  .get((req, res, next) => {
    dailyReportController.checkDateInThisMonth(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/check-category")
  .get((req, res, next) => {
    dailyReportController.getIsCategoryFilled(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/item-shopped-by-category")
  .get((req, res, next) => {
    dailyReportController.getItemShoppedByCategory(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
  .post((req, res, next) => {
    dailyReportController.addItemShopDailyReport(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
  .delete((req, res, next) => {
    dailyReportController.deleteDailyShopItemReport(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/verify-shopped-by-category")
  .put((req, res, next) => {
    dailyReportController.verifiedExpenseAllCategoryItem(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/omset-absence-status")
  .get((req, res, next) => {
    dailyReportController.getStatusOmsetAndAbsenceToday(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/omset")
  .get((req, res, next) => {
    dailyReportController.getOmsetForThisDay(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
  .post((req, res, next) => {
    dailyReportController.insertUpdateOmzet(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/absence")
  .get((req, res, next) => {
    dailyReportController.getAbsence(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
  .post((req, res, next) => {
    dailyReportController.insertUpdateOmzet(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/verify-final")
  .put((req, res, next) => {
    dailyReportController.verifiedOmsetAndAbsence(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })


router.all("*", index);

module.exports = router;