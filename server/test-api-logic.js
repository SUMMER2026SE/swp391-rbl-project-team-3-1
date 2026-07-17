const { models, sequelize } = require('./src/config/db');

async function run() {
  sequelize.options.logging = false;
  try {
    const payments = await models.Payments.findAll({
      where: { payment_status: 'Paid' }
    });
    console.log('Payments fetched:', payments.length);

    let totalRevenue = 0;
    let membershipRevenue = 0;
    let serviceRevenue = 0;

    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      totalRevenue += amt;
      if (p.payment_type === 'Membership') {
        membershipRevenue += amt;
      } else if (p.payment_type === 'Service') {
        serviceRevenue += amt;
      } else {
        membershipRevenue += amt;
      }
    });

    console.log('computed basic revenues:', totalRevenue, membershipRevenue, serviceRevenue);

    const memberMemberships = await models.MemberMemberships.findAll({
      include: [{
        model: models.MembershipPlans,
        as: 'membership_plan'
      }]
    });
    console.log('memberships fetched:', memberMemberships.length);

    const packageCountMap = {};
    memberMemberships.forEach(m => {
      if (m.membership_plan) {
        const planId = m.membership_plan.membership_plan_id;
        if (!packageCountMap[planId]) {
          packageCountMap[planId] = {
            id: planId,
            name: m.membership_plan.plan_name,
            price: Number(m.membership_plan.price) || 0,
            duration: m.membership_plan.duration_months,
            sportType: m.membership_plan.sport_type,
            count: 0
          };
        }
        packageCountMap[planId].count += 1;
      }
    });

    let packagesResult = Object.values(packageCountMap).map(pkg => ({
      ...pkg,
      totalRevenue: pkg.price * pkg.count
    }));
    packagesResult.sort((a, b) => b.count - a.count);
    console.log('packagesResult:', packagesResult.length);

    const memberServices = await models.MemberServices.findAll({
      include: [{
        model: models.Services,
        as: 'service'
      }]
    });
    console.log('memberServices fetched:', memberServices.length);

    const serviceCountMap = {};
    memberServices.forEach(ms => {
      if (ms.service) {
        const srvId = ms.service.service_id;
        if (!serviceCountMap[srvId]) {
          serviceCountMap[srvId] = {
            id: srvId,
            name: ms.service.service_name,
            price: Number(ms.service.price) || 0,
            description: ms.service.description || '',
            count: 0
          };
        }
        serviceCountMap[srvId].count += 1;
      }
    });

    let servicesResult = Object.values(serviceCountMap).map(srv => ({
      ...srv,
      totalRevenue: srv.price * srv.count
    }));
    servicesResult.sort((a, b) => b.count - a.count);
    console.log('servicesResult:', servicesResult.length);

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
    console.log('workoutPlans fetched:', workoutPlans.length);

    const appointments = await models.Appointments.findAll({
      include: [{
        model: models.TrainerSchedules,
        as: 'schedule',
        attributes: ['trainer_id']
      }]
    });
    console.log('appointments fetched:', appointments.length);

    const ptAppointmentCounts = {};
    appointments.forEach(appt => {
      if (appt.schedule && appt.schedule.trainer_id) {
        const tId = appt.schedule.trainer_id;
        ptAppointmentCounts[tId] = (ptAppointmentCounts[tId] || 0) + 1;
      }
    });

    const trainerCountMap = {};
    workoutPlans.forEach(wp => {
      if (wp.trainer) {
        const trainerId = wp.trainer.trainer_id;
        if (!trainerCountMap[trainerId]) {
          trainerCountMap[trainerId] = {
            id: trainerId,
            name: wp.trainer.user?.full_name || `PT ${trainerId}`,
            specialty: wp.trainer.specialization || 'Gym tổng hợp',
            experienceYears: wp.trainer.experience_years || 0,
            rating: wp.trainer.rating || 5.0,
            hiredCount: 0,
            sessionCount: ptAppointmentCounts[trainerId] || 0
          };
        }
        trainerCountMap[trainerId].hiredCount += 1;
      }
    });

    let trainersResult = Object.values(trainerCountMap);
    trainersResult.sort((a, b) => b.hiredCount - a.hiredCount);
    console.log('trainersResult:', trainersResult.length);

    const monthlyMap = {};
    const weeklyMap = {};
    
    const getStartOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      return monday.toISOString().split('T')[0];
    };

    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      const pDate = p.payment_date ? new Date(p.payment_date) : new Date();
      if (!isNaN(pDate.getTime())) {
        const year = pDate.getFullYear();
        const monthNum = pDate.getMonth() + 1;
        const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            year,
            month: `T${monthNum}`,
            monthKey,
            total: 0,
            membership: 0,
            service: 0,
            expense: 0,
            profit: 0
          };
        }
        monthlyMap[monthKey].total += amt;
        if (p.payment_type === 'Membership') {
          monthlyMap[monthKey].membership += amt;
        } else if (p.payment_type === 'Service') {
          monthlyMap[monthKey].service += amt;
        } else {
          monthlyMap[monthKey].membership += amt;
        }

        const weekKey = getStartOfWeek(pDate);
        if (!weeklyMap[weekKey]) {
          weeklyMap[weekKey] = {
            weekStart: weekKey,
            total: 0,
            membership: 0,
            service: 0,
            expense: 0,
            profit: 0
          };
        }
        weeklyMap[weekKey].total += amt;
        if (p.payment_type === 'Membership') {
          weeklyMap[weekKey].membership += amt;
        } else if (p.payment_type === 'Service') {
          weeklyMap[weekKey].service += amt;
        } else {
          weeklyMap[weekKey].membership += amt;
        }
      }
    });

    Object.keys(monthlyMap).forEach(key => {
      const m = monthlyMap[key];
      m.expense = Math.round(m.total * 0.6);
      m.profit = m.total - m.expense;
    });

    Object.keys(weeklyMap).forEach(key => {
      const w = weeklyMap[key];
      w.expense = Math.round(w.total * 0.6);
      w.profit = w.total - w.expense;
    });

    const monthlyAnalytics = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const weeklyAnalytics = Object.values(weeklyMap).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    console.log('Successfully completed logic!');
    console.log('monthlyAnalytics length:', monthlyAnalytics.length);
    console.log('weeklyAnalytics length:', weeklyAnalytics.length);

  } catch (err) {
    console.error('ERROR OCCURRED IN LOGIC:', err);
  } finally {
    await sequelize.close();
  }
}

run();
