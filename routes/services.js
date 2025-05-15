var express = require('express');
var router = express.Router();
const { Agent } = require('../Models');

router.get('/voxchat/agents/:tenant_id', async function (req, res, next) {
    const { tenant_id } = req.params;
    if (!tenant_id) {
        return res.status(400).json({ error: 'Tenant ID is required' });
    }
    try {
        const agents = await Agent.findAll({ where: { tenant_id } });
        if (!agents) {
            return res.status(404).json({ error: 'No agents found' });
        }
        res.status(200).json({ success: true, agents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = router;
