import React, { useState } from 'react';

function WorkoutPlansAndServices({ profileData }) {
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  const memberships = profileData?.memberInfo?.memberships || [];
  const services = profileData?.memberInfo?.services || [];
  const activePtName = profileData?.memberInfo?.activePtName || 'Chưa đăng ký';

  const renderStatusBadge = (status) => {
    if (status === 'Active') {
      return <span className="member-package-badge-active">Đang hoạt động</span>;
    } else if (status === 'Expired') {
      return <span className="member-package-badge-expired">Hết hạn</span>;
    } else {
      return <span className="member-package-badge-cancelled">{status}</span>;
    }
  };

  const handleRenewPlan = (planId, memberMembershipId, sportType) => {
    window.history.pushState(
      {},
      '',
      `/checkout?plan=${planId}&renewMembershipId=${memberMembershipId}&sportType=${encodeURIComponent(sportType)}`
    );
    window.dispatchEvent(new Event('popstate'));
  };

  const handleRenewService = (serviceId) => {
    window.history.pushState(
      {},
      '',
      `/checkout?service=${serviceId}`
    );
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="member-plans-services-view">
      {/* SECTION 1: GÓI TẬP ĐÃ ĐĂNG KÝ */}
      <div className="member-packages-panel" style={{ marginBottom: '32px' }}>
        <h3 className="member-packages-title" style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-address-card" style={{ color: 'var(--orange)' }}></i> Chi tiết gói tập đã đăng ký
        </h3>
        {memberships.length > 0 ? (
          <div className="member-packages-list">
            {memberships.map((m) => {
              const isOpen = expandedPlanId === m.memberMembershipId;
              return (
                <div className={`member-package-item ${isOpen ? 'open' : ''}`} key={m.memberMembershipId} style={{ marginBottom: '12px' }}>
                  <div
                    className="member-package-item-header"
                    onClick={() => setExpandedPlanId(isOpen ? null : m.memberMembershipId)}
                    style={{ padding: '16px 20px' }}
                  >
                    <div className="member-package-item-name" style={{ fontWeight: '700' }}>
                      <i className="fa-solid fa-dumbbell" style={{ color: isOpen ? 'var(--orange)' : '#64748b', marginRight: '10px' }}></i>
                      {m.planName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {renderStatusBadge(m.status)}
                      <i className="fa-solid fa-chevron-down member-package-item-arrow"></i>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="member-package-item-details" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #f1f5f9' }}>
                      <div className="member-package-details-grid">
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Ngày bắt đầu</span>
                          <span className="member-package-detail-value">{m.startDate}</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Ngày kết thúc</span>
                          <span className="member-package-detail-value">{m.endDate}</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Bộ môn</span>
                          <span className="member-package-detail-value">{m.sportType}</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Thời hạn gói</span>
                          <span className="member-package-detail-value">{m.durationMonths} tháng</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Giá tiền</span>
                          <span className="member-package-detail-value" style={{ color: 'var(--orange)' }}>
                            {Number(m.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Huấn luyện viên</span>
                          <span className="member-package-detail-value" style={{ color: '#0f172a', fontWeight: '700' }}>
                            {m.trainerName || 'Chưa đăng ký'}
                          </span>
                        </div>
                      </div>
                      {m.description && (
                        <div className="member-package-detail-col" style={{ marginTop: '16px', borderTop: '1px dashed #f1f5f9', paddingTop: '12px' }}>
                          <span className="member-package-detail-label">Mô tả gói tập</span>
                          <span className="member-package-detail-value" style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                            {m.description}
                          </span>
                        </div>
                      )}
                      <div className="member-package-remaining-box" style={{ marginTop: '20px', background: '#fff8f1', border: '1px solid #ffe3cb', padding: '12px 16px' }}>
                        <span className="member-package-remaining-text" style={{ fontWeight: '600' }}>Số ngày còn lại của gói tập:</span>
                        <span className="member-package-remaining-value" style={{ color: 'var(--orange)', fontWeight: '800' }}>{m.remainingDays} ngày</span>
                      </div>
                      {(m.status === 'Active' || m.status === 'Expired') && (
                        <button
                          className="member-package-btn-renew"
                          onClick={() => handleRenewPlan(m.planId, m.memberMembershipId, m.sportType)}
                          style={{ marginTop: '16px' }}
                        >
                          <i className="fa-solid fa-arrows-rotate"></i> Gia hạn gói tập
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="member-no-data" style={{ padding: '30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            Bạn chưa đăng ký bất kỳ gói tập nào trong hệ thống!
          </div>
        )}
      </div>

      {/* SECTION 2: DỊCH VỤ ĐÃ ĐĂNG KÝ */}
      <div className="member-packages-panel">
        <h3 className="member-packages-title" style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-bell-concierge" style={{ color: '#10b981' }}></i> Chi tiết dịch vụ bổ sung đã đăng ký
        </h3>
        {services.length > 0 ? (
          <div className="member-packages-list">
            {services.map((s) => {
              const isOpen = expandedServiceId === s.memberServiceId;
              return (
                <div className={`member-package-item ${isOpen ? 'open' : ''}`} key={s.memberServiceId} style={{ marginBottom: '12px', borderLeft: '4px solid #10b981' }}>
                  <div
                    className="member-package-item-header"
                    onClick={() => setExpandedServiceId(isOpen ? null : s.memberServiceId)}
                    style={{ padding: '16px 20px' }}
                  >
                    <div className="member-package-item-name" style={{ fontWeight: '700' }}>
                      <i className="fa-solid fa-cube" style={{ color: isOpen ? '#10b981' : '#64748b', marginRight: '10px' }}></i>
                      {s.serviceName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {renderStatusBadge(s.status)}
                      <i className="fa-solid fa-chevron-down member-package-item-arrow"></i>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="member-package-item-details" style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #f1f5f9' }}>
                      <div className="member-package-details-grid">
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Ngày kích hoạt</span>
                          <span className="member-package-detail-value">{s.startDate}</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Ngày hết hạn</span>
                          <span className="member-package-detail-value">{s.endDate || 'N/A'}</span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Giá tiền dịch vụ</span>
                          <span className="member-package-detail-value" style={{ color: '#10b981' }}>
                            {Number(s.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <div className="member-package-detail-col">
                          <span className="member-package-detail-label">Mã đăng ký</span>
                          <span className="member-package-detail-value">
                            #MSV-{s.memberServiceId}
                          </span>
                        </div>
                      </div>
                      {s.description && (
                        <div className="member-package-detail-col" style={{ marginTop: '16px', borderTop: '1px dashed #f1f5f9', paddingTop: '12px' }}>
                          <span className="member-package-detail-label">Chi tiết về dịch vụ</span>
                          <span className="member-package-detail-value" style={{ fontWeight: 'normal', color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5' }}>
                            {s.description}
                          </span>
                        </div>
                      )}
                      <div className="member-package-remaining-box" style={{ marginTop: '20px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 16px' }}>
                        <span className="member-package-remaining-text" style={{ fontWeight: '600', color: '#065f46' }}>Số ngày còn lại của dịch vụ:</span>
                        <span className="member-package-remaining-value" style={{ color: '#10b981', fontWeight: '800' }}>{s.remainingDays} ngày</span>
                      </div>
                      {(s.status === 'Active' || s.status === 'Expired') && (
                        <button
                          className="member-package-btn-renew"
                          onClick={() => handleRenewService(s.serviceId)}
                          style={{ marginTop: '16px', backgroundColor: '#10b981' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; }}
                        >
                          <i className="fa-solid fa-arrows-rotate"></i> Gia hạn dịch vụ
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="member-no-data" style={{ padding: '30px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            Bạn chưa đăng ký bất kỳ dịch vụ bổ sung nào trong hệ thống!
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkoutPlansAndServices;
