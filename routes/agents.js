var express = require('express');
var router = express.Router();
var { createAgent, getAgents } = require('../controllers/agents');

/* GET users listing. */
router.post('/create', async function (req, res, next) {
  const { agent } = req.body;
  const clientId = req.user.org;
  if (!clientId || !agent) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    let newAgent = await createAgent(clientId, agent)
    res.status(201).json({ success: true, agent: newAgent });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/all", async function (req, res, next) {
  const clientId = req.user.org;
  if (!clientId) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const agents = await getAgents(clientId);
    res.status(200).json({ success: true, agents });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
