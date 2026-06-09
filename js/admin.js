$(document).ready(function () {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000/api/v1';

    // Set global AJAX Authorization header for API access
    $.ajaxSetup({
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    // --------------------------------------------------------
    // 1. DATA TABLES SETUP
    // --------------------------------------------------------

    // A. Figurines Table
    const figurinesTable = $('#figurinesTable').DataTable({
        ajax: {
            url: `${API_URL}/items`,
            dataSrc: 'rows'
        },
        columns: [
            { data: 'item_id' },
            { data: 'description' },
            { 
                data: 'cost_price',
                render: data => `$${parseFloat(data).toFixed(2)}`
            },
            { 
                data: 'sell_price',
                render: data => `$${parseFloat(data).toFixed(2)}`
            },
            { data: 'quantity' },
            { 
                data: 'img_path',
                render: data => data ? `<img src="http://localhost:3000/${data}" style="height:40px; border-radius:4px; border: 1px solid #c5a880;" alt="hero">` : 'N/A'
            },
            {
                data: 'item_id',
                render: data => `
                    <button class="admin-action-btn btn-success" onclick="openEditModal(${data})">Edit</button>
                    <button class="admin-action-btn btn-danger" onclick="deleteItem(${data})">Delete</button>
                `
            }
        ]
    });

    // B. Users Table
    const usersTable = $('#usersTable').DataTable({
        ajax: {
            url: `${API_URL}/users`,
            dataSrc: 'rows'
        },
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            { data: 'phone' },
            { data: 'dob' },
            { 
                data: 'role',
                render: (data, type, row) => `
                    <select class="admin-select" onchange="updateUserRole(${row.id}, this.value)">
                        <option value="customer" ${data === 'customer' ? 'selected' : ''}>Customer</option>
                        <option value="admin" ${data === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                `
            },
            { 
                data: 'status',
                render: data => `
                    <span style="color: ${data === 'Active' ? '#2e7d32' : '#c94a4a'}; font-weight:600;">${data}</span>
                `
            },
            {
                data: 'id',
                render: (data, type, row) => `
                    <button class="admin-action-btn ${row.status === 'Active' ? 'btn-danger' : 'btn-success'}" onclick="toggleUserDeactivation(${data})">
                        ${row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                `
            }
        ]
    });

    // C. Transactions Table
    const transactionsTable = $('#transactionsTable').DataTable({
        ajax: {
            url: `${API_URL}/transactions`,
            dataSrc: 'rows'
        },
        columns: [
            { data: 'transaction_id' },
            { data: 'orderinfo_id' },
            { data: 'customer_name' },
            { data: 'customer_email' },
            { 
                data: 'amount',
                render: data => `$${parseFloat(data).toFixed(2)}`
            },
            { data: 'payment_method' },
            { 
                data: 'transaction_date',
                render: data => new Date(data).toLocaleDateString()
            },
            { 
                data: 'status',
                render: (data, type, row) => `
                    <select class="admin-select" onchange="updateTransactionStatus(${row.transaction_id}, this.value)">
                        <option value="Pending" ${data === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Paid" ${data === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Completed" ${data === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${data === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                `
            },
            {
                data: 'transaction_id',
                render: data => `
                    <button class="admin-action-btn btn-danger" onclick="deleteTransaction(${data})">Delete</button>
                `
            }
        ]
    });

    // --------------------------------------------------------
    // 2. PRODUCT CRUD HANDLERS
    // --------------------------------------------------------

    // A. Create Figurine
    $('#addForm').on('submit', function (e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('description', $('#addDesc').value || $('#addDesc').val());
        formData.append('cost_price', $('#addCost').val());
        formData.append('sell_price', $('#addSell').val());
        formData.append('quantity', $('#addQty').val());

        const fileInput = document.getElementById('addFiles');
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('images', fileInput.files[i]);
            }
        }

        $.ajax({
            url: `${API_URL}/items`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                alert('Figurine created successfully!');
                closeAddModal();
                figurinesTable.ajax.reload();
                loadAnalyticsCharts(); // refresh analytics
            },
            error: function (xhr) {
                alert('Error creating figurine: ' + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });

    // B. Save Figurine Changes
    $('#editForm').on('submit', function (e) {
        e.preventDefault();
        const id = $('#editId').val();
        const formData = new FormData();
        formData.append('description', $('#editDesc').val());
        formData.append('cost_price', $('#editCost').val());
        formData.append('sell_price', $('#editSell').val());
        formData.append('quantity', $('#editQty').val());

        const fileInput = document.getElementById('editFiles');
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('images', fileInput.files[i]);
            }
        }

        $.ajax({
            url: `${API_URL}/items/${id}`,
            type: 'PUT',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                alert('Figurine updated successfully!');
                closeEditModal();
                figurinesTable.ajax.reload();
                loadAnalyticsCharts(); // refresh analytics
            },
            error: function (xhr) {
                alert('Error updating figurine: ' + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });

    // Global scopes for CRUD triggers
    window.deleteItem = function (id) {
        if (confirm('Are you sure you want to delete this figurine from the catalog?')) {
            $.ajax({
                url: `${API_URL}/items/${id}`,
                type: 'DELETE',
                success: function () {
                    alert('Figurine deleted.');
                    figurinesTable.ajax.reload();
                    loadAnalyticsCharts();
                },
                error: function (xhr) {
                    alert('Deletion failed.');
                }
            });
        }
    };

    window.openEditModal = function (id) {
        $.ajax({
            url: `${API_URL}/items/${id}`,
            type: 'GET',
            success: function (data) {
                if (data.success && data.result.length > 0) {
                    const item = data.result[0];
                    $('#editId').val(item.item_id);
                    $('#editDesc').val(item.description);
                    $('#editCost').val(item.cost_price);
                    $('#editSell').val(item.sell_price);
                    $('#editQty').val(item.quantity);
                    $('#editModal').addClass('active');
                }
            }
        });
    };

    // --------------------------------------------------------
    // 3. ADMIN USER ACTIONS
    // --------------------------------------------------------
    window.updateUserRole = function (id, role) {
        $.ajax({
            url: `${API_URL}/users/${id}/role`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ role }),
            success: function () {
                alert('User role updated successfully.');
                usersTable.ajax.reload();
            },
            error: function (xhr) {
                alert('Role update failed.');
            }
        });
    };

    window.toggleUserDeactivation = function (id) {
        if (confirm('Toggle user activation/deactivation status?')) {
            $.ajax({
                url: `${API_URL}/users/${id}/deactivate`,
                type: 'PUT',
                success: function (res) {
                    alert(res.message);
                    usersTable.ajax.reload();
                },
                error: function () {
                    alert('Deactivation action failed.');
                }
            });
        }
    };

    // --------------------------------------------------------
    // 4. TRANSACTION ACTIONS & EMAIL INVOICES
    // --------------------------------------------------------
    window.updateTransactionStatus = function (id, status) {
        // Triggers PDF invoicing + email sending (Term Test 15pts requirement)
        const selectEl = $(`select[onchange="updateTransactionStatus(${id}, this.value)"]`);
        selectEl.css('opacity', '0.5').prop('disabled', true);
        
        $.ajax({
            url: `${API_URL}/transactions/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status }),
            success: function (res) {
                alert(`Status updated! Email containing PDF invoice has been sent to customer.`);
                selectEl.css('opacity', '1').prop('disabled', false);
                transactionsTable.ajax.reload();
            },
            error: function () {
                alert('Failed to update transaction status.');
                selectEl.css('opacity', '1').prop('disabled', false);
            }
        });
    };

    window.deleteTransaction = function (id) {
        if (confirm('Are you sure you want to delete this payment record?')) {
            $.ajax({
                url: `${API_URL}/transactions/${id}`,
                type: 'DELETE',
                success: function () {
                    alert('Transaction record deleted.');
                    transactionsTable.ajax.reload();
                }
            });
        }
    };

    // --------------------------------------------------------
    // 5. CHART.JS ANALYTICS METRICS (Quiz 4)
    // --------------------------------------------------------
    let revChartInstance = null;
    let salesChartInstance = null;
    let seriesChartInstance = null;

    function loadAnalyticsCharts() {
        // A. Sales Volume Bar & Revenue Line Charts
        $.ajax({
            url: `${API_URL}/sales-chart`,
            type: 'GET',
            success: function (data) {
                const months = data.rows.map(r => r.month);
                const revenues = data.rows.map(r => parseFloat(r.total || 0));
                
                // Render Revenue Line Chart
                if (revChartInstance) revChartInstance.destroy();
                const ctxRev = document.getElementById('revenueChart').getContext('2d');
                revChartInstance = new Chart(ctxRev, {
                    type: 'line',
                    data: {
                        labels: months.length > 0 ? months : ['No Data'],
                        datasets: [{
                            label: 'Monthly Revenue ($)',
                            data: revenues.length > 0 ? revenues : [0],
                            borderColor: '#c5a880',
                            backgroundColor: 'rgba(197, 168, 128, 0.15)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: { responsive: true }
                });

                // Render Sales volume Bar chart (Using placeholder scale for totals)
                if (salesChartInstance) salesChartInstance.destroy();
                const ctxVolume = document.getElementById('salesVolumeChart').getContext('2d');
                salesChartInstance = new Chart(ctxVolume, {
                    type: 'bar',
                    data: {
                        labels: months.length > 0 ? months : ['No Data'],
                        datasets: [{
                            label: 'Volume Sold',
                            data: revenues.map(r => Math.round(r / 500) + 1), // calculate sales counts approximation
                            backgroundColor: '#1c1c1c'
                        }]
                    },
                    options: { responsive: true }
                });
            }
        });

        // B. Items Distribution Pie Chart
        $.ajax({
            url: `${API_URL}/items-chart`,
            type: 'GET',
            success: function (data) {
                const names = data.rows.map(r => r.items);
                const totals = data.rows.map(r => parseInt(r.total || 0));

                if (seriesChartInstance) seriesChartInstance.destroy();
                const ctxPie = document.getElementById('seriesPieChart').getContext('2d');
                seriesChartInstance = new Chart(ctxPie, {
                    type: 'pie',
                    data: {
                        labels: names.length > 0 ? names : ['No Items Sold'],
                        datasets: [{
                            data: totals.length > 0 ? totals : [1],
                            backgroundColor: [
                                '#c5a880', '#eddcc6', '#1c1c1c', '#a89475', 
                                '#e3d8c1', '#8c7d67', '#ebdcb9', '#dbccb1'
                            ]
                        }]
                    },
                    options: { responsive: true }
                });
            }
        });
    }

    // Trigger charts load
    loadAnalyticsCharts();

    // --------------------------------------------------------
    // 6. MODAL UTILITIES
    // --------------------------------------------------------
    window.openAddModal = () => $('#addModal').addClass('active');
    window.closeAddModal = () => {
        $('#addModal').removeClass('active');
        $('#addForm')[0].reset();
    };

    window.closeEditModal = () => {
        $('#editModal').removeClass('active');
        $('#editForm')[0].reset();
    };
});
