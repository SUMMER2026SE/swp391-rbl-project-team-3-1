const { models } = require('../config/db');

const ROLE = { MEMBER: 1, PT: 2, ADMIN: 3 };

// GET /api/certifications
exports.getMyCertifications = async (req, res) => {
    try {
        const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
        if (!trainer) {
            return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
        }

        const certs = await models.TrainerCertifications.findAll({
            where: { trainer_id: trainer.trainer_id },
            order: [['issued_date', 'DESC']]
        });

        return res.status(200).json({ certifications: certs });
    } catch (error) {
        console.error('❌ Lỗi lấy chứng chỉ:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi lấy chứng chỉ!', error: error.message });
    }
};

// POST /api/certifications
exports.addCertification = async (req, res) => {
    try {
        const { certificationName, issuedBy, issuedDate, expiryDate } = req.body;

        if (!certificationName) {
            return res.status(400).json({ message: 'Vui lòng nhập tên chứng chỉ!' });
        }

        const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
        if (!trainer) {
            return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
        }

        const newCert = await models.TrainerCertifications.create({
            trainer_id: trainer.trainer_id,
            certification_name: certificationName,
            issued_by: issuedBy || null,
            issued_date: issuedDate || null,
            expiry_date: expiryDate || null
        });

        return res.status(201).json({
            message: 'Thêm chứng chỉ thành công!',
            certification: newCert
        });
    } catch (error) {
        console.error('❌ Lỗi thêm chứng chỉ:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi thêm chứng chỉ!', error: error.message });
    }
};

// PUT /api/certifications/:id
exports.updateCertification = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificationName, issuedBy, issuedDate, expiryDate } = req.body;

        const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
        if (!trainer) {
            return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
        }

        const cert = await models.TrainerCertifications.findOne({
            where: { certification_id: id, trainer_id: trainer.trainer_id }
        });

        if (!cert) {
            return res.status(404).json({ message: 'Không tìm thấy chứng chỉ!' });
        }

        await cert.update({
            certification_name: certificationName !== undefined ? certificationName : cert.certification_name,
            issued_by: issuedBy !== undefined ? issuedBy : cert.issued_by,
            issued_date: issuedDate !== undefined ? issuedDate : cert.issued_date,
            expiry_date: expiryDate !== undefined ? expiryDate : cert.expiry_date
        });

        return res.status(200).json({
            message: 'Cập nhật chứng chỉ thành công!',
            certification: cert
        });
    } catch (error) {
        console.error('❌ Lỗi cập nhật chứng chỉ:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi cập nhật chứng chỉ!', error: error.message });
    }
};

// DELETE /api/certifications/:id
exports.deleteCertification = async (req, res) => {
    try {
        const { id } = req.params;

        const trainer = await models.Trainers.findOne({ where: { user_id: req.user.userId } });
        if (!trainer) {
            return res.status(400).json({ message: 'Hồ sơ huấn luyện viên không tồn tại!' });
        }

        const cert = await models.TrainerCertifications.findOne({
            where: { certification_id: id, trainer_id: trainer.trainer_id }
        });

        if (!cert) {
            return res.status(404).json({ message: 'Không tìm thấy chứng chỉ!' });
        }

        await cert.destroy();

        return res.status(200).json({ message: 'Xóa chứng chỉ thành công!' });
    } catch (error) {
        console.error('❌ Lỗi xóa chứng chỉ:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi xóa chứng chỉ!', error: error.message });
    }
};
