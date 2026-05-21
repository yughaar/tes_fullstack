/**
 * Fleetify - Fleet Maintenance Frontend Application
 * Uses Vanilla JS with document.createElement() (NO innerHTML)
 */

let currentUser = null;
let vehicles = [];
let masterItems = [];
let reports = [];

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initTabs();
    initLogout();
    initExportCSV();
});

// ==================== LOGIN ====================

async function initLogin() {
    const userSelect = document.getElementById('user-select');
    const btnLogin = document.getElementById('btn-login');

    try {
        const response = await API.getUsers();
        const users = response.data;

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username + ' (' + user.role + ')';
            userSelect.appendChild(option);
        });
    } catch (err) {
        showAlert('Gagal memuat daftar user: ' + err.message, 'danger');
    }

    userSelect.addEventListener('change', () => {
        btnLogin.disabled = !userSelect.value;
    });

    btnLogin.addEventListener('click', async () => {
        const userId = parseInt(userSelect.value);
        if (!userId) return;

        API.setUserID(userId);

        try {
            const response = await API.getCurrentUser();
            currentUser = response.data;
            showApp();
        } catch (err) {
            showAlert('Login gagal: ' + err.message, 'danger');
        }
    });
}

function showApp() {
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('app-section').classList.remove('d-none');

    // Update user info
    const userInfo = document.getElementById('user-info');
    clearElement(userInfo);
    const icon = document.createElement('i');
    icon.className = 'bi bi-person-circle';
    userInfo.appendChild(icon);
    userInfo.appendChild(document.createTextNode(' ' + currentUser.username + ' (' + currentUser.role + ')'));

    // Show/hide tabs based on role
    const tabCreate = document.getElementById('tab-create-report');
    if (currentUser.role === 'SA') {
        tabCreate.classList.remove('d-none');
    } else {
        tabCreate.classList.add('d-none');
    }

    // Init filters after app is visible
    initFilters();

    // Load data
    loadVehicles();
    loadMasterItems();
    loadReports();
}

// ==================== TABS ====================

function initTabs() {
    const tabs = document.querySelectorAll('#main-tabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.getAttribute('data-tab');
            document.getElementById('tab-content-reports').classList.add('d-none');
            document.getElementById('tab-content-create').classList.add('d-none');
            document.getElementById('tab-content-' + tabName).classList.remove('d-none');
        });
    });
}

// ==================== LOGOUT ====================

function initLogout() {
    document.getElementById('btn-logout').addEventListener('click', () => {
        currentUser = null;
        API.setUserID(null);
        document.getElementById('app-section').classList.add('d-none');
        document.getElementById('login-section').classList.remove('d-none');
    });
}

// ==================== LOAD DATA ====================

async function loadVehicles() {
    try {
        const response = await API.getVehicles();
        vehicles = response.data;
        populateVehicleSelect();
        populateFilterVehicle();
    } catch (err) {
        console.error('Failed to load vehicles:', err);
    }
}

async function loadMasterItems() {
    try {
        const response = await API.getMasterItems();
        masterItems = response.data;
        initCreateReportForm();
    } catch (err) {
        console.error('Failed to load master items:', err);
    }
}

async function loadReports() {
    try {
        const response = await API.getReports();
        reports = response.data || [];
        renderReportsTable();
    } catch (err) {
        console.error('Failed to load reports:', err);
    }
}

// ==================== VEHICLES SELECT ====================

function populateVehicleSelect() {
    const select = document.getElementById('vehicle-select');
    // Clear existing options except first
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }

    vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = v.license_plate + ' - ' + v.model;
        select.appendChild(option);
    });
}

// ==================== REPORTS TABLE (F-04) ====================

function renderReportsTable() {
    const tbody = document.getElementById('reports-table-body');
    clearElement(tbody);

    const filteredReports = getFilteredReports();

    // Update count
    const countEl = document.getElementById('report-count');
    if (countEl) {
        countEl.textContent = filteredReports.length + ' dari ' + reports.length + ' laporan';
    }

    if (filteredReports.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '8');
        td.className = 'text-center text-muted py-4';
        td.textContent = reports.length === 0 ? 'Belum ada laporan' : 'Tidak ada laporan yang cocok dengan filter';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    filteredReports.forEach((report, index) => {
        const tr = document.createElement('tr');

        // No
        const tdNo = document.createElement('td');
        tdNo.textContent = (index + 1).toString();
        tr.appendChild(tdNo);

        // Nama SA
        const tdSA = document.createElement('td');
        tdSA.textContent = report.creator ? report.creator.username : '-';
        tr.appendChild(tdSA);

        // Nomor Polisi
        const tdPlate = document.createElement('td');
        tdPlate.textContent = report.vehicle ? report.vehicle.license_plate : '-';
        tr.appendChild(tdPlate);

        // Kendaraan
        const tdModel = document.createElement('td');
        tdModel.textContent = report.vehicle ? report.vehicle.model : '-';
        tr.appendChild(tdModel);

        // Keluhan
        const tdComplaint = document.createElement('td');
        tdComplaint.textContent = report.complaint.length > 50
            ? report.complaint.substring(0, 50) + '...'
            : report.complaint;
        tr.appendChild(tdComplaint);

        // Status
        const tdStatus = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge ' + getStatusBadgeClass(report.status);
        badge.textContent = report.status;
        tdStatus.appendChild(badge);
        tr.appendChild(tdStatus);

        // Tanggal
        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(report.created_at);
        tr.appendChild(tdDate);

        // Aksi
        const tdAction = document.createElement('td');
        const btnDetail = document.createElement('button');
        btnDetail.className = 'btn btn-info btn-sm me-1';
        btnDetail.textContent = 'Detail';
        btnDetail.addEventListener('click', () => showReportDetail(report.id));
        tdAction.appendChild(btnDetail);

        // Approve button (only for APPROVAL role and PENDING status)
        if (currentUser.role === 'APPROVAL' && report.status === 'PENDING_APPROVAL') {
            const btnApprove = document.createElement('button');
            btnApprove.className = 'btn btn-success btn-sm me-1';
            btnApprove.textContent = 'Approve';
            btnApprove.addEventListener('click', () => approveReport(report.id));
            tdAction.appendChild(btnApprove);
        }

        // Complete button (only for SA role and APPROVED status)
        if (currentUser.role === 'SA' && report.status === 'APPROVED') {
            const btnComplete = document.createElement('button');
            btnComplete.className = 'btn btn-warning btn-sm';
            btnComplete.textContent = 'Selesai';
            btnComplete.addEventListener('click', () => showCompleteModal(report.id));
            tdAction.appendChild(btnComplete);
        }

        tr.appendChild(tdAction);
        tbody.appendChild(tr);
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'PENDING_APPROVAL': return 'badge-pending';
        case 'APPROVED': return 'badge-approved';
        case 'COMPLETED': return 'badge-completed';
        default: return 'bg-secondary';
    }
}

// ==================== REPORT DETAIL ====================

async function showReportDetail(reportId) {
    try {
        const response = await API.getReport(reportId);
        const report = response.data;

        const body = document.getElementById('report-detail-body');
        clearElement(body);

        // Report info
        const infoDiv = document.createElement('div');
        infoDiv.className = 'row';

        // Left column
        const leftCol = document.createElement('div');
        leftCol.className = 'col-md-6';

        appendInfoRow(leftCol, 'ID Laporan', '#' + report.id);
        appendInfoRow(leftCol, 'Service Advisor', report.creator ? report.creator.username : '-');
        appendInfoRow(leftCol, 'Kendaraan', report.vehicle ? report.vehicle.license_plate + ' - ' + report.vehicle.model : '-');
        appendInfoRow(leftCol, 'Odometer', report.odometer + ' km');
        appendInfoRow(leftCol, 'Status', report.status);
        appendInfoRow(leftCol, 'Tanggal', formatDate(report.created_at));

        infoDiv.appendChild(leftCol);

        // Right column - photos
        const rightCol = document.createElement('div');
        rightCol.className = 'col-md-6';

        if (report.initial_photo) {
            const photoLabel = document.createElement('p');
            photoLabel.className = 'fw-bold';
            photoLabel.textContent = 'Foto Awal:';
            rightCol.appendChild(photoLabel);

            const img = document.createElement('img');
            img.src = '/' + report.initial_photo;
            img.className = 'report-photo mb-2';
            img.alt = 'Foto Awal';
            rightCol.appendChild(img);
        }

        if (report.proof_photo) {
            const proofLabel = document.createElement('p');
            proofLabel.className = 'fw-bold';
            proofLabel.textContent = 'Foto Bukti Pengerjaan:';
            rightCol.appendChild(proofLabel);

            const proofImg = document.createElement('img');
            proofImg.src = '/' + report.proof_photo;
            proofImg.className = 'report-photo mb-2';
            proofImg.alt = 'Foto Bukti';
            rightCol.appendChild(proofImg);
        }

        infoDiv.appendChild(rightCol);
        body.appendChild(infoDiv);

        // Complaint
        const complaintDiv = document.createElement('div');
        complaintDiv.className = 'mt-3';
        const complaintLabel = document.createElement('p');
        complaintLabel.className = 'fw-bold';
        complaintLabel.textContent = 'Keluhan:';
        complaintDiv.appendChild(complaintLabel);
        const complaintText = document.createElement('p');
        complaintText.textContent = report.complaint;
        complaintDiv.appendChild(complaintText);
        body.appendChild(complaintDiv);

        // Items table
        if (report.items && report.items.length > 0) {
            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'mt-3';

            const itemsLabel = document.createElement('p');
            itemsLabel.className = 'fw-bold';
            itemsLabel.textContent = 'Daftar Part/Jasa:';
            itemsDiv.appendChild(itemsLabel);

            const table = document.createElement('table');
            table.className = 'table table-sm table-bordered';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Nama Item', 'Tipe', 'Qty', 'Harga Satuan', 'Subtotal'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbodyItems = document.createElement('tbody');
            let totalPrice = 0;

            report.items.forEach(item => {
                const row = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = item.item ? item.item.item_name : '-';
                row.appendChild(tdName);

                const tdType = document.createElement('td');
                tdType.textContent = item.item ? item.item.type : '-';
                row.appendChild(tdType);

                const tdQty = document.createElement('td');
                tdQty.textContent = item.quantity.toString();
                row.appendChild(tdQty);

                const tdPrice = document.createElement('td');
                tdPrice.textContent = formatCurrency(item.price_snapshot);
                row.appendChild(tdPrice);

                const subtotal = item.quantity * item.price_snapshot;
                totalPrice += subtotal;

                const tdSubtotal = document.createElement('td');
                tdSubtotal.textContent = formatCurrency(subtotal);
                row.appendChild(tdSubtotal);

                tbodyItems.appendChild(row);
            });

            // Total row
            const totalRow = document.createElement('tr');
            totalRow.className = 'table-dark';
            const tdTotalLabel = document.createElement('td');
            tdTotalLabel.setAttribute('colspan', '4');
            tdTotalLabel.className = 'fw-bold text-end';
            tdTotalLabel.textContent = 'TOTAL';
            totalRow.appendChild(tdTotalLabel);
            const tdTotal = document.createElement('td');
            tdTotal.className = 'fw-bold';
            tdTotal.textContent = formatCurrency(totalPrice);
            totalRow.appendChild(tdTotal);
            tbodyItems.appendChild(totalRow);

            table.appendChild(tbodyItems);
            itemsDiv.appendChild(table);
            body.appendChild(itemsDiv);
        }

        // Footer actions
        const footer = document.getElementById('report-detail-footer');
        clearElement(footer);

        const btnClose = document.createElement('button');
        btnClose.type = 'button';
        btnClose.className = 'btn btn-secondary';
        btnClose.textContent = 'Tutup';
        btnClose.setAttribute('data-bs-dismiss', 'modal');
        footer.appendChild(btnClose);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('report-detail-modal'));
        modal.show();
    } catch (err) {
        showAlert('Gagal memuat detail laporan: ' + err.message, 'danger');
    }
}

// ==================== CREATE REPORT (F-01) ====================

function initCreateReportForm() {
    const container = document.getElementById('items-container');
    const btnAdd = document.getElementById('btn-add-item');
    const form = document.getElementById('form-create-report');

    // Add first item row
    addItemRow();

    btnAdd.addEventListener('click', () => addItemRow());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReport();
    });
}

function addItemRow() {
    const container = document.getElementById('items-container');
    const row = document.createElement('div');
    row.className = 'item-row';

    // Item select
    const select = document.createElement('select');
    select.className = 'form-select';
    select.required = true;

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '-- Pilih Item --';
    select.appendChild(defaultOpt);

    masterItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.item_name + ' (' + item.type + ') - ' + formatCurrency(item.price);
        option.setAttribute('data-price', item.price);
        select.appendChild(option);
    });

    select.addEventListener('change', updateTotalEstimate);

    // Quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'form-control';
    qtyInput.placeholder = 'Qty';
    qtyInput.min = '1';
    qtyInput.value = '1';
    qtyInput.required = true;
    qtyInput.style.maxWidth = '100px';
    qtyInput.addEventListener('change', updateTotalEstimate);
    qtyInput.addEventListener('input', updateTotalEstimate);

    // Remove button
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.className = 'btn btn-danger btn-sm btn-remove';
    btnRemove.textContent = 'X';
    btnRemove.addEventListener('click', () => {
        row.remove();
        updateTotalEstimate();
    });

    row.appendChild(select);
    row.appendChild(qtyInput);
    row.appendChild(btnRemove);
    container.appendChild(row);
}

function updateTotalEstimate() {
    const rows = document.querySelectorAll('.item-row');
    let total = 0;

    rows.forEach(row => {
        const select = row.querySelector('select');
        const qtyInput = row.querySelector('input[type="number"]');

        if (select.value && qtyInput.value) {
            const selectedOption = select.options[select.selectedIndex];
            const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            const qty = parseInt(qtyInput.value) || 0;
            total += price * qty;
        }
    });

    document.getElementById('total-estimate').textContent = formatCurrency(total);
}

async function submitReport() {
    const vehicleId = document.getElementById('vehicle-select').value;
    const odometer = document.getElementById('odometer-input').value;
    const complaint = document.getElementById('complaint-input').value;
    const photoInput = document.getElementById('initial-photo-input');

    if (!vehicleId || !odometer || !complaint) {
        showAlert('Semua field wajib harus diisi', 'warning');
        return;
    }

    // Collect items
    const items = [];
    const rows = document.querySelectorAll('.item-row');
    for (const row of rows) {
        const select = row.querySelector('select');
        const qtyInput = row.querySelector('input[type="number"]');

        if (!select.value) {
            showAlert('Pilih item untuk semua baris', 'warning');
            return;
        }

        items.push({
            item_id: parseInt(select.value),
            quantity: parseInt(qtyInput.value) || 1
        });
    }

    if (items.length === 0) {
        showAlert('Minimal satu item harus ditambahkan', 'warning');
        return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append('vehicle_id', vehicleId);
    formData.append('odometer', odometer);
    formData.append('complaint', complaint);
    formData.append('items', JSON.stringify(items));

    if (photoInput.files.length > 0) {
        formData.append('initial_photo', photoInput.files[0]);
    }

    try {
        await API.createReport(formData);
        showAlert('Laporan berhasil dibuat!', 'success');
        document.getElementById('form-create-report').reset();
        // Reset items
        const container = document.getElementById('items-container');
        clearElement(container);
        addItemRow();
        updateTotalEstimate();
        // Reload reports
        await loadReports();
        // Switch to reports tab
        document.querySelector('[data-tab="reports"]').click();
    } catch (err) {
        showAlert('Gagal membuat laporan: ' + err.message, 'danger');
    }
}

// ==================== APPROVE REPORT (F-02) ====================

async function approveReport(reportId) {
    if (!confirm('Apakah Anda yakin ingin menyetujui laporan ini?')) return;

    try {
        await API.approveReport(reportId);
        showAlert('Laporan berhasil disetujui!', 'success');
        await loadReports();
    } catch (err) {
        showAlert('Gagal menyetujui laporan: ' + err.message, 'danger');
    }
}

// ==================== COMPLETE REPORT (F-03) ====================

function showCompleteModal(reportId) {
    const body = document.getElementById('report-detail-body');
    clearElement(body);

    const title = document.querySelector('#report-detail-modal .modal-title');
    title.textContent = 'Selesaikan Laporan #' + reportId;

    const formDiv = document.createElement('div');

    const label = document.createElement('label');
    label.className = 'form-label fw-bold';
    label.textContent = 'Upload Foto Bukti Pengerjaan *';
    formDiv.appendChild(label);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'form-control';
    fileInput.accept = 'image/*';
    fileInput.id = 'proof-photo-input';
    fileInput.required = true;
    formDiv.appendChild(fileInput);

    body.appendChild(formDiv);

    // Footer
    const footer = document.getElementById('report-detail-footer');
    clearElement(footer);

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'btn btn-secondary';
    btnCancel.textContent = 'Batal';
    btnCancel.setAttribute('data-bs-dismiss', 'modal');
    footer.appendChild(btnCancel);

    const btnSubmit = document.createElement('button');
    btnSubmit.type = 'button';
    btnSubmit.className = 'btn btn-success';
    btnSubmit.textContent = 'Selesaikan';
    btnSubmit.addEventListener('click', () => completeReport(reportId));
    footer.appendChild(btnSubmit);

    const modal = new bootstrap.Modal(document.getElementById('report-detail-modal'));
    modal.show();
}

async function completeReport(reportId) {
    const fileInput = document.getElementById('proof-photo-input');
    if (!fileInput || fileInput.files.length === 0) {
        showAlert('Foto bukti pengerjaan wajib diupload', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('proof_photo', fileInput.files[0]);

    try {
        await API.completeReport(reportId, formData);
        showAlert('Laporan berhasil diselesaikan!', 'success');

        // Close modal
        const modalEl = document.getElementById('report-detail-modal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await loadReports();
    } catch (err) {
        showAlert('Gagal menyelesaikan laporan: ' + err.message, 'danger');
    }
}

// ==================== FILTER & SEARCH ====================

let filtersInitialized = false;

function initFilters() {
    if (filtersInitialized) return;
    filtersInitialized = true;

    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterVehicle = document.getElementById('filter-vehicle');

    searchInput.addEventListener('input', () => {
        renderReportsTable();
    });
    filterStatus.addEventListener('change', () => {
        renderReportsTable();
    });
    filterVehicle.addEventListener('change', () => {
        renderReportsTable();
    });
}

function populateFilterVehicle() {
    const select = document.getElementById('filter-vehicle');
    // Keep first option, remove rest
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = v.license_plate + ' - ' + v.model;
        select.appendChild(option);
    });
}

function getFilteredReports() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const statusFilter = document.getElementById('filter-status').value;
    const vehicleFilter = document.getElementById('filter-vehicle').value;

    return reports.filter(report => {
        // Status filter
        if (statusFilter && report.status !== statusFilter) return false;

        // Vehicle filter
        if (vehicleFilter && String(report.vehicle_id) !== vehicleFilter) return false;

        // Search filter
        if (searchTerm) {
            const saName = report.creator ? report.creator.username.toLowerCase() : '';
            const plate = report.vehicle ? report.vehicle.license_plate.toLowerCase() : '';
            const model = report.vehicle ? report.vehicle.model.toLowerCase() : '';
            const complaint = report.complaint.toLowerCase();

            if (!saName.includes(searchTerm) &&
                !plate.includes(searchTerm) &&
                !model.includes(searchTerm) &&
                !complaint.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });
}

// ==================== EXPORT CSV (B-01) ====================

function initExportCSV() {
    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
}

function exportToCSV() {
    const filteredReports = getFilteredReports();

    if (filteredReports.length === 0) {
        showAlert('Tidak ada data untuk di-export', 'warning');
        return;
    }

    // CSV Header
    const headers = ['No', 'Nama SA', 'Nomor Polisi', 'Kendaraan', 'Keluhan', 'Status', 'Tanggal'];
    const rows = [headers.join(',')];

    // CSV Data
    filteredReports.forEach((report, index) => {
        const row = [
            index + 1,
            escapeCSV(report.creator ? report.creator.username : '-'),
            escapeCSV(report.vehicle ? report.vehicle.license_plate : '-'),
            escapeCSV(report.vehicle ? report.vehicle.model : '-'),
            escapeCSV(report.complaint),
            escapeCSV(report.status),
            escapeCSV(formatDate(report.created_at))
        ];
        rows.push(row.join(','));
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'laporan_pemeliharaan_' + formatDateFile(new Date()) + '.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('File CSV berhasil di-download!', 'success');
}

function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// ==================== UTILITY FUNCTIONS ====================

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function appendInfoRow(parent, label, value) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = label + ': ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(value));
    parent.appendChild(p);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateFile(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
}

function formatCurrency(amount) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function showAlert(message, type) {
    // Remove existing alerts
    const existing = document.querySelectorAll('.alert-floating');
    existing.forEach(el => el.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-' + type + ' alert-dismissible fade show alert-floating';
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';

    alertDiv.textContent = message;

    const btnClose = document.createElement('button');
    btnClose.type = 'button';
    btnClose.className = 'btn-close';
    btnClose.setAttribute('data-bs-dismiss', 'alert');
    alertDiv.appendChild(btnClose);

    document.body.appendChild(alertDiv);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 4000);
}
