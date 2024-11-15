const  router  = require("express").Router();
const suggestionHistoryController = require("~/controllers/suggestion-history.controller");
router.get('/',suggestionHistoryController.getImportSuggestion)
module.exports = router