const apicache = require("apicache");
const cache = apicache.middleware;
const response = require("../../components/response");
const { body, param, query, validationResult } = require("express-validator");
const validator = require("../../middlewares/validator");
const verifyToken = require("../../middlewares/verifyToken")
const express = require("express");
const router = express.Router();

const userInvestorController = require("../../controllers/UserInvestor");

const index = function (req, res, next) {
  response.res404(res);
};

// router.route("/")
  // .get(verifyToken.verifyToken, (req, res, next) => {
  //   userInvestorController.getAllUidWithNoOss(req, res).catch((error) => {
  //     console.error(error);
  //     return response.res500(res, "Internal system error, please try again later!");
  //   });
  // })

// router.route("/user-info")
//   .get(verifyToken.verifyToken, (req, res, next) => {
//     userInvestorController.getUserById(req, res).catch((error) => {
//       console.error(error);
//       return response.res500(res, "Internal system error, please try again later!");
//     });
//   })
//   .put(verifyToken.verifyToken, (req, res, next) => {
//     userInvestorController.updateUserProfile(req, res).catch((error) => {
//       console.error(error);
//       return response.res500(res, "Internal system error, please try again later!");
//     });
//   })

router.route("/register-user")
  .post((req, res, next) => {
    userInvestorController.registerUser(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/login-user")
  .post((req, res, next) => {
    userInvestorController.login(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/token")
  .get((req, res, next) => {
    userInvestorController.refreshToken(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/logout-user")
  .delete((req, res, next) => {
    userInvestorController.logout(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
router.route("/forgot-password")
  .post((req, res, next) => {
    userInvestorController.sendEmailAddressForgotPass(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
router.route("/change-password")
  .post((req, res, next) => {
    userInvestorController.changePassword(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.all("*", index);

module.exports = router;