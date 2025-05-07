var express = require('express');
var router = express.Router();
var { createAgent } = require('../controllers/agents');
const agents = require('../agents/shared/agents');

/* GET users listing. */
router.post('/create', async function (req, res, next) {
  const { agent } = req.body;
  const clientId = req.user.org;
  if (!clientId || !agent) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  await createAgent(clientId, agent)
    .then((agent) => {
      console.log(agent);
      res.status(201).json({ success: true, agent });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

router.get("/all",async function (req, res, next) {
  const clientId = req.user.org;
  if (!clientId) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  let orgAgents = [];
  if (agents.size > 0) {
   for(const [key, value] of agents) {
      if (key === clientId) {
        orgAgents.push({clientId: key, agent: value});
      }
    }
  }
  // if (orgAgents.length === 0) {
  //   return res.status(404).json({ error: 'No agents found for this organization' });
  // }
  res.status(200).json({success: true, agents: orgAgents });

});

module.exports = router;
