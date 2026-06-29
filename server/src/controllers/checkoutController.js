const { models, sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');

const PAYOS_CONFIG = {
    clientId: process.env.PAYOS_CLIENT_ID || '9dee94bc-3ae5-4281-b1b2-68d9a92ba510',
    apiKey: process.env.PAYOS_API_KEY || '01da77c4-e522-4bfe-8112-b539c38fec22',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '29b53698dd098c91beb564217793aa84880a567004e4e533553b487739288c54',
    apiBase: process.env.PAYOS_API_BASE || 'https://api-merchant.payos.vn'
};

const createPayosSignature = (data) => {
    const rawData = Object.keys(data)
        .sort()
        .map((key) => `${key}=${data[key]}`)
        .join('&');

    return crypto
        .createHmac('sha256', PAYOS_CONFIG.checksumKey)
        .update(rawData)
        .digest('hex');
};

const payosRequest = async (path, options = {}) => {
    const response = await fetch(`${PAYOS_CONFIG.apiBase}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-client-id': PAYOS_CONFIG.clientId,
            'x-api-key': PAYOS_CONFIG.apiKey,
            ...(options.headers || {})
        }
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.code !== '00') {
        const message = payload.desc || payload.message || `payOS request failed (${response.status})`;
        throw new Error(message);
    }

    return payload.data;
};

const getPayosPaymentInfo = async (orderCode) => {
    if (!orderCode) {
        throw new Error('Missing payOS orderCode');
    }

    return payosRequest(`/v2/payment-requests/${encodeURIComponent(orderCode)}`, {
        method: 'GET'
    });
};

const ensurePayosPaid = async (orderCode, expectedAmount) => {
    const paymentInfo = await getPayosPaymentInfo(orderCode);
    const paidAmount = Number(paymentInfo.amountPaid || paymentInfo.amount || 0);

    if (paymentInfo.status !== 'PAID') {
        throw new Error(`payOS payment is ${paymentInfo.status || 'not paid'}`);
    }

    if (Number(expectedAmount) && paidAmount < Number(expectedAmount)) {
        throw new Error('payOS paid amount does not match the selected plan');
    }

    return paymentInfo;
};

const buildClientUrl = (req, path) => {
    const origin = req.get('origin') || `${req.protocol}://${req.get('host')}`;
    return `${origin}${path}`;
};

const getPlanPrice = (plan) => {
    return parseFloat(plan.price);
};

const formatDateToYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// =====================================================
// 1. LẤY DANH SÁCH HUẤN LUYỆN VIÊN (PUBLIC)
// GET /api/checkout/trainers
// =====================================================
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await models.Users.findAll({
            where: { role_id: 2, status: 'Active' },
            attributes: ['user_id', 'full_name', 'avatar_url'],
            include: [
                {
                    model: models.Trainers,
                    as: 'Trainer',
                    required: false,
                    attributes: ['trainer_id', 'specialization', 'experience_years', 'bio', 'rating'],
                    include: [
                        {
                            model: models.TrainerCertifications,
                            as: 'TrainerCertifications',
                            required: false
                        }
                    ]
                }
            ]
        });

        const result = trainers.map(u => ({
            userId: u.user_id,
            trainerId: u.Trainer?.trainer_id || null,
            fullName: u.full_name,
            avatarUrl: u.avatar_url ? `${req.protocol}://${req.get('host')}${u.avatar_url}` : null,
            specialization: u.Trainer?.specialization || 'Gym tổng hợp',
            experienceYears: u.Trainer?.experience_years || 0,
            bio: u.Trainer?.bio || '',
            rating: u.Trainer?.rating || 4.5,
            certifications: u.Trainer?.TrainerCertifications?.map(c => ({
                id: c.certification_id,
                name: c.certification_name,
                issuedBy: c.issued_by
            })) || [],
            // Mock feedback giả lập image cho PT Details
            feedbacks: [
                { id: 1, text: "HLV cực kỳ nhiệt tình, hướng dẫn chi tiết từng động tác!", rating: 5, user: "Học viên A", imageUrl: "https://i.pravatar.cc/150?u=" + u.user_id + "1" },
                { id: 2, text: "Tôi đã giảm được 5kg sau 2 tháng tập cùng PT này.", rating: 5, user: "Học viên B", imageUrl: "https://i.pravatar.cc/150?u=" + u.user_id + "2" }
            ]
        }));

        return res.status(200).json({ trainers: result });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách HLV:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách HLV!', error: error.message });
    }
};

// =====================================================
// 1b. LẤY LỊCH TRÌNH CỦA HLV (PUBLIC)
// GET /api/checkout/trainers/:trainerId/schedule
// =====================================================
exports.getTrainerSchedule = async (req, res) => {
    try {
        const { trainerId } = req.params;
        const { startDate, endDate } = req.query;

        if (!trainerId) {
            return res.status(400).json({ message: 'Thiếu trainerId!' });
        }

        const whereCondition = { trainer_id: trainerId };
        if (startDate && endDate) {
            whereCondition.working_date = {
                [require('sequelize').Op.between]: [startDate, endDate]
            };
        }

        const schedules = await models.TrainerSchedules.findAll({
            where: whereCondition,
            order: [['working_date', 'ASC'], ['start_time', 'ASC']]
        });

        const formatTimeField = (val) => {
            if (!val) return '00:00:00';
            if (typeof val === 'string') return val;
            if (val instanceof Date) {
                const h = String(val.getUTCHours()).padStart(2, '0');
                const m = String(val.getUTCMinutes()).padStart(2, '0');
                const s = String(val.getUTCSeconds()).padStart(2, '0');
                return `${h}:${m}:${s}`;
            }
            return '00:00:00';
        };

        const result = schedules.map(s => ({
            scheduleId: s.schedule_id,
            workingDate: s.working_date,
            startTime: formatTimeField(s.start_time),
            endTime: formatTimeField(s.end_time),
            status: s.availability_status
        }));

        return res.status(200).json({ schedules: result });
    } catch (error) {
        console.error('❌ Lỗi lấy lịch HLV:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy lịch HLV!', error: error.message });
    }
};

// =====================================================
// 2. LẤY DANH SÁCH GÓI TẬP (PUBLIC)
// GET /api/checkout/plans
// =====================================================
exports.getPlans = async (req, res) => {
    try {
        const plans = await models.MembershipPlans.findAll({
            where: { status: 'Active' },
            order: [['price', 'ASC']]
        });

        const result = plans.map(p => ({
            planId: p.membership_plan_id,
            planName: p.plan_name,
            sportType: p.sport_type,
            durationMonths: p.duration_months,
            price: p.price,
            description: p.description,
        }));

        return res.status(200).json({ plans: result });
    } catch (error) {
        console.error('❌ Lỗi lấy gói tập:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy gói tập!', error: error.message });
    }
};

// =====================================================
// 2b. LẤY DANH SÁCH DỊCH VỤ (PUBLIC)
// 2.1 LẤY DANH SÁCH DỊCH VỤ BỔ SUNG (PUBLIC)
// GET /api/checkout/services
// =====================================================
exports.getServices = async (req, res) => {
    try {
        const services = await models.Services.findAll({
            where: { status: 'Available' },
            order: [['price', 'ASC']]
        });

        // Lọc các dịch vụ bị trùng tên do seed nhiều lần
        const uniqueServicesMap = new Map();
        for (const s of services) {
            uniqueServicesMap.set(s.service_name, s);
        }
        const uniqueServices = Array.from(uniqueServicesMap.values());

        const result = uniqueServices.map(s => ({
            serviceId: s.service_id,
            serviceName: s.service_name,
            description: s.description,
            price: parseFloat(s.price),
            sportType: s.service_name.includes('PT') ? 'Huấn Luyện' : 'Tiện Ích'
        }));

        return res.status(200).json({ services: result });
    } catch (error) {
        console.error('❌ Lỗi lấy dịch vụ:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy dịch vụ!', error: error.message });
    }
};

// =====================================================
// 3. ĐĂNG KÝ VÀ THANH TOÁN CHO GUEST (PUBLIC)
// POST /api/checkout/guest-register-checkout
// =====================================================
// =====================================================
// 3. TAO LINK THANH TOAN PAYOS (PUBLIC)
// POST /api/checkout/payos/create-payment
// =====================================================
exports.createPayosPayment = async (req, res) => {
    try {
        const { planId, services = [] } = req.body;

        if (!planId && (!services || services.length === 0)) {
            return res.status(400).json({ message: 'Vui lòng chọn gói tập hoặc dịch vụ!' });
        }

        let planAmount = 0;
        let planName = 'Dich vu tai FXFitness';
        if (planId) {
            const plan = await models.MembershipPlans.findByPk(planId);
            if (!plan || plan.status !== 'Active') {
                return res.status(400).json({ message: 'Gói tập không tồn tại hoặc đã bị khóa!' });
            }
            planAmount = Number(plan.price);
            planName = plan.plan_name;
        }

        let servicesAmount = 0;
        let selectedServicesRecords = [];
        if (services && services.length > 0) {
            selectedServicesRecords = await models.Services.findAll({
                where: { service_id: services }
            });
            servicesAmount = selectedServicesRecords.reduce((sum, s) => sum + parseFloat(s.price), 0);
        }

        const amount = Math.round(planAmount + servicesAmount);
        const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`.slice(-12));
        const description = `FXFITNESS ${orderCode}`.slice(0, 25);
        const returnUrl = buildClientUrl(req, `/checkout?payosOrderCode=${orderCode}`);
        const cancelUrl = buildClientUrl(req, '/checkout?payosCancelled=true');
        const signatureData = { amount, cancelUrl, description, orderCode, returnUrl };

        const paymentData = {
            ...signatureData,
            buyerName: 'FX Fitness Member',
            items: [
                {
                    name: planName,
                    quantity: 1,
                    price: amount
                }
            ],
            signature: createPayosSignature(signatureData)
        };

        let paymentLink;
        try {
            paymentLink = await payosRequest('/v2/payment-requests', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
        } catch (payosError) {
            if (process.env.NODE_ENV === 'production') {
                throw payosError;
            }
            console.warn('⚠️ [DEV] Không thể tạo link PayOS thật, sử dụng mock:', payosError.message);
            paymentLink = {
                bin: '970422',
                accountNumber: '0855157236',
                accountName: 'HOANG LAN',
                amount: amount,
                orderCode: orderCode,
                description: description,
                qrCode: `00020101021238580010A00000072701240006970422011008551572360208QRIBFTTA53037045405${amount}5802VN62170813${description}6304`,
                checkoutUrl: buildClientUrl(req, `/checkout?payosOrderCode=${orderCode}`)
            };
        }

        return res.status(201).json({
            message: 'Tao link thanh toan payOS thanh cong!',
            payment: paymentLink
        });
    } catch (error) {
        console.error('payOS create payment error:', error.message);
        return res.status(500).json({ message: 'Khong the tao thanh toan payOS!', error: error.message });
    }
};

// =====================================================
// 4. KIEM TRA TRANG THAI PAYOS (PUBLIC)
// GET /api/checkout/payos/status/:orderCode
// =====================================================
exports.getPayosStatus = async (req, res) => {
    try {
        const payment = await getPayosPaymentInfo(req.params.orderCode);
        return res.status(200).json({ payment });
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            return res.status(200).json({
                payment: {
                    orderCode: req.params.orderCode,
                    status: 'PENDING'
                }
            });
        }
        console.error('payOS status error:', error.message);
        return res.status(500).json({ message: 'Khong the kiem tra thanh toan payOS!', error: error.message });
    }
};

exports.guestCheckoutAndRegister = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { email, phoneNumber, password, planId, trainerId, services = [], height, weight, fitnessGoal, payosOrderCode } = req.body;

        // 1. Validate input
        if (!email || !password || !planId) {
            await t.rollback();
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ email, mật khẩu và gói tập!' });
        }

        // 2. Check if email exists
        const existingUser = await models.Users.findOne({ where: { email } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // 3. Find plan details
        const plan = await models.MembershipPlans.findByPk(planId);
        if (!plan || plan.status !== 'Active') {
            await t.rollback();
            return res.status(400).json({ message: 'Gói tập không tồn tại hoặc đã bị khóa!' });
        }

        let servicesAmount = 0;
        let selectedServicesRecords = [];
        if (services && services.length > 0) {
            selectedServicesRecords = await models.Services.findAll({
                where: { service_id: services }
            });
            servicesAmount = selectedServicesRecords.reduce((sum, s) => sum + parseFloat(s.price), 0);
        }

        const amount = getPlanPrice(plan) + servicesAmount;
        let payosPayment;
        try {
            payosPayment = await ensurePayosPaid(payosOrderCode, amount);
        } catch (payosError) {
            if (process.env.NODE_ENV === 'production') {
                await t.rollback();
                return res.status(400).json({
                    message: `Xác minh thanh toán PayOS thất bại: ${payosError.message}`
                });
            }
            console.warn('⚠️ [DEV] Bỏ qua verify PayOS:', payosError.message);
            payosPayment = { orderCode: payosOrderCode, status: 'PAID' };
        }

        // 4. Resolve trainer if selected
        let trainerRecord = null;
        if (trainerId) {
            trainerRecord = await models.Trainers.findOne({ where: { user_id: trainerId } });
            if (!trainerRecord) {
                trainerRecord = await models.Trainers.findByPk(trainerId);
            }
            if (!trainerRecord) {
                await t.rollback();
                return res.status(400).json({ message: 'Huấn luyện viên không tồn tại!' });
            }
        }

        // 5. Create verification token
        const verificationToken = jwt.sign(
            { userId: null, email: email, purpose: 'email-verification' },
            process.env.JWT_SECRET || 'BiMatSieuCap_SWP391',
            { expiresIn: '24h' }
        );

        // 6. Create new User with status 'PendingVerification'
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const derivedName = fullName || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));

        const newUser = await models.Users.create({
            full_name: derivedName,
            email: email,
            password_hash: passwordHash,
            phone_number: phoneNumber || null,
            role_id: 1,
            status: 'Inactive',
            must_change_password: false,
            email_verification_token: verificationToken
        }, { transaction: t });

        // Update verification token with real userId
        const realToken = jwt.sign(
            { userId: newUser.user_id, email: email, purpose: 'email-verification' },
            process.env.JWT_SECRET || 'BiMatSieuCap_SWP391',
            { expiresIn: '24h' }
        );
        await newUser.update({ email_verification_token: realToken }, { transaction: t });

        // 7. Create Member profile
        const newMember = await models.Members.create({
            user_id: newUser.user_id,
            joined_date: formatDateToYYYYMMDD(new Date()),
            height: height || null,
            weight: weight || null,
            bmi: bmi,
            fitness_goal: fitnessGoal || null
        }, { transaction: t });

        // 8. Calculate membership dates
        const startDate = new Date();
        const durationMonths = parseInt(plan.duration_months) || 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // 9. Create MemberMembership
        await models.MemberMemberships.create({
            member_id: newMember.member_id,
            membership_plan_id: plan.membership_plan_id,
            start_date: formatDateToYYYYMMDD(startDate),
            end_date: formatDateToYYYYMMDD(endDate),
            membership_status: 'Active'
        }, { transaction: t });

        // 8.5 Save services
        if (services && services.length > 0) {
            for (const srvId of services) {
                await models.MemberServices.create({
                    member_id: newMember.member_id,
                    service_id: srvId,
                    start_date: formatDateToYYYYMMDD(startDate),
                    end_date: formatDateToYYYYMMDD(endDate),
                    service_status: 'Active'
                }, { transaction: t });
            }
        }

        // 9. Record Payment
        const transactionCode = payosPayment.orderCode || payosOrderCode || `FXGUEST-${Date.now()}`;
        await models.Payments.create({
            member_id: newMember.member_id,
            amount: amount,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Paid',
            transaction_code: transactionCode
        }, { transaction: t });

        // 11. Link trainer
        if (trainerRecord) {
            await models.WorkoutPlans.create({
                trainer_id: trainerRecord.trainer_id,
                member_id: newMember.member_id,
                title: `Lộ trình luyện tập với HLV ${trainerRecord.trainer_id}`,
                description: `Lộ trình được tạo tự động sau khi đăng ký gói tập cùng HLV.`
            }, { transaction: t });

            // Notify Trainer
            try {
                const ptUser = await models.Users.findByPk(trainerRecord.user_id);
                if (ptUser && ptUser.email) {
                    const emailService = require('../utils/emailService');
                    await emailService.sendEmail(
                        ptUser.email,
                        'FxFitness - Bạn có học viên mới',
                        `<h3>Xin chào ${ptUser.full_name},</h3>
                         <p>Hệ thống vừa ghi nhận học viên mới <strong>${fullName}</strong> đã đăng ký tập luyện cùng bạn.</p>
                         <p>Mục tiêu: ${fitnessGoal || 'Không xác định'}, BMI: ${bmi || 'Chưa cập nhật'}.</p>
                         <p>Vui lòng đăng nhập vào Dashboard để kiểm tra thông tin và lên giáo án.</p>`
                    );
                }
            } catch (emailErr) {
                console.error('Error sending email to PT:', emailErr);
            }
        }

        // 12. Register services if selected
        if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
            for (const svcId of serviceIds) {
                const service = await models.Services.findByPk(svcId);
                if (service && service.status === 'Active') {
                    await models.MemberServices.create({
                        member_id: newMember.member_id,
                        service_id: service.service_id,
                        start_date: formatDateToYYYYMMDD(new Date()),
                        service_status: 'Active'
                    }, { transaction: t });
                }
            }
        }

        // Commit transaction
        await t.commit();

        // Generate Verify Token
        const secret = (process.env.JWT_SECRET || 'BiMatSieuCap_SWP391') + newUser.password_hash;
        const verifyToken = jwt.sign(
            { userId: newUser.user_id, email: newUser.email },
            secret,
            { expiresIn: '24h' }
        );

        // Send Email
        const clientUrl = req.headers.origin || 'http://localhost:5173';
        const verifyLink = `${clientUrl}/login?action=verify-email&token=${verifyToken}&userId=${newUser.user_id}`;

        const nodemailer = require('nodemailer');
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: process.env.EMAIL_SERVICE || 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"FxFitness Center" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Kích hoạt tài khoản FxFitness Center',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                            <h2 style="color: #28a745; text-align: center;">FxFitness Center</h2>
                            <p>Xin chào ${fullName},</p>
                            <p>Cảm ơn bạn đã đăng ký tài khoản và mua gói tập tại FxFitness Center. Vui lòng bấm vào liên kết dưới đây để kích hoạt tài khoản của bạn (Liên kết này có hiệu lực trong vòng 24 giờ):</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verifyLink}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">KÍCH HOẠT TÀI KHOẢN</a>
                            </div>
                            <p>Hoặc bạn có thể sao chép liên kết này và dán vào trình duyệt:</p>
                            <p style="word-break: break-all; color: #007bff; font-size: 13px;">${verifyLink}</p>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.error('Lỗi gửi email kích hoạt:', emailErr.message);
            }
        }

        console.log('\n=====================================================');
        console.log('🔑 [EMAIL VERIFY LINK DETECTED - DEV ONLY]');
        console.log(`Email: ${email}`);
        console.log(`Verify Link: ${verifyLink}`);
        console.log('=====================================================\n');

        return res.status(201).json({
            message: 'Đăng ký và thanh toán thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.',
            success: true,
            requiresVerification: true
        });

    } catch (error) {
        console.error('❌ Lỗi chi tiết khi checkout guest:', error);
        try {
            await t.rollback();
        } catch (rollbackError) {
            console.error('⚠️ Lỗi khi rollback transaction:', rollbackError.message);
        }
        return res.status(500).json({ message: 'Lỗi server khi xử lý checkout guest!', error: error.message });
    }
};

// =====================================================
// 4. THANH TOÁN CHO USER ĐÃ ĐĂNG NHẬP (PROTECTED)
// POST /api/checkout/loggedIn-checkout
// =====================================================
exports.loggedInCheckout = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.userId || req.user.id;
        const { planId, trainerId, services = [], payosOrderCode } = req.body;

        if (!planId && (!services || services.length === 0)) {
            await t.rollback();
            return res.status(400).json({ message: 'Vui lòng chọn gói tập hoặc dịch vụ!' });
        }

        // 1. Check if user exists
        const user = await models.Users.findByPk(userId);
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        // 2. Find plan details
        let plan = null;
        let planAmount = 0;
        if (planId) {
            plan = await models.MembershipPlans.findByPk(planId);
            if (!plan || plan.status !== 'Active') {
                await t.rollback();
                return res.status(400).json({ message: 'Gói tập không tồn tại hoặc đã bị khóa!' });
            }
            planAmount = getPlanPrice(plan);
        }

        let servicesAmount = 0;
        let selectedServicesRecords = [];
        if (services && services.length > 0) {
            selectedServicesRecords = await models.Services.findAll({
                where: { service_id: services }
            });
            servicesAmount = selectedServicesRecords.reduce((sum, s) => sum + parseFloat(s.price), 0);
        }

        const amount = planAmount + servicesAmount;
        const payosPayment = await ensurePayosPaid(payosOrderCode, amount);

        // 3. Resolve trainer if selected
        let trainerRecord = null;
        if (trainerId) {
            trainerRecord = await models.Trainers.findOne({ where: { user_id: trainerId } });
            if (!trainerRecord) {
                trainerRecord = await models.Trainers.findByPk(trainerId);
            }
            if (!trainerRecord) {
                await t.rollback();
                return res.status(400).json({ message: 'Huấn luyện viên không tồn tại!' });
            }
        }

        // 4. Get or create Member profile
        let member = await models.Members.findOne({ where: { user_id: userId } });
        if (!member) {
            member = await models.Members.create({
                user_id: userId,
                joined_date: new Date()
            }, { transaction: t });
        }

        // 5. Calculate membership start and end date with STACKING
        if (plan) {
            const activeMembership = await models.MemberMemberships.findOne({
                where: { member_id: member.member_id, membership_status: 'Active' },
                include: [
                    {
                        model: models.MembershipPlans,
                        as: 'membership_plan',
                        where: { sport_type: plan.sport_type }
                    }
                ],
                order: [['end_date', 'DESC']],
                transaction: t
            });

            const durationMonths = parseInt(plan.duration_months) || 1;

            if (activeMembership) {
                // Stack: extend end_date
                const newEndDate = new Date(activeMembership.end_date);
                newEndDate.setMonth(newEndDate.getMonth() + durationMonths);
                await activeMembership.update({
                    end_date: formatDateToYYYYMMDD(newEndDate)
                }, { transaction: t });
            } else {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + durationMonths);
                await models.MemberMemberships.create({
                    member_id: member.member_id,
                    membership_plan_id: plan.membership_plan_id,
                    start_date: formatDateToYYYYMMDD(startDate),
                    end_date: formatDateToYYYYMMDD(endDate),
                    membership_status: 'Active'
                }, { transaction: t });
            }
        }

        // 6. Record Payment
        const transactionCode = payosPayment.orderCode || payosOrderCode || `FXUSER-${Date.now()}`;
        await models.Payments.create({
            member_id: member.member_id,
            amount: amount,
            payment_type: plan ? 'Membership' : 'Service',
            payment_method: 'PayOS',
            payment_status: 'Paid',
            transaction_code: transactionCode
        }, { transaction: t });

        // 7. Save services - 1 month duration
        if (services && services.length > 0) {
            for (const srvId of services) {
                const activeService = await models.MemberServices.findOne({
                    where: { member_id: member.member_id, service_id: srvId, service_status: 'Active' },
                    order: [['end_date', 'DESC']],
                    transaction: t
                });

                if (activeService) {
                    const newEndDate = new Date(activeService.end_date);
                    newEndDate.setMonth(newEndDate.getMonth() + 1);
                    await activeService.update({
                        end_date: formatDateToYYYYMMDD(newEndDate)
                    }, { transaction: t });
                } else {
                    const startDate = new Date();
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1);

                    await models.MemberServices.create({
                        member_id: member.member_id,
                        service_id: srvId,
                        start_date: formatDateToYYYYMMDD(startDate),
                        end_date: formatDateToYYYYMMDD(endDate),
                        service_status: 'Active'
                    }, { transaction: t });
                }
            }
        }

        // 9. Link trainer in WorkoutPlans if trainer is selected
        if (trainerRecord) {
            await models.WorkoutPlans.create({
                trainer_id: trainerRecord.trainer_id,
                member_id: member.member_id,
                title: `Lộ trình luyện tập với HLV ${trainerRecord.trainer_id}`,
                description: `Lộ trình được tạo tự động sau khi đăng ký gói tập cùng HLV.`
            }, { transaction: t });

            // Notify Trainer
            try {
                const ptUser = await models.Users.findByPk(trainerRecord.user_id);
                if (ptUser && ptUser.email) {
                    const emailService = require('../utils/emailService');
                    await emailService.sendEmail(
                        ptUser.email,
                        'FxFitness - Bạn có học viên mới',
                        `<h3>Xin chào ${ptUser.full_name},</h3>
                         <p>Hệ thống vừa ghi nhận hội viên <strong>${user.full_name}</strong> đã gia hạn/mua gói và chọn bạn làm HLV.</p>
                         <p>Vui lòng đăng nhập vào Dashboard để kiểm tra và lên giáo án.</p>`
                    );
                }
            } catch (emailErr) {
                console.error('Error sending email to PT:', emailErr);
            }
        }

        // Commit transaction
        await t.commit();

        return res.status(200).json({
            message: 'Thanh toán thành công! Gói tập của bạn đã được kích hoạt.',
            success: true
        });

    } catch (error) {
        console.error('❌ Lỗi chi tiết khi checkout user đăng nhập:', error);
        try {
            await t.rollback();
        } catch (rollbackError) {
            console.error('⚠️ Lỗi khi rollback transaction:', rollbackError.message);
        }
        return res.status(500).json({ message: 'Lỗi server khi xử lý thanh toán!', error: error.message });
    }
};

// =====================================================
// 5. KIỂM TRA EMAIL ĐÃ TỒN TẠI CHƯA (PUBLIC)
// POST /api/checkout/check-email
// =====================================================
exports.checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp email!' });
        }

        const existingUser = await models.Users.findOne({ where: { email: email.trim() } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        return res.status(200).json({ message: 'Email khả dụng!', success: true });
    } catch (error) {
        console.error('❌ Lỗi kiểm tra email:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi kiểm tra email!', error: error.message });
    }
};

// =====================================================
// 6. LẤY CẤU HÌNH TRANG CHỦ (PUBLIC)
// GET /api/checkout/homepage-config
// =====================================================
exports.getHomepageConfig = async (req, res) => {
    try {
        const config = await models.AppConfigs.findOne({ where: { config_key: 'core_sports' } });
        let coreSports = [];
        if (config && config.config_value) {
            try {
                coreSports = JSON.parse(config.config_value);
            } catch (e) {
                console.error('Lỗi parse config core_sports:', e);
            }
        }
        return res.status(200).json({ coreSports });
    } catch (error) {
        console.error('❌ Error getting homepage config:', error);
        return res.status(500).json({ message: 'Lỗi server khi lấy cấu hình trang chủ!' });
    }
};
