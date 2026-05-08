-- ============================================================
--  PARADISE GYM — SQLite Schema v2.0 (Production-Ready)
--  Cập nhật: Soft Delete | Audit Log | RBAC | Raw Attendance
--            Confirmed_by | Business Constraints
--  Lưu ý bảo mật:
--    - mat_khau_hash: dùng bcrypt (cost=12) ở tầng app
--    - so_dien_thoai, email, cmnd_cccd: encrypt AES-256 ở tầng app
--    - File SQLite phải được đặt ngoài thư mục web và có full-disk encryption
-- ============================================================

PRAGMA foreign_keys  = ON;
PRAGMA journal_mode  = WAL;
PRAGMA busy_timeout  = 5000;

-- ============================================================
-- 1. VAI TRÒ (RBAC — quản lý quyền ở tầng app)
-- ============================================================
CREATE TABLE IF NOT EXISTS vai_tro (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ma_vai_tro TEXT   NOT NULL UNIQUE,   -- 'admin' | 'le_tan' | 'pt' | 'hoi_vien'
    ten_hien_thi TEXT NOT NULL,
    mo_ta     TEXT,
    -- Quyền được mã hóa dạng JSON để app đọc
    -- VD: {"ho_so":["read","create","update"], "goi_tap":["read"]}
    quyen_json TEXT   NOT NULL DEFAULT '{}'
);

INSERT INTO vai_tro (ma_vai_tro, ten_hien_thi, mo_ta, quyen_json) VALUES
('admin',    'Quản trị viên', 'Toàn quyền hệ thống',
 '{"ho_so":["read","create","update","delete"],"goi_tap":["read","create","update","delete"],"doanh_thu":["read"],"cham_cong":["read","config"],"lich_tap":["read","create","update","delete"],"tai_khoan":["read","create","update"]}'),
('le_tan',   'Lễ tân', 'Tiếp nhận và đăng ký cho hội viên',
 '{"ho_so":["read","create","update"],"goi_tap":["read"],"lich_tap":["read","create","update"],"luot_vao_ra":["read"]}'),
('pt',       'Huấn luyện viên', 'Xem lịch và học viên của mình',
 '{"ho_so":["read_own"],"lich_tap":["read_own"],"cham_cong":["read_own"]}'),
('hoi_vien', 'Hội viên', 'Xem thông tin cá nhân',
 '{"ho_so":["read_own"],"lich_tap":["read_own"],"luot_vao_ra":["read_own"]}');

-- ============================================================
-- 2. TÀI KHOẢN
-- ============================================================
CREATE TABLE IF NOT EXISTS tai_khoan (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_dang_nhap   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    mat_khau_hash   TEXT    NOT NULL,         -- bcrypt hash, KHÔNG lưu plain text
    vai_tro_id      INTEGER NOT NULL REFERENCES vai_tro(id),
    trang_thai      TEXT    NOT NULL DEFAULT 'hoat_dong'
                            CHECK (trang_thai IN ('hoat_dong', 'khoa', 'cho_xac_nhan')),
    so_lan_dang_nhap_sai INTEGER NOT NULL DEFAULT 0,  -- Khoá sau 5 lần sai
    lan_dang_nhap_cuoi   DATETIME,
    refresh_token_hash   TEXT,                -- Lưu hash của refresh token (JWT)
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    -- Audit: ai tạo tài khoản này
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id)
);

-- ============================================================
-- 3. HỒ SƠ (Soft Delete + Audit fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS ho_so (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tai_khoan_id    INTEGER UNIQUE REFERENCES tai_khoan(id) ON DELETE SET NULL,
    ma_ho_so        TEXT    NOT NULL UNIQUE,   -- HV001, PT001, NV001, LT001
    loai_ho_so      TEXT    NOT NULL
                            CHECK (loai_ho_so IN ('hoi_vien','pt','nhan_vien','le_tan')),
    ho_ten          TEXT    NOT NULL,
    gioi_tinh       TEXT    CHECK (gioi_tinh IN ('nam','nu','khac')),
    ngay_sinh       DATE,
    -- Các trường nhạy cảm — PHẢI encrypt AES-256 ở tầng app trước khi lưu
    so_dien_thoai   TEXT,   -- [ENCRYPTED]
    email           TEXT,   -- [ENCRYPTED]
    cmnd_cccd       TEXT,   -- [ENCRYPTED]
    dia_chi_tam_tru TEXT,   -- [ENCRYPTED]
    -- Ảnh Cloudinary
    avatar_url           TEXT,   -- URL công khai từ Cloudinary
    cloudinary_public_id TEXT,   -- Dùng để xóa ảnh cũ trên Cloudinary khi đổi ảnh
    ghi_chu         TEXT,
    -- Thông tin bổ sung (Mới cập nhật)
    chi_nhanh       TEXT,
    phong_tap       TEXT,
    noi_sinh        TEXT,
    que_quan        TEXT,
    tinh_thanh      TEXT,
    quan_huyen      TEXT,
    phuong_xa       TEXT,
    chuyen_mon      TEXT, -- Dành cho PT
    chuc_vu         TEXT, -- Dành cho Nhân viên
    loai_hv         TEXT, -- Dành cho Hội viên (VIP, Thường...)
    -- Soft Delete — KHÔNG bao giờ xóa thật hồ sơ
    is_deleted      INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1)),
    ngay_xoa        DATETIME,
    nguoi_xoa_id    INTEGER REFERENCES tai_khoan(id),
    ly_do_xoa       TEXT,
    -- Audit
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
    nguoi_cap_nhat_id INTEGER REFERENCES tai_khoan(id),
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- 4. GÓI TẬP (Soft Delete — không xóa thật nếu đã có người đăng ký)
-- ============================================================
CREATE TABLE IF NOT EXISTS goi_tap (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_goi       TEXT    NOT NULL,
    so_thang      INTEGER NOT NULL DEFAULT 0,
    so_ngay_them  INTEGER NOT NULL DEFAULT 0,
    -- Dùng REAL thay INTEGER để tránh lỗi làm tròn khi tính khuyến mãi
    gia           REAL    NOT NULL CHECK (gia >= 0),
    mo_ta         TEXT,
    -- Soft Delete
    is_deleted    INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1)),
    ngay_xoa      DATETIME,
    nguoi_xoa_id  INTEGER REFERENCES tai_khoan(id),
    -- Audit
    nguoi_tao_id  INTEGER REFERENCES tai_khoan(id),
    nguoi_cap_nhat_id INTEGER REFERENCES tai_khoan(id),
    ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- 5. GÓI PT (theo buổi hoặc theo tháng)
-- ============================================================
CREATE TABLE IF NOT EXISTS goi_pt (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ten_goi       TEXT    NOT NULL,
    loai_goi      TEXT    NOT NULL CHECK (loai_goi IN ('theo_buoi','theo_thang')),
    so_buoi       INTEGER,         -- Chỉ dùng khi loai_goi = 'theo_buoi'
    so_thang      INTEGER,         -- Chỉ dùng khi loai_goi = 'theo_thang'
    gia           REAL    NOT NULL CHECK (gia >= 0),
    mo_ta         TEXT,
    is_deleted    INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0,1)),
    ngay_xoa      DATETIME,
    nguoi_xoa_id  INTEGER REFERENCES tai_khoan(id),
    nguoi_tao_id  INTEGER REFERENCES tai_khoan(id),
    nguoi_cap_nhat_id INTEGER REFERENCES tai_khoan(id),
    ngay_tao      DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    CHECK (
        (loai_goi = 'theo_buoi'  AND so_buoi  IS NOT NULL AND so_thang IS NULL) OR
        (loai_goi = 'theo_thang' AND so_thang IS NOT NULL AND so_buoi  IS NULL)
    )
);

-- ============================================================
-- 6. ĐĂNG KÝ GÓI TẬP (lưu lịch sử — không ghi đè)
-- ============================================================
CREATE TABLE IF NOT EXISTS dang_ky_goi_tap (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ho_so_id        INTEGER NOT NULL REFERENCES ho_so(id),
    goi_tap_id      INTEGER NOT NULL REFERENCES goi_tap(id),
    tu_ngay         DATE    NOT NULL,
    den_ngay        DATE    NOT NULL,
    gia_thuc_te     REAL    NOT NULL CHECK (gia_thuc_te >= 0),
    ghi_chu_gia     TEXT,   -- Ghi rõ lý do nếu giá khác giá gốc (VD: khuyến mãi)
    trang_thai      TEXT    NOT NULL DEFAULT 'dang_hoat_dong'
                            CHECK (trang_thai IN ('dang_hoat_dong','het_han','huy','tam_dung')),
    -- Thông tin thanh toán (nghiệp vụ quan trọng)
    phuong_thuc_tt  TEXT    NOT NULL
                            CHECK (phuong_thuc_tt IN ('tien_mat','chuyen_khoan','the','momo','zalopay','khac')),
    nguoi_thu_id    INTEGER REFERENCES ho_so(id),     -- Lễ tân / Admin thu tiền
    ma_giao_dich    TEXT,   -- Mã GD chuyển khoản nếu có
    ghi_chu_tt      TEXT,
    ngay_thanh_toan DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    -- Audit
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    CHECK (den_ngay > tu_ngay)
);

-- ============================================================
-- 7. ĐĂNG KÝ PT
-- ============================================================
CREATE TABLE IF NOT EXISTS dang_ky_pt (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    hoi_vien_id     INTEGER NOT NULL REFERENCES ho_so(id),
    pt_id           INTEGER NOT NULL REFERENCES ho_so(id),
    goi_pt_id       INTEGER NOT NULL REFERENCES goi_pt(id),
    so_buoi_dang_ky INTEGER,           -- NULL nếu gói theo tháng
    so_buoi_da_tap  INTEGER NOT NULL DEFAULT 0,
    tu_ngay         DATE    NOT NULL,
    den_ngay        DATE,              -- NULL nếu gói theo buổi
    gia_thuc_te     REAL    NOT NULL CHECK (gia_thuc_te >= 0),
    ghi_chu_gia     TEXT,
    trang_thai      TEXT    NOT NULL DEFAULT 'dang_hoat_dong'
                            CHECK (trang_thai IN ('dang_hoat_dong','hoan_thanh','huy','tam_dung')),
    -- Thanh toán
    phuong_thuc_tt  TEXT    NOT NULL
                            CHECK (phuong_thuc_tt IN ('tien_mat','chuyen_khoan','the','momo','zalopay','khac')),
    nguoi_thu_id    INTEGER REFERENCES ho_so(id),
    ma_giao_dich    TEXT,
    ghi_chu_tt      TEXT,
    ngay_thanh_toan DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    -- Audit
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    CHECK (hoi_vien_id != pt_id)   -- Không thể tự đăng ký PT cho chính mình
);

-- ============================================================
-- 8. LỊCH TẬP PT (có confirmed_by — chỉ admin/lễ tân xác nhận)
-- ============================================================
CREATE TABLE IF NOT EXISTS lich_tap (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    dang_ky_pt_id   INTEGER NOT NULL REFERENCES dang_ky_pt(id) ON DELETE CASCADE,
    pt_id           INTEGER NOT NULL REFERENCES ho_so(id),
    hoi_vien_id     INTEGER NOT NULL REFERENCES ho_so(id),
    ngay_tap        DATE    NOT NULL,
    gio_bat_dau     TIME    NOT NULL,
    gio_ket_thuc    TIME    NOT NULL,
    loai_buoi       TEXT    NOT NULL DEFAULT 'ca_nhan'
                            CHECK (loai_buoi IN ('ca_nhan','nhom')),
    -- Trạng thái 3 bước theo nghiệp vụ
    trang_thai      TEXT    NOT NULL DEFAULT 'cho_tap'
                            CHECK (trang_thai IN ('cho_tap','da_tap','da_huy','vang')),
    -- confirmed_by: chỉ admin hoặc lễ tân được xác nhận "da_tap"
    confirmed_by_id INTEGER REFERENCES tai_khoan(id),
    ngay_xac_nhan   DATETIME,
    -- Nếu hủy: ghi rõ lý do
    ly_do_huy       TEXT,
    nguoi_huy_id    INTEGER REFERENCES tai_khoan(id),
    ngay_huy        DATETIME,
    ghi_chu         TEXT,
    -- Audit
    nguoi_tao_id    INTEGER REFERENCES tai_khoan(id),
    ngay_tao        DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    CHECK (gio_ket_thuc > gio_bat_dau),
    CHECK (pt_id != hoi_vien_id)
);

-- ============================================================
-- 9. CHẤM CÔNG (lưu raw_data để đối soát tranh chấp)
-- ============================================================
CREATE TABLE IF NOT EXISTS cham_cong (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ho_so_id        INTEGER NOT NULL REFERENCES ho_so(id) ON DELETE CASCADE,
    ngay            DATE    NOT NULL,
    gio_vao         DATETIME,
    gio_ra          DATETIME,
    so_gio_cong     REAL    GENERATED ALWAYS AS (
                        CASE
                            WHEN gio_vao IS NOT NULL AND gio_ra IS NOT NULL
                            THEN ROUND((julianday(gio_ra) - julianday(gio_vao)) * 24, 2)
                            ELSE NULL
                        END
                    ) STORED,
    nguon           TEXT    NOT NULL DEFAULT 'may_cham_cong'
                            CHECK (nguon IN ('may_cham_cong','thu_cong','chinh_sua')),
    -- raw_data: lưu nguyên dữ liệu gốc máy chấm công dạng JSON để đối soát
    -- VD: {"device_id":"TC01","raw_in":"0700","raw_out":"1600","fingerprint_id":42}
    raw_data        TEXT,   -- [JSON từ máy chấm công]
    -- Nếu chỉnh sửa thủ công: ghi lý do và ai sửa
    ly_do_chinh_sua TEXT,
    nguoi_chinh_sua_id INTEGER REFERENCES tai_khoan(id),
    ngay_chinh_sua  DATETIME,
    ghi_chu         TEXT,
    ngay_dong_bo    DATETIME DEFAULT (datetime('now','localtime')),
    UNIQUE(ho_so_id, ngay)
);

-- ============================================================
-- 10. LƯỢT VÀO / RA PHÒNG TẬP
-- ============================================================
CREATE TABLE IF NOT EXISTS luot_vao_ra (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ho_so_id    INTEGER REFERENCES ho_so(id) ON DELETE SET NULL,  -- NULL = khách vãng lai
    thoi_diem   DATETIME NOT NULL DEFAULT (datetime('now','localtime')),
    loai        TEXT     NOT NULL CHECK (loai IN ('vao','ra')),
    phuong_thuc TEXT     NOT NULL DEFAULT 'the_tu'
                         CHECK (phuong_thuc IN ('the_tu','qr_code','thu_cong','khuon_mat')),
    ghi_chu     TEXT
);

-- ============================================================
-- 11. DOANH THU (tổng hợp theo ngày)
-- ============================================================
CREATE TABLE IF NOT EXISTS doanh_thu (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ngay            DATE    NOT NULL UNIQUE,
    tong_tien       REAL    NOT NULL DEFAULT 0,
    tong_don        INTEGER NOT NULL DEFAULT 0,
    tien_goi_tap    REAL    NOT NULL DEFAULT 0,
    tien_goi_pt     REAL    NOT NULL DEFAULT 0,
    ghi_chu         TEXT,
    ngay_cap_nhat   DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- 12. AUDIT LOG — Ghi lại mọi hành động nhạy cảm
--     Bảng này KHÔNG bao giờ được UPDATE hoặc DELETE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tai_khoan_id    INTEGER REFERENCES tai_khoan(id) ON DELETE SET NULL,
    ten_dang_nhap   TEXT    NOT NULL,   -- Lưu lại tên tại thời điểm thực hiện
    vai_tro         TEXT    NOT NULL,   -- Lưu lại vai trò tại thời điểm thực hiện
    hanh_dong       TEXT    NOT NULL,   -- 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CONFIG'
    doi_tuong       TEXT    NOT NULL,   -- Tên bảng bị tác động: 'ho_so', 'goi_tap', 'lich_tap'...
    doi_tuong_id    INTEGER,            -- ID của bản ghi bị tác động
    gia_tri_cu      TEXT,               -- JSON giá trị trước khi thay đổi
    gia_tri_moi     TEXT,               -- JSON giá trị sau khi thay đổi
    ip_address      TEXT,               -- IP của người thực hiện (ghi từ tầng app)
    user_agent      TEXT,               -- Trình duyệt / thiết bị
    ghi_chu         TEXT,
    thoi_diem       DATETIME NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ho_so_loai         ON ho_so(loai_ho_so) WHERE is_deleted = 0;
CREATE INDEX IF NOT EXISTS idx_ho_so_trang_thai   ON ho_so(is_deleted);
CREATE INDEX IF NOT EXISTS idx_dkgt_ho_so         ON dang_ky_goi_tap(ho_so_id);
CREATE INDEX IF NOT EXISTS idx_dkgt_trang_thai    ON dang_ky_goi_tap(trang_thai);
CREATE INDEX IF NOT EXISTS idx_dkgt_den_ngay      ON dang_ky_goi_tap(den_ngay);
CREATE INDEX IF NOT EXISTS idx_dkpt_hoivien       ON dang_ky_pt(hoi_vien_id);
CREATE INDEX IF NOT EXISTS idx_dkpt_pt            ON dang_ky_pt(pt_id);
CREATE INDEX IF NOT EXISTS idx_lich_tap_ngay      ON lich_tap(ngay_tap);
CREATE INDEX IF NOT EXISTS idx_lich_tap_pt        ON lich_tap(pt_id);
CREATE INDEX IF NOT EXISTS idx_lich_tap_hoivien   ON lich_tap(hoi_vien_id);
CREATE INDEX IF NOT EXISTS idx_cham_cong_ngay     ON cham_cong(ho_so_id, ngay);
CREATE INDEX IF NOT EXISTS idx_luot_vr_thoiDiem   ON luot_vao_ra(thoi_diem);
CREATE INDEX IF NOT EXISTS idx_luot_vr_ho_so      ON luot_vao_ra(ho_so_id);
CREATE INDEX IF NOT EXISTS idx_doanh_thu_ngay     ON doanh_thu(ngay);
CREATE INDEX IF NOT EXISTS idx_audit_log_taikhoan ON audit_log(tai_khoan_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_doi_tuong ON audit_log(doi_tuong, doi_tuong_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_thoiDiem ON audit_log(thoi_diem);

-- ============================================================
-- VIEW
-- ============================================================

-- V1: Trạng thái hội viên (tính tự động theo ngày, chuẩn màu sắc UI)
CREATE VIEW IF NOT EXISTS v_trang_thai_hoi_vien AS
SELECT
    h.id,
    h.ma_ho_so,
    h.ho_ten,
    h.so_dien_thoai,
    h.avatar_url,
    -- Lấy gói tập còn hạn lâu nhất
    (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk
     WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS den_ngay_xa_nhat,
    -- Tính trạng thái màu sắc theo nghiệp vụ
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
            THEN 'chua_dang_ky'         -- Trắng
        WHEN (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
             < date('now','localtime')
            THEN 'het_han'              -- Đỏ
        WHEN (SELECT MAX(den_ngay) FROM dang_ky_goi_tap dk WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong')
             <= date('now','localtime','+7 days')
            THEN 'sap_het_han'          -- Vàng
        ELSE 'con_han'                  -- Xanh
    END AS trang_thai_mau,
    -- Có đang đăng ký PT không
    (SELECT COUNT(*) FROM dang_ky_pt dp
     WHERE dp.hoi_vien_id = h.id AND dp.trang_thai = 'dang_hoat_dong') AS so_goi_pt_dang_tap,
    -- Số gói tập đang chạy song song
    (SELECT COUNT(*) FROM dang_ky_goi_tap dk
     WHERE dk.ho_so_id = h.id AND dk.trang_thai = 'dang_hoat_dong') AS so_goi_tap_hien_tai
FROM ho_so h
WHERE h.loai_ho_so = 'hoi_vien'
  AND h.is_deleted = 0;

-- V2: Lịch tập hôm nay đầy đủ
CREATE VIEW IF NOT EXISTS v_lich_tap_hom_nay AS
SELECT
    lt.id,
    lt.ngay_tap,
    lt.gio_bat_dau,
    lt.gio_ket_thuc,
    lt.loai_buoi,
    lt.trang_thai,
    lt.ghi_chu,
    hv.id        AS hoi_vien_id,
    hv.ho_ten    AS ten_hoi_vien,
    hv.avatar_url AS avatar_hoi_vien,
    pt.id        AS pt_id,
    pt.ho_ten    AS ten_pt,
    pt.avatar_url AS avatar_pt,
    -- Còn bao nhiêu buổi
    (dk.so_buoi_dang_ky - dk.so_buoi_da_tap) AS buoi_con_lai
FROM lich_tap lt
JOIN ho_so hv ON hv.id = lt.hoi_vien_id
JOIN ho_so pt ON pt.id = lt.pt_id
JOIN dang_ky_pt dk ON dk.id = lt.dang_ky_pt_id
WHERE lt.ngay_tap = date('now','localtime')
ORDER BY lt.gio_bat_dau;

-- V3: Doanh thu 30 ngày + so sánh với tháng trước
CREATE VIEW IF NOT EXISTS v_doanh_thu_30_ngay AS
SELECT
    d.ngay,
    d.tong_tien,
    d.tong_don,
    d.tien_goi_tap,
    d.tien_goi_pt,
    -- So sánh với cùng ngày tháng trước
    (SELECT tong_tien FROM doanh_thu d2
     WHERE d2.ngay = date(d.ngay, '-1 month')) AS tong_tien_thang_truoc
FROM doanh_thu d
WHERE d.ngay >= date('now','localtime','-30 days')
ORDER BY d.ngay DESC;

-- V4: Giờ công tháng hiện tại
CREATE VIEW IF NOT EXISTS v_gio_cong_thang_nay AS
SELECT
    h.id,
    h.ma_ho_so,
    h.ho_ten,
    h.loai_ho_so,
    COUNT(cc.ngay)       AS so_ngay_di_lam,
    SUM(cc.so_gio_cong)  AS tong_gio_cong,
    AVG(cc.so_gio_cong)  AS trung_binh_gio_ngay
FROM ho_so h
JOIN cham_cong cc ON cc.ho_so_id = h.id
WHERE h.loai_ho_so IN ('pt','nhan_vien','le_tan')
  AND h.is_deleted = 0
  AND strftime('%Y-%m', cc.ngay) = strftime('%Y-%m','now','localtime')
GROUP BY h.id, h.ma_ho_so, h.ho_ten, h.loai_ho_so;

-- V5: Mật độ khách theo khung giờ hôm nay (dùng vẽ biểu đồ)
CREATE VIEW IF NOT EXISTS v_mat_do_khach_theo_gio AS
SELECT
    strftime('%H', thoi_diem)  AS gio,
    COUNT(*)                   AS so_luot_vao
FROM luot_vao_ra
WHERE loai = 'vao'
  AND date(thoi_diem) = date('now','localtime')
GROUP BY gio
ORDER BY gio;

-- V6: Audit log dễ đọc (join tên người thực hiện)
CREATE VIEW IF NOT EXISTS v_audit_log AS
SELECT
    al.id,
    al.thoi_diem,
    al.ten_dang_nhap,
    al.vai_tro,
    al.hanh_dong,
    al.doi_tuong,
    al.doi_tuong_id,
    al.gia_tri_cu,
    al.gia_tri_moi,
    al.ip_address,
    al.ghi_chu
FROM audit_log al
ORDER BY al.thoi_diem DESC;

-- ============================================================
-- TRIGGER
-- ============================================================

-- Auto cập nhật ngay_cap_nhat
CREATE TRIGGER IF NOT EXISTS trg_tai_khoan_upd
    AFTER UPDATE ON tai_khoan BEGIN
    UPDATE tai_khoan SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_ho_so_upd
    AFTER UPDATE ON ho_so BEGIN
    UPDATE ho_so SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_goi_tap_upd
    AFTER UPDATE ON goi_tap BEGIN
    UPDATE goi_tap SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_dkgt_upd
    AFTER UPDATE ON dang_ky_goi_tap BEGIN
    UPDATE dang_ky_goi_tap SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_dkpt_upd
    AFTER UPDATE ON dang_ky_pt BEGIN
    UPDATE dang_ky_pt SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_lich_tap_upd
    AFTER UPDATE ON lich_tap BEGIN
    UPDATE lich_tap SET ngay_cap_nhat = datetime('now','localtime') WHERE id = NEW.id;
END;

-- Khi xác nhận buổi "da_tap" → tăng so_buoi_da_tap + ghi ngay_xac_nhan
CREATE TRIGGER IF NOT EXISTS trg_xac_nhan_buoi_tap
    AFTER UPDATE OF trang_thai ON lich_tap
    WHEN NEW.trang_thai = 'da_tap' AND OLD.trang_thai != 'da_tap' BEGIN
    UPDATE dang_ky_pt
    SET so_buoi_da_tap = so_buoi_da_tap + 1
    WHERE id = NEW.dang_ky_pt_id;

    UPDATE lich_tap
    SET ngay_xac_nhan = datetime('now','localtime')
    WHERE id = NEW.id;
END;

-- Khi hủy buổi tập → ghi ngay_huy
CREATE TRIGGER IF NOT EXISTS trg_huy_buoi_tap
    AFTER UPDATE OF trang_thai ON lich_tap
    WHEN NEW.trang_thai = 'da_huy' AND OLD.trang_thai != 'da_huy' BEGIN
    UPDATE lich_tap
    SET ngay_huy = datetime('now','localtime')
    WHERE id = NEW.id;
END;

-- NGHIỆP VỤ QUAN TRỌNG:
-- Ngăn xóa thật gói tập nếu đã có người đăng ký (chỉ cho phép Soft Delete)
CREATE TRIGGER IF NOT EXISTS trg_chong_xoa_goi_tap
    BEFORE DELETE ON goi_tap BEGIN
    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM dang_ky_goi_tap WHERE goi_tap_id = OLD.id)
        THEN RAISE(ABORT, 'KHÔNG THỂ XÓA: Gói tập đã có người đăng ký. Hãy dùng Soft Delete (is_deleted=1).')
    END;
END;

-- Ngăn xóa thật gói PT nếu đã có người đăng ký
CREATE TRIGGER IF NOT EXISTS trg_chong_xoa_goi_pt
    BEFORE DELETE ON goi_pt BEGIN
    SELECT CASE
        WHEN EXISTS (SELECT 1 FROM dang_ky_pt WHERE goi_pt_id = OLD.id)
        THEN RAISE(ABORT, 'KHÔNG THỂ XÓA: Gói PT đã có người đăng ký. Hãy dùng Soft Delete (is_deleted=1).')
    END;
END;

-- Ngăn xóa thật hồ sơ (bảo vệ lịch sử doanh thu)
CREATE TRIGGER IF NOT EXISTS trg_chong_xoa_ho_so
    BEFORE DELETE ON ho_so BEGIN
    SELECT RAISE(ABORT, 'KHÔNG THỂ XÓA: Hãy dùng Soft Delete (is_deleted=1, ngay_xoa, nguoi_xoa_id).');
END;

-- Tự động cộng doanh thu khi đăng ký gói tập mới
CREATE TRIGGER IF NOT EXISTS trg_doanh_thu_goi_tap
    AFTER INSERT ON dang_ky_goi_tap BEGIN
    INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
    VALUES (date('now','localtime'), NEW.gia_thuc_te, 1, NEW.gia_thuc_te, 0)
    ON CONFLICT(ngay) DO UPDATE SET
        tong_tien    = tong_tien + NEW.gia_thuc_te,
        tong_don     = tong_don + 1,
        tien_goi_tap = tien_goi_tap + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');
END;

-- Tự động cộng doanh thu khi đăng ký gói PT mới
CREATE TRIGGER IF NOT EXISTS trg_doanh_thu_goi_pt
    AFTER INSERT ON dang_ky_pt BEGIN
    INSERT INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt)
    VALUES (date('now','localtime'), NEW.gia_thuc_te, 1, 0, NEW.gia_thuc_te)
    ON CONFLICT(ngay) DO UPDATE SET
        tong_tien   = tong_tien + NEW.gia_thuc_te,
        tong_don    = tong_don + 1,
        tien_goi_pt = tien_goi_pt + NEW.gia_thuc_te,
        ngay_cap_nhat = datetime('now','localtime');
END;

-- ============================================================
-- DỮ LIỆU MẪU (SEED)
-- ============================================================

-- Tài khoản (password "123456" — thay bằng bcrypt thật khi deploy)
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau_hash, vai_tro_id) VALUES
    ('admin',     '$2b$12$SEED.ADMIN.HASH.REPLACE.IN.PRODUCTION.xxxxx', 1),
    ('letan01',   '$2b$12$SEED.LETAN.HASH.REPLACE.IN.PRODUCTION.xxxxx', 2),
    ('pt01',      '$2b$12$SEED.PT01.HASH.REPLACE.IN.PRODUCTION.xxxxxx', 3),
    ('pt02',      '$2b$12$SEED.PT02.HASH.REPLACE.IN.PRODUCTION.xxxxxx', 3),
    ('hoivien01', '$2b$12$SEED.HV01.HASH.REPLACE.IN.PRODUCTION.xxxxxx', 4),
    ('hoivien02', '$2b$12$SEED.HV02.HASH.REPLACE.IN.PRODUCTION.xxxxxx', 4),
    ('hoivien03', '$2b$12$SEED.HV03.HASH.REPLACE.IN.PRODUCTION.xxxxxx', 4);

-- Hồ sơ (so_dien_thoai, email, cmnd_cccd để dạng plain — PHẢI encrypt khi deploy thật)
INSERT INTO ho_so (tai_khoan_id, ma_ho_so, loai_ho_so, ho_ten, gioi_tinh, ngay_sinh, so_dien_thoai, email, avatar_url, nguoi_tao_id) VALUES
    (1, 'AD001', 'nhan_vien', 'Nguyễn Văn Admin',    'nam', '1990-01-15', '0901000001', 'admin@paradise.gym',    'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/admin.jpg',  1),
    (2, 'LT001', 'le_tan',    'Trần Thị Lễ Tân',     'nu',  '1998-05-20', '0901000002', 'letan01@paradise.gym',  'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/lt001.jpg', 1),
    (3, 'PT001', 'pt',        'Lê Văn Tuấn',          'nam', '1995-03-10', '0901000003', 'pt01@paradise.gym',     'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/pt001.jpg', 1),
    (4, 'PT002', 'pt',        'Phạm Thị Lan',         'nu',  '1996-07-22', '0901000004', 'pt02@paradise.gym',     'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/pt002.jpg', 1),
    (5, 'HV001', 'hoi_vien',  'Võ Văn Minh',          'nam', '2000-09-05', '0901000005', 'hv01@gmail.com',        'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/hv001.jpg', 2),
    (6, 'HV002', 'hoi_vien',  'Ngô Thị Hoa',          'nu',  '1999-12-18', '0901000006', 'hv02@gmail.com',        'https://res.cloudinary.com/paradise-gym/image/upload/v1/profiles/hv002.jpg', 2),
    (7, 'HV003', 'hoi_vien',  'Đặng Văn Khoa',        'nam', '2001-04-30', '0901000007', 'hv03@gmail.com',        NULL, 2);

-- Gói tập
INSERT INTO goi_tap (ten_goi, so_thang, so_ngay_them, gia, mo_ta, nguoi_tao_id) VALUES
    ('Gói 1 tháng',          1,  0,  500000, 'Tập không giới hạn trong 1 tháng', 1),
    ('Gói 3 tháng',          3,  0, 1350000, 'Tiết kiệm 10% so với gói 1 tháng', 1),
    ('Gói 6 tháng',          6,  0, 2400000, 'Tiết kiệm 20% so với gói 1 tháng', 1),
    ('Gói 12 tháng',        12,  0, 4200000, 'Tiết kiệm 30% — Gói năm tốt nhất', 1),
    ('Gói 1 tháng + 5 ngày', 1,  5,  550000, 'Tháng + thêm 5 ngày khuyến mãi',  1);

-- Gói PT
INSERT INTO goi_pt (ten_goi, loai_goi, so_buoi, so_thang, gia, nguoi_tao_id) VALUES
    ('PT 10 buổi',      'theo_buoi',  10, NULL, 1500000, 1),
    ('PT 20 buổi',      'theo_buoi',  20, NULL, 2800000, 1),
    ('PT 1 tháng',      'theo_thang', NULL, 1,  2000000, 1),
    ('PT 3 tháng',      'theo_thang', NULL, 3,  5500000, 1),
    ('PT Nhóm 10 buổi', 'theo_buoi',  10, NULL,  800000, 1);

-- Đăng ký gói tập (nhiều gói song song cho HV002)
INSERT INTO dang_ky_goi_tap (ho_so_id, goi_tap_id, tu_ngay, den_ngay, gia_thuc_te, trang_thai, phuong_thuc_tt, nguoi_thu_id, nguoi_tao_id) VALUES
    (5, 2, date('now','-60 days'), date('now','30 days'),  1350000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 1, date('now','-25 days'), date('now','5 days'),    500000, 'dang_hoat_dong', 'chuyen_khoan', 2, 2),
    (6, 3, date('now'),            date('now','180 days'), 2400000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (7, 1, date('now','-90 days'), date('now','-60 days'),  500000, 'het_han',        'tien_mat',     2, 2);

-- Đăng ký PT
INSERT INTO dang_ky_pt (hoi_vien_id, pt_id, goi_pt_id, so_buoi_dang_ky, so_buoi_da_tap, tu_ngay, gia_thuc_te, trang_thai, phuong_thuc_tt, nguoi_thu_id, nguoi_tao_id) VALUES
    (5, 3, 1, 10, 3, date('now','-14 days'), 1500000, 'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 4, 3, NULL, 8, date('now','-14 days'), 2000000, 'dang_hoat_dong', 'chuyen_khoan', 2, 2),
    (5, 3, 5, 10, 2, date('now','-7 days'),   800000,  'dang_hoat_dong', 'tien_mat',     2, 2),
    (6, 3, 5, 10, 2, date('now','-7 days'),   800000,  'dang_hoat_dong', 'tien_mat',     2, 2);

-- Lịch tập
INSERT INTO lich_tap (dang_ky_pt_id, pt_id, hoi_vien_id, ngay_tap, gio_bat_dau, gio_ket_thuc, loai_buoi, trang_thai, confirmed_by_id, ngay_xac_nhan, nguoi_tao_id) VALUES
    (1, 3, 5, date('now','-10 days'), '07:00','08:00', 'ca_nhan', 'da_tap', 1, datetime('now','-10 days','+8 hours'), 2),
    (1, 3, 5, date('now','-8 days'),  '07:00','08:00', 'ca_nhan', 'da_tap', 1, datetime('now','-8 days','+8 hours'),  2),
    (1, 3, 5, date('now','-6 days'),  '07:00','08:00', 'ca_nhan', 'da_tap', 2, datetime('now','-6 days','+8 hours'),  2),
    (1, 3, 5, date('now'),            '07:00','08:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (1, 3, 5, date('now','2 days'),   '07:00','08:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (2, 4, 6, date('now'),            '09:00','10:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (2, 4, 6, date('now','1 days'),   '09:00','10:00', 'ca_nhan', 'cho_tap', NULL, NULL, 2),
    (3, 3, 5, date('now'),            '17:00','18:00', 'nhom',    'cho_tap', NULL, NULL, 2),
    (4, 3, 6, date('now'),            '17:00','18:00', 'nhom',    'cho_tap', NULL, NULL, 2);

-- Chấm công (có raw_data mẫu)
INSERT INTO cham_cong (ho_so_id, ngay, gio_vao, gio_ra, nguon, raw_data) VALUES
    (3, date('now','-6 days'), datetime('now','-6 days','start of day','+6 hours'), datetime('now','-6 days','start of day','+14 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":3,"raw_in":"060012","raw_out":"140005"}'),
    (3, date('now','-5 days'), datetime('now','-5 days','start of day','+6 hours'), datetime('now','-5 days','start of day','+14 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":3,"raw_in":"060145","raw_out":"140213"}'),
    (3, date('now','-4 days'), datetime('now','-4 days','start of day','+6 hours'), datetime('now','-4 days','start of day','+14 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":3,"raw_in":"060230","raw_out":"140100"}'),
    (3, date('now','-1 days'), datetime('now','-1 days','start of day','+6 hours'), datetime('now','-1 days','start of day','+14 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":3,"raw_in":"060300","raw_out":"140015"}'),
    (4, date('now','-6 days'), datetime('now','-6 days','start of day','+8 hours'), datetime('now','-6 days','start of day','+17 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":4,"raw_in":"080100","raw_out":"170230"}'),
    (4, date('now','-5 days'), datetime('now','-5 days','start of day','+8 hours'), datetime('now','-5 days','start of day','+17 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":4,"raw_in":"080000","raw_out":"170130"}'),
    (4, date('now','-1 days'), datetime('now','-1 days','start of day','+8 hours'), datetime('now','-1 days','start of day','+17 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":4,"raw_in":"080015","raw_out":"170000"}'),
    (2, date('now','-6 days'), datetime('now','-6 days','start of day','+7 hours'), datetime('now','-6 days','start of day','+16 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":2,"raw_in":"070010","raw_out":"160000"}'),
    (2, date('now','-5 days'), datetime('now','-5 days','start of day','+7 hours'), datetime('now','-5 days','start of day','+16 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":2,"raw_in":"070020","raw_out":"160100"}'),
    (2, date('now','-4 days'), datetime('now','-4 days','start of day','+7 hours'), datetime('now','-4 days','start of day','+16 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":2,"raw_in":"065930","raw_out":"160000"}'),
    (2, date('now','-1 days'), datetime('now','-1 days','start of day','+7 hours'), datetime('now','-1 days','start of day','+16 hours'), 'may_cham_cong', '{"device_id":"TC01","fingerprint_id":2,"raw_in":"070005","raw_out":"160030"}');

-- Lượt vào/ra
INSERT INTO luot_vao_ra (ho_so_id, thoi_diem, loai, phuong_thuc) VALUES
    (5, datetime('now','-3 hours'),           'vao', 'the_tu'),
    (6, datetime('now','-2 hours'),           'vao', 'the_tu'),
    (7, datetime('now','-2 hours','+15 minutes'),'vao','qr_code'),
    (5, datetime('now','-1 hours'),           'ra',  'the_tu'),
    (7, datetime('now','-30 minutes'),        'ra',  'qr_code');

-- Doanh thu lịch sử 6 ngày trước (ngày hiện tại đã được trigger tự tạo khi INSERT dang_ky_goi_tap)
INSERT OR IGNORE INTO doanh_thu (ngay, tong_tien, tong_don, tien_goi_tap, tien_goi_pt) VALUES
    (date('now','-6 days'), 3500000, 4, 2000000, 1500000),
    (date('now','-5 days'), 2800000, 3, 1800000, 1000000),
    (date('now','-4 days'), 4200000, 5, 2700000, 1500000),
    (date('now','-3 days'), 1500000, 2,  500000, 1000000),
    (date('now','-2 days'), 5500000, 6, 3500000, 2000000),
    (date('now','-1 days'), 3200000, 4, 2200000, 1000000);

-- Audit log mẫu
INSERT INTO audit_log (tai_khoan_id, ten_dang_nhap, vai_tro, hanh_dong, doi_tuong, doi_tuong_id, gia_tri_cu, gia_tri_moi, ip_address, ghi_chu) VALUES
    (1, 'admin',   'admin',   'CREATE', 'goi_tap',  1,    NULL, '{"ten_goi":"Gói 1 tháng","gia":500000}', '127.0.0.1', 'Tạo gói tập mới'),
    (2, 'letan01', 'le_tan',  'CREATE', 'ho_so',    5,    NULL, '{"ho_ten":"Võ Văn Minh","loai":"hoi_vien"}', '192.168.1.10', 'Tạo hồ sơ hội viên mới'),
    (2, 'letan01', 'le_tan',  'CREATE', 'dang_ky_goi_tap', 1, NULL, '{"ho_so_id":5,"goi_tap_id":2,"gia":1350000}', '192.168.1.10', 'Đăng ký gói 3 tháng cho HV001'),
    (1, 'admin',   'admin',   'UPDATE', 'lich_tap', 1, '{"trang_thai":"cho_tap"}', '{"trang_thai":"da_tap"}', '127.0.0.1', 'Xác nhận buổi tập'),
    (2, 'letan01', 'le_tan',  'LOGIN',  'tai_khoan', 2, NULL, NULL, '192.168.1.10', 'Đăng nhập thành công');

-- ============================================================
-- QUERY MẪU QUAN TRỌNG (comment để tham khảo)
-- ============================================================

-- [RBAC] Lễ tân xem hội viên — app phải filter is_deleted = 0:
-- SELECT * FROM v_trang_thai_hoi_vien;

-- [RBAC] PT chỉ thấy lịch tập của mình:
-- SELECT * FROM v_lich_tap_hom_nay WHERE pt_id = :current_user_ho_so_id;

-- [RBAC] Hội viên chỉ thấy lịch của mình:
-- SELECT * FROM v_lich_tap_hom_nay WHERE hoi_vien_id = :current_user_ho_so_id;

-- Hội viên sắp hết hạn (7 ngày):
-- SELECT * FROM v_trang_thai_hoi_vien WHERE trang_thai_mau = 'sap_het_han';

-- Hội viên hết hạn:
-- SELECT * FROM v_trang_thai_hoi_vien WHERE trang_thai_mau = 'het_han';

-- Soft Delete hồ sơ (THAY VÌ xóa thật):
-- UPDATE ho_so SET is_deleted=1, ngay_xoa=datetime('now','localtime'), nguoi_xoa_id=:admin_id, ly_do_xoa='...' WHERE id=:id;

-- Soft Delete gói tập (THAY VÌ xóa thật):
-- UPDATE goi_tap SET is_deleted=1, ngay_xoa=datetime('now','localtime'), nguoi_xoa_id=:admin_id WHERE id=:id;

-- Xem audit log 30 ngày gần nhất:
-- SELECT * FROM v_audit_log WHERE thoi_diem >= datetime('now','-30 days','localtime');

-- Xem ai đã thay đổi giá gói tập:
-- SELECT * FROM v_audit_log WHERE doi_tuong='goi_tap' AND hanh_dong='UPDATE';

-- Buổi còn lại của hội viên:
-- SELECT so_buoi_dang_ky - so_buoi_da_tap AS buoi_con_lai FROM dang_ky_pt WHERE hoi_vien_id=5 AND trang_thai='dang_hoat_dong';

-- Đối soát chấm công (xem raw_data khi tranh chấp):
-- SELECT ho_so_id, ngay, gio_vao, gio_ra, so_gio_cong, raw_data FROM cham_cong WHERE ho_so_id=3 AND ngay='2025-05-01';
