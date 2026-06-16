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
                    attributes: ['trainer_id', 'specialization', 'experience_years', 'bio', 'rating']
                }
            ]
        });

        const result = trainers.map(u => ({
            userId: u.user_id,
            fullName: u.full_name,
            avatarUrl: u.avatar_url ? `${req.protocol}://${req.get('host')}${u.avatar_url}` : null,
            specialization: u.Trainer?.specialization || 'Gym tổng hợp',
            experienceYears: u.Trainer?.experience_years || 0,
            bio: u.Trainer?.bio || '',
            rating: u.Trainer?.rating || 4.5,
        }));

        return res.status(200).json({ trainers: result });
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách HLV:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy danh sách HLV!', error: error.message });
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
            price: getPlanPrice(p),
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
// GET /api/checkout/services
// =====================================================
exports.getServices = async (req, res) => {
    try {
        const services = await models.Services.findAll({
            where: { status: 'Active' },
            order: [['price', 'ASC']]
        });

        const result = services.map(s => ({
            serviceId: s.service_id,
            serviceName: s.service_name,
            sportType: s.sport_type,
            price: parseFloat(s.price),
            description: s.description,
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
        const { planId } = req.body;

        if (!planId) {
            return res.status(400).json({ message: 'Vui long chon goi tap!' });
        }

        const plan = await models.MembershipPlans.findByPk(planId);
        if (!plan || plan.status !== 'Active') {
            return res.status(400).json({ message: 'Goi tap khong ton tai hoac da bi khoa!' });
        }

        const amount = Math.round(Number(getPlanPrice(plan)));
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
                    name: plan.plan_name,
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
        const { email, fullName, phoneNumber, password, planId, trainerId, serviceIds, payosOrderCode } = req.body;

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

        const amount = getPlanPrice(plan);
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
            joined_date: formatDateToYYYYMMDD(new Date())
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

        // 10. Record Payment
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

        // 13. Send verification email (async, non-blocking)
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const verificationLink = `${clientUrl}/?action=verify-email&token=${realToken}`;
        sendVerificationEmail(email, derivedName, verificationLink).catch(err => {
            console.error('⚠️ Gửi email xác thực thất bại:', err.message);
        });

        console.log('\n=====================================================');
        console.log('🔗 [VERIFICATION LINK - DEV]');
        console.log(`Email: ${email}`);
        console.log(`Link: ${verificationLink}`);
        console.log('=====================================================\n');

        return res.status(201).json({
            message: 'Đăng ký và thanh toán thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
            success: true,
            needsVerification: true,
            user: {
                userId: newUser.user_id,
                fullName: newUser.full_name,
                email: newUser.email,
                roleId: newUser.role_id,
                status: newUser.status
            }
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
        const { planId, trainerId, payosOrderCode } = req.body;

        if (!planId) {
            await t.rollback();
            return res.status(400).json({ message: 'Vui lòng cung cấp gói tập!' });
        }

        // 1. Check if user exists
        const user = await models.Users.findByPk(userId);
        if (!user) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
        }

        // 2. Find plan details
        const plan = await models.MembershipPlans.findByPk(planId);
        if (!plan || plan.status !== 'Active') {
            await t.rollback();
            return res.status(400).json({ message: 'Gói tập không tồn tại hoặc đã bị khóa!' });
        }

        const amount = getPlanPrice(plan);
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

        // 5. Calculate membership start and end date
        const startDate = new Date();
        const durationMonths = parseInt(plan.duration_months) || 1;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // 6. Create MemberMembership
        await models.MemberMemberships.create({
            member_id: member.member_id,
            membership_plan_id: plan.membership_plan_id,
            start_date: formatDateToYYYYMMDD(startDate),
            end_date: formatDateToYYYYMMDD(endDate),
            membership_status: 'Active'
        }, { transaction: t });

        // 7. Record Payment
        const transactionCode = payosPayment.orderCode || payosOrderCode || `FXUSER-${Date.now()}`;
        await models.Payments.create({
            member_id: member.member_id,
            amount: amount,
            payment_type: 'Membership',
            payment_method: 'PayOS',
            payment_status: 'Paid',
            transaction_code: transactionCode
        }, { transaction: t });

        // 8. Link trainer in WorkoutPlans if trainer is selected
        if (trainerRecord) {
            await models.WorkoutPlans.create({
                trainer_id: trainerRecord.trainer_id,
                member_id: member.member_id,
                title: `Lộ trình luyện tập với HLV ${trainerRecord.trainer_id}`,
                description: `Lộ trình được tạo tự động sau khi đăng ký gói tập cùng HLV.`
            }, { transaction: t });
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
