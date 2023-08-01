const apicache = require("apicache");
const cache = apicache.middleware;
const response = require("../../components/response");
const { body, param, query, validationResult } = require("express-validator");
const validator = require("../../middlewares/validator");
const verifyToken = require("../../middlewares/verifyToken")
const express = require("express");
const router = express.Router();

const userPengelolaController = require("../../controllers/UserPengelola");

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

// router.route("/user-info")
//   .get(verifyToken.verifyToken, (req, res, next) => {
//     userPengelolaController.getUserById(req, res).catch((error) => {
//       console.error(error);
//       return response.res500(res, "Internal system error, please try again later!");
//     });
//   })
//   .put(verifyToken.verifyToken, (req, res, next) => {
//     userPengelolaController.updateUserProfile(req, res).catch((error) => {
//       console.error(error);
//       return response.res500(res, "Internal system error, please try again later!");
//     });
//   })

router.route("/register-user")
  .post((req, res, next) => {
    userPengelolaController.registerUser(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/login-user")
  .post((req, res, next) => {
    userPengelolaController.login(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/token")
  .get((req, res, next) => {
    userPengelolaController.refreshToken(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.route("/logout-user")
  .delete((req, res, next) => {
    userPengelolaController.logout(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
router.route("/forgot-password")
  .post((req, res, next) => {
    userPengelolaController.sendEmailAddressForgotPass(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })
router.route("/change-password")
  .post((req, res, next) => {
    userPengelolaController.changePassword(req, res).catch((error) => {
      console.error(error);
      return response.res500(res, "Internal system error, please try again later!");
    });
  })

router.all("*", index);

module.exports = router;