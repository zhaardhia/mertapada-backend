const express = require("express");
const response = require("../../components/response");
const router = express.Router();

const index = function (req, res, next) {
  response.res404(res);
};

router.all("/", index);
router.all("/connect", (req, res, next) => {
  response.res200(res, '000', 'Connection Established')
});

// router.all('/', index);
router.use("/test", require("./test"));
router.use("/user-pengelola", require("./user-pengelola"));
router.use("/daily-report", require("./daily-report"));

router.all('*', index);

module.exports = router;
