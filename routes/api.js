const express = require("express")
const router = express.Router()

const IndexController = require("../controllers/index.controller");
const ContentController = require("../controllers/Content.controller");
const { validate } = require("../middlewares/validators/wrapper.validator")
const { indexValidator } = require("../middlewares/validators/index.validations")

router.get("/user/watchlisted", IndexController.getWatchlist);
router.get("/user/suggestion", IndexController.getSuggestion);
router.get("/user/suggestioncount", IndexController.getSuggestionCount);
router.get("/content", ContentController.getContent);
router.post("/content/onboard", ContentController.contentOnboard);
router.post("/content/vote", ContentController.vote);
router.post("/user/onboard", IndexController.userOnboard);
module.exports = router
