const { models } = require('./src/config/db');

async function run() {
    const plans = await models.MembershipPlans.findAll();
    console.log("PLANS:", JSON.stringify(plans, null, 2));
    
    const services = await models.Services.findAll();
    console.log("SERVICES:", JSON.stringify(services, null, 2));
    process.exit(0);
}

run();
