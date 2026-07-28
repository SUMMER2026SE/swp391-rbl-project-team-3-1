var DataTypes = require("sequelize").DataTypes;
var _AIConsultations = require("./AIConsultations");
var _Announcements = require("./Announcements");
var _Appointments = require("./Appointments");
var _ChatMessages = require("./ChatMessages");
var _MemberMemberships = require("./MemberMemberships");
var _MemberServices = require("./MemberServices");
var _Members = require("./Members");
var _MembershipPlans = require("./MembershipPlans");
var _MembershipPlanServices = require("./MembershipPlanServices");
var _Notifications = require("./Notifications");
var _Payments = require("./Payments");
var _ProgressTrackings = require("./ProgressTrackings");
var _Reports = require("./Reports");
var _Roles = require("./Roles");
var _Services = require("./Services");
var _TrainerCertifications = require("./TrainerCertifications");
var _TrainerSchedules = require("./TrainerSchedules");
var _Trainers = require("./Trainers");
var _Users = require("./Users");
var _WorkoutExercises = require("./WorkoutExercises");
var _WorkoutPlans = require("./WorkoutPlans");
var _AppConfigs = require("./AppConfigs");
var _PtOffRequests = require("./PtOffRequests");
var _PtBookings = require("./PtBookings");
var _MemberTrainerPackages = require("./MemberTrainerPackages");
var _CheckIns = require("./CheckIns");

function initModels(sequelize) {
  var AIConsultations = _AIConsultations(sequelize, DataTypes);
  var Announcements = _Announcements(sequelize, DataTypes);
  var Appointments = _Appointments(sequelize, DataTypes);
  var ChatMessages = _ChatMessages(sequelize, DataTypes);
  var MemberMemberships = _MemberMemberships(sequelize, DataTypes);
  var MemberServices = _MemberServices(sequelize, DataTypes);
  var Members = _Members(sequelize, DataTypes);
  var MembershipPlans = _MembershipPlans(sequelize, DataTypes);
  var MembershipPlanServices = _MembershipPlanServices(sequelize, DataTypes);
  var Notifications = _Notifications(sequelize, DataTypes);
  var Payments = _Payments(sequelize, DataTypes);
  var ProgressTrackings = _ProgressTrackings(sequelize, DataTypes);
  var Reports = _Reports(sequelize, DataTypes);
  var Roles = _Roles(sequelize, DataTypes);
  var Services = _Services(sequelize, DataTypes);
  var TrainerCertifications = _TrainerCertifications(sequelize, DataTypes);
  var TrainerSchedules = _TrainerSchedules(sequelize, DataTypes);
  var Trainers = _Trainers(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var WorkoutExercises = _WorkoutExercises(sequelize, DataTypes);
  var WorkoutPlans = _WorkoutPlans(sequelize, DataTypes);
  var AppConfigs = _AppConfigs(sequelize, DataTypes);
  var PtOffRequests = _PtOffRequests(sequelize, DataTypes);
  var PtBookings = _PtBookings(sequelize, DataTypes);
  var MemberTrainerPackages = _MemberTrainerPackages(sequelize, DataTypes);
  var CheckIns = _CheckIns(sequelize, DataTypes);

  AIConsultations.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(AIConsultations, { as: "AIConsultations", foreignKey: "member_id"});
  CheckIns.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(CheckIns, { as: "CheckIns", foreignKey: "member_id"});
  Appointments.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(Appointments, { as: "Appointments", foreignKey: "member_id"});
  MemberMemberships.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(MemberMemberships, { as: "MemberMemberships", foreignKey: "member_id"});
  MemberServices.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(MemberServices, { as: "MemberServices", foreignKey: "member_id"});
  Payments.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(Payments, { as: "Payments", foreignKey: "member_id"});
  ProgressTrackings.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(ProgressTrackings, { as: "ProgressTrackings", foreignKey: "member_id"});
  WorkoutPlans.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(WorkoutPlans, { as: "WorkoutPlans", foreignKey: "member_id"});
  MemberMemberships.belongsTo(MembershipPlans, { as: "membership_plan", foreignKey: "membership_plan_id"});
  MembershipPlans.hasMany(MemberMemberships, { as: "MemberMemberships", foreignKey: "membership_plan_id"});
  Reports.belongsTo(MembershipPlans, { as: "reported_membership_plan", foreignKey: "reported_membership_plan_id"});
  MembershipPlans.hasMany(Reports, { as: "Reports", foreignKey: "reported_membership_plan_id"});
  MembershipPlans.belongsToMany(Services, { as: 'IncludedServices', through: MembershipPlanServices, foreignKey: 'membership_plan_id', otherKey: 'service_id' });
  Services.belongsToMany(MembershipPlans, { as: 'MembershipPlans', through: MembershipPlanServices, foreignKey: 'service_id', otherKey: 'membership_plan_id' });
  MembershipPlanServices.belongsTo(MembershipPlans, { as: 'membership_plan', foreignKey: 'membership_plan_id'});
  MembershipPlans.hasMany(MembershipPlanServices, { as: 'MembershipPlanServices', foreignKey: 'membership_plan_id'});
  MembershipPlanServices.belongsTo(Services, { as: 'service', foreignKey: 'service_id'});
  Services.hasMany(MembershipPlanServices, { as: 'MembershipPlanServices', foreignKey: 'service_id'});
  Users.belongsTo(Roles, { as: "role", foreignKey: "role_id"});
  Roles.hasMany(Users, { as: "Users", foreignKey: "role_id"});
  MemberServices.belongsTo(Services, { as: "service", foreignKey: "service_id"});
  Services.hasMany(MemberServices, { as: "MemberServices", foreignKey: "service_id"});
  Reports.belongsTo(Services, { as: "reported_service", foreignKey: "reported_service_id"});
  Services.hasMany(Reports, { as: "Reports", foreignKey: "reported_service_id"});
  Appointments.belongsTo(TrainerSchedules, { as: "schedule", foreignKey: "schedule_id"});
  TrainerSchedules.hasMany(Appointments, { as: "Appointments", foreignKey: "schedule_id"});
  TrainerCertifications.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(TrainerCertifications, { as: "TrainerCertifications", foreignKey: "trainer_id"});
  TrainerSchedules.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(TrainerSchedules, { as: "TrainerSchedules", foreignKey: "trainer_id"});
  WorkoutPlans.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(WorkoutPlans, { as: "WorkoutPlans", foreignKey: "trainer_id"});
  Announcements.belongsTo(Users, { as: "admin", foreignKey: "admin_id"});
  Users.hasMany(Announcements, { as: "Announcements", foreignKey: "admin_id"});
  ChatMessages.belongsTo(Users, { as: "receiver", foreignKey: "receiver_id"});
  Users.hasMany(ChatMessages, { as: "ChatMessages", foreignKey: "receiver_id"});
  ChatMessages.belongsTo(Users, { as: "sender", foreignKey: "sender_id"});
  Users.hasMany(ChatMessages, { as: "sender_ChatMessages", foreignKey: "sender_id"});
  Members.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasOne(Members, { as: "Member", foreignKey: "user_id"});
  Notifications.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasMany(Notifications, { as: "Notifications", foreignKey: "user_id"});
  Reports.belongsTo(Users, { as: "reported_by_User", foreignKey: "reported_by"});
  Users.hasMany(Reports, { as: "Reports", foreignKey: "reported_by"});
  Reports.belongsTo(Users, { as: "reported_user", foreignKey: "reported_user_id"});
  Users.hasMany(Reports, { as: "reported_user_Reports", foreignKey: "reported_user_id"});
  Trainers.belongsTo(Users, { as: "user", foreignKey: "user_id"});
  Users.hasOne(Trainers, { as: "Trainer", foreignKey: "user_id"});
  WorkoutExercises.belongsTo(WorkoutPlans, { as: "workout_plan", foreignKey: "workout_plan_id"});
  WorkoutPlans.hasMany(WorkoutExercises, { as: "WorkoutExercises", foreignKey: "workout_plan_id"});
  PtOffRequests.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(PtOffRequests, { as: "PtOffRequests", foreignKey: "trainer_id"});

  PtBookings.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(PtBookings, { as: "PtBookings", foreignKey: "member_id"});
  PtBookings.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(PtBookings, { as: "PtBookings", foreignKey: "trainer_id"});

  MemberTrainerPackages.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(MemberTrainerPackages, { as: "MemberTrainerPackages", foreignKey: "member_id"});
  MemberTrainerPackages.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(MemberTrainerPackages, { as: "MemberTrainerPackages", foreignKey: "trainer_id"});

  return {
    AIConsultations,
    Announcements,
    Appointments,
    ChatMessages,
    MemberMemberships,
    MemberServices,
    Members,
    MembershipPlans,
    MembershipPlanServices,
    Notifications,
    Payments,
    ProgressTrackings,
    Reports,
    Roles,
    Services,
    TrainerCertifications,
    TrainerSchedules,
    Trainers,
    Users,
    WorkoutExercises,
    WorkoutPlans,
    AppConfigs,
    PtOffRequests,
    PtBookings,
    MemberTrainerPackages,
    CheckIns,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
