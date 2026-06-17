var DataTypes = require("sequelize").DataTypes;
var _AIConsultations = require("./AIConsultations");
var _Announcements = require("./Announcements");
var _Appointments = require("./Appointments");
var _ChatMessages = require("./ChatMessages");
var _MealPlans = require("./MealPlans");
var _MemberMemberships = require("./MemberMemberships");
var _MemberServices = require("./MemberServices");
var _Members = require("./Members");
var _MembershipPlans = require("./MembershipPlans");
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

function initModels(sequelize) {
  var AIConsultations = _AIConsultations(sequelize, DataTypes);
  var Announcements = _Announcements(sequelize, DataTypes);
  var Appointments = _Appointments(sequelize, DataTypes);
  var ChatMessages = _ChatMessages(sequelize, DataTypes);
  var MealPlans = _MealPlans(sequelize, DataTypes);
  var MemberMemberships = _MemberMemberships(sequelize, DataTypes);
  var MemberServices = _MemberServices(sequelize, DataTypes);
  var Members = _Members(sequelize, DataTypes);
  var MembershipPlans = _MembershipPlans(sequelize, DataTypes);
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

  AIConsultations.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(AIConsultations, { as: "AIConsultations", foreignKey: "member_id"});
  Appointments.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(Appointments, { as: "Appointments", foreignKey: "member_id"});
  MealPlans.belongsTo(Members, { as: "member", foreignKey: "member_id"});
  Members.hasMany(MealPlans, { as: "MealPlans", foreignKey: "member_id"});
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
  Users.belongsTo(Roles, { as: "role", foreignKey: "role_id"});
  Roles.hasMany(Users, { as: "Users", foreignKey: "role_id"});
  MemberServices.belongsTo(Services, { as: "service", foreignKey: "service_id"});
  Services.hasMany(MemberServices, { as: "MemberServices", foreignKey: "service_id"});
  Reports.belongsTo(Services, { as: "reported_service", foreignKey: "reported_service_id"});
  Services.hasMany(Reports, { as: "Reports", foreignKey: "reported_service_id"});
  Appointments.belongsTo(TrainerSchedules, { as: "schedule", foreignKey: "schedule_id"});
  TrainerSchedules.hasMany(Appointments, { as: "Appointments", foreignKey: "schedule_id"});
  MealPlans.belongsTo(Trainers, { as: "trainer", foreignKey: "trainer_id"});
  Trainers.hasMany(MealPlans, { as: "MealPlans", foreignKey: "trainer_id"});
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

  return {
    AIConsultations,
    Announcements,
    Appointments,
    ChatMessages,
    MealPlans,
    MemberMemberships,
    MemberServices,
    Members,
    MembershipPlans,
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
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
