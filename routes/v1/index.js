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
router.use("/user-investor", require("./user-investor"));
router.use("/daily-report", require("./daily-report"));
router.use("/daily-report-investor", require("./daily-report-investor"));
router.use("/daily-shop-item", require("./daily-shop-item"));
router.use("/employee", require("./employee"));
router.use("/biaya-sewa", require("./biaya-sewa"));
router.use("/monthly-recap-pengelola", require("./monthly-recap-pengelola"));
router.use("/monthly-recap", require("./monthly-recap"));
router.use("/bulanan-tambahan", require("./bulanan-tambahan"));

router.all('*', index);

module.exports = router;
