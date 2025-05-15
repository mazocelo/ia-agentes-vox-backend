var express = require('express');
var router = express.Router();
const { Agent } = require('../Models');
const { askAgent } = require('../controllers/chat');

router.post('/ask', async function (req, res, next) {
    const { api_key, question, ticket } = req.body;
    if (!api_key || !question) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const agent = await Agent.findOne({ where: { api_key } });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        let response = await askAgent(agent, ticket, question);
        res.status(200).json({ success: true, response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router;