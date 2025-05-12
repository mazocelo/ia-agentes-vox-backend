module.exports = async function answer(question, agent) {
    let response = await agent.invoke({ question });
    return response;
}
