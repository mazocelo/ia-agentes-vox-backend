var express = require('express');
var router = express.Router();
var { createAgent } = require('../controllers/agents');

/* GET users listing. */
router.post('/create', async function (req, res, next) {
  const { agent } = req.body;
  const clientId = req.user.org;
  if (!clientId || !agent) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  await createAgent(clientId, agent)
    .then((agent) => {
      res.status(201).json(agent);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;
