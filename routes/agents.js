var express = require('express');
var router = express.Router();
var agenteController = require('../controllers/agents');

/* GET users listing. */
router.post('/create', async function (req, res, next) {
  const { agent } = req.body;
  const clientId = req.user.org;
  if (!clientId || !agent) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    let newAgent = await agenteController.createAgent(clientId, agent)
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
    const agents = await agenteController.getAgents(clientId);
    res.status(200).json({ success: true, agents });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/:id", async function (req, res, next) {
  const clientId = req.user.org;
  const { id } = req.params;
  if (!clientId || !id) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const agent = await agenteController.getAgents(clientId, id);
    res.status(200).json({ success: true, agent });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post("/update/:id", async function (req, res, next) {
  const clientId = req.user.org;
  const { id } = req.params;
  const { agent } = req.body;
  if (!clientId || !id || !agent) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    let newAgent = await agenteController.editAgent(id, agent)
    res.status(201).json({ success: true, agent: newAgent });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

router.delete("/delete/:id", async function (req, res, next) {
  const clientId = req.user.org;
  const { id } = req.params;
  if (!clientId || !id) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    let result = await agenteController.deleteAgent(clientId, id)
    res.status(200).json({ success: true, result });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// router.post("/start/:id", async function (req, res, next) {
//   const clientId = req.user.org;
//   const { id } = req.params;
//   if (!clientId || !id) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }
//   try {
//     let newAgent = await agenteController.startAgent(id)
//     res.status(201).json({ success: true, agent: newAgent });
//   }
//   catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// })

// router.post("/stop/:id", async function (req, res, next) {
//   const clientId = req.user.org;
//   const { id } = req.params;
//   if (!clientId || !id) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }
//   try {
//     let newAgent = await agenteController.stopAgent(id)
//     res.status(201).json({ success: true, agent: newAgent });
//   }
//   catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// })


module.exports = router;
