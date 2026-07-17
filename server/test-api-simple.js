const { models, sequelize } = require('./src/config/db');

async function run() {
  sequelize.options.logging = false;
  try {
    const paymentCount = await models.Payments.count();
    console.log('Payment count now:', paymentCount);
    
    const payments = await models.Payments.findAll({
      where: { payment_status: 'Paid' }
    });
    console.log('Successfully fetched payments:', payments.length);
    
    const memberMemberships = await models.MemberMemberships.findAll({
      include: [{
        model: models.MembershipPlans,
        as: 'membership_plan'
      }]
    });
    console.log('Successfully fetched memberships:', memberMemberships.length);
    
    const memberServices = await models.MemberServices.findAll({
      include: [{
        model: models.Services,
        as: 'service'
      }]
    });
    console.log('Successfully fetched services:', memberServices.length);

    const workoutPlans = await models.WorkoutPlans.findAll({
      include: [{
        model: models.Trainers,
        as: 'trainer',
        include: [{
          model: models.Users,
          as: 'user',
          attributes: ['full_name']
        }]
      }]
    });
    console.log('Successfully fetched workoutPlans:', workoutPlans.length);

    const appointments = await models.Appointments.findAll({
      include: [{
        model: models.TrainerSchedules,
        as: 'schedule',
        attributes: ['trainer_id']
      }]
    });
    console.log('Successfully fetched appointments:', appointments.length);

  } catch (err) {
    console.error('ERROR OCCURRED IN DB QUERIES:', err);
  } finally {
    await sequelize.close();
  }
}

run();
