$(document).ready(function () {
    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:3000/api/v1';

    let editKeptImages = [];

    // Helper to resolve image paths (local assets vs backend uploads)
    function resolveImagePath(path) {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        let cleanPath = path.startsWith('/') ? path.substring(1) : path;
        if (cleanPath.startsWith('assets/')) return '../' + cleanPath;
        return `http://localhost:3000/${cleanPath}`;
    }

    function renderEditThumbnails() {
        const container = $('#editCurrentImages');
        container.empty();
        if (editKeptImages.length > 0) {
            $('#editCurrentImagesGroup').show();
            editKeptImages.forEach((img, idx) => {
                const fullUrl = resolveImagePath(img);
                container.append(`
                    <div class="admin-img-thumb" data-path="${img}">
                        <img src="${fullUrl}" alt="thumbnail">
                        <button type="button" class="remove-thumb-btn" onclick="removeEditImage(${idx})">&times;</button>
                    </div>
                `);
            });
        } else {
            $('#editCurrentImagesGroup').hide();
        }
    }

    window.removeEditImage = function (idx) {
        editKeptImages.splice(idx, 1);
        renderEditThumbnails();
    };

    // --- Dynamic Tag & Category Editor System ---
    let addModalTags = [];
    let editModalTags = [];

    function renderAddCustomTags() {
        const wrapper = $('#addTagBadges');
        wrapper.empty();
        addModalTags.forEach((tag, idx) => {
            wrapper.append(`
                <span class="tag-badge">
                    <span class="tag-hash">#</span>
                    <span class="tag-text">${tag}</span>
                    <span class="remove-tag" onclick="removeAddCustomTag(${idx})">&times;</span>
                </span>
            `);
        });
    }

    window.removeAddCustomTag = function(idx) {
        addModalTags.splice(idx, 1);
        renderAddCustomTags();
    };

    function renderEditCustomTags() {
        const wrapper = $('#editTagBadges');
        wrapper.empty();
        editModalTags.forEach((tag, idx) => {
            wrapper.append(`
                <span class="tag-badge">
                    <span class="tag-hash">#</span>
                    <span class="tag-text">${tag}</span>
                    <span class="remove-tag" onclick="removeEditCustomTag(${idx})">&times;</span>
                </span>
            `);
        });
    }

    window.removeEditCustomTag = function(idx) {
        editModalTags.splice(idx, 1);
        renderEditCustomTags();
    };

    function getAddModalTags() {
        return addModalTags;
    }

    function getEditModalTags() {
        return editModalTags;
    }

    function getAddModalCategories() {
        const categories = [];
        $('input[name="addCategories"]:checked').each(function() {
            categories.push($(this).val());
        });
        return categories;
    }

    function getEditModalCategories() {
        const categories = [];
        $('input[name="editCategories"]:checked').each(function() {
            categories.push($(this).val());
        });
        return categories;
    }

    // Space / Enter delimiter listening
    $('#addTagInputField').on('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Enter' || e.keyCode === 32 || e.which === 32 || e.keyCode === 13 || e.which === 13) {
            e.preventDefault();
            const val = $(this).val().trim().toLowerCase();
            if (val && !addModalTags.includes(val)) {
                addModalTags.push(val);
                renderAddCustomTags();
            }
            $(this).val('');
        }
    });

    $('#editTagInputField').on('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Enter' || e.keyCode === 32 || e.which === 32 || e.keyCode === 13 || e.which === 13) {
            e.preventDefault();
            const val = $(this).val().trim().toLowerCase();
            if (val && !editModalTags.includes(val)) {
                editModalTags.push(val);
                renderEditCustomTags();
            }
            $(this).val('');
        }
    });
    // --- End Dynamic Tag & Category Editor System ---

    // Global AJAX setup for automatic auth headers and session expiration handling
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            const currentToken = localStorage.getItem('token');
            if (settings.url && settings.url.includes('/api/v1/') && currentToken) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + currentToken);
            }
        }
    });

    $(document).ajaxError(function(event, xhr, settings) {
        if (xhr.status === 401) {
            let message = 'Session expired. Please log in again.';
            try {
                const data = JSON.parse(xhr.responseText);
                message = data.message || data.error || message;
            } catch(e) {}
            alert(message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
        }
    });

    // --------------------------------------------------------
    // 1. DATA TABLES SETUP
    // --------------------------------------------------------

    // A. Figurines Table
    const figurinesTable = $('#figurinesTable').DataTable({
        columns: [
            { data: 'item_id' },
            { 
                data: 'description',
                render: (data, type, row) => {
                    const supplierLabel = row.supplier ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Supplier: <strong>${row.supplier.name}</strong></div>` : `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Supplier: None</div>`;
                    return `<div>
                        <span style="font-weight:500;">${data}</span>
                        ${supplierLabel}
                    </div>`;
                }
            },
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
                render: data => data ? `<img src="${resolveImagePath(data)}" style="height:40px; border-radius:4px; border: 1px solid #c5a880;" alt="hero">` : 'N/A'
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
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            { data: 'phone' },
            { data: 'dob' },
            { 
                data: 'role',
                render: (data, type, row) => `
                    <select class="admin-select" id="role-select-${row.id}">
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
                    <button class="admin-action-btn btn-primary" onclick="commitUserRole(${data})">Update Role</button>
                    <button class="admin-action-btn ${row.status === 'Active' ? 'btn-danger' : 'btn-success'}" onclick="toggleUserDeactivation(${data})">
                        ${row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                `
            }
        ]
    });

    // C. Transactions Table
    const transactionsTable = $('#transactionsTable').DataTable({
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
                    <select class="admin-select" id="status-select-${row.transaction_id}">
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
                    <button class="admin-action-btn btn-primary" onclick="commitTransactionStatus(${data})">Update Status</button>
                    <button class="admin-action-btn btn-danger" onclick="deleteTransaction(${data})">Delete</button>
                `
            }
        ]
    });

    // D. Soft-deleted Figurines Table
    const deletedFigurinesTable = $('#deletedFigurinesTable').DataTable({
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
                data: 'item_id',
                render: data => `
                    <button class="admin-action-btn btn-success" onclick="commitRestoreFigurine(${data})">Restore</button>
                `
            }
        ]
    });

    // E. Deleted/Deactivated Users Table
    const deletedUsersTable = $('#deletedUsersTable').DataTable({
        columns: [
            { data: 'id' },
            { data: 'name' },
            { data: 'email' },
            { data: 'phone' },
            { data: 'dob' },
            {
                data: 'id',
                render: data => `
                    <button class="admin-action-btn btn-success" onclick="commitRestoreUser(${data})">Activate</button>
                `
            }
        ]
    });

    // --------------------------------------------------------
    // 1.1 DATA FETCHERS USING FETCH
    // --------------------------------------------------------
    function fetchFigurines() {
        $.ajax({
            url: `${API_URL}/items`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                figurinesTable.clear().rows.add(data.rows || []).draw();
            },
            error: function(xhr) {
                console.error('Failed to load figurines.');
            }
        });
    }

    function fetchUsers() {
        $.ajax({
            url: `${API_URL}/users`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                usersTable.clear().rows.add(data.rows || []).draw();
            },
            error: function(xhr) {
                console.error('Failed to load users.');
            }
        });
    }

    // Expose fetch functions to global scope if needed for reload signals
    window.fetchUsers = fetchUsers;
    window.fetchFigurines = fetchFigurines;

    function fetchTransactions() {
        $.ajax({
            url: `${API_URL}/transactions`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                transactionsTable.clear().rows.add(data.rows || []).draw();
            },
            error: function(xhr) {
                console.error('Failed to load transactions.');
            }
        });
    }

    function fetchDeletedFigurines() {
        $.ajax({
            url: `${API_URL}/items/deleted`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                deletedFigurinesTable.clear().rows.add(data.rows || []).draw();
            },
            error: function(xhr) {
                console.error('Failed to load deleted figurines.');
            }
        });
    }

    function fetchDeletedUsers() {
        $.ajax({
            url: `${API_URL}/users/deleted`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                deletedUsersTable.clear().rows.add(data.rows || []).draw();
            },
            error: function(xhr) {
                console.error('Failed to load deactivated users.');
            }
        });
    }

    function loadAdminDashboard() {
        $.ajax({
            url: `${API_URL}/dashboard/summary`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.summary) {
                    const s = data.summary;
                    
                    // Update widgets
                    $('#dashTotalSales').text(`$${parseFloat(s.totalRevenue).toFixed(2)}`);
                    $('#dashTotalUsers').text(s.totalUsers);
                    $('#dashTotalFigurines').text(s.totalFigurines);
                    $('#dashLowStockCount').text(s.lowStockCount);

                    // Style low stock card based on count
                    if (s.lowStockCount > 0) {
                        $('#dashLowStockCard').css('border-color', 'rgba(201, 74, 74, 0.4)');
                        $('#dashLowStockIcon').addClass('danger');
                    } else {
                        $('#dashLowStockCard').css('border-color', 'rgba(197, 168, 128, 0.18)');
                        $('#dashLowStockIcon').removeClass('danger');
                    }

                    // Render Recent Order Payments Table
                    const activityBody = $('#dashActivityTable tbody');
                    activityBody.empty();
                    if (s.recentActivities && s.recentActivities.length > 0) {
                        s.recentActivities.forEach(act => {
                            const statusClass = act.status ? act.status.toLowerCase() : 'pending';
                            const amountFormatted = `$${parseFloat(act.amount).toFixed(2)}`;
                            const dateFormatted = new Date(act.transaction_date).toLocaleDateString();
                            activityBody.append(`
                                <tr>
                                    <td><strong>#TX-${act.transaction_id}</strong></td>
                                    <td>${act.customer_name}</td>
                                    <td>${amountFormatted}</td>
                                    <td><span class="status-pill ${statusClass}">${act.status}</span></td>
                                    <td>${dateFormatted}</td>
                                </tr>
                            `);
                        });
                    } else {
                        activityBody.append(`
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No order payments recorded.</td>
                            </tr>
                        `);
                    }

                    // Render Low Stock Table
                    const lowStockBody = $('#dashLowStockTable tbody');
                    lowStockBody.empty();
                    if (s.lowStockItems && s.lowStockItems.length > 0) {
                        s.lowStockItems.forEach(item => {
                            const imgUrl = resolveImagePath(item.img_path);
                            const imgTag = item.img_path ? 
                                `<img src="${imgUrl}" style="height:35px; border-radius:4px; border:1px solid #c5a880; vertical-align:middle; margin-right:8px;" alt="toy">` : 
                                `<span style="display:inline-block; width:35px; height:35px; background:#eef0f3; border-radius:4px; vertical-align:middle; margin-right:8px;"></span>`;
                            
                            const supplierHtml = item.supplier_name ? 
                                `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Supplier: <strong>${item.supplier_name}</strong></div>` : 
                                `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">Supplier: None</div>`;
                                
                            const reorderLink = item.supplier_email ? 
                                `<a class="quick-action-link" href="mailto:${item.supplier_email}?subject=Restock Request: ${encodeURIComponent(item.description)}&body=Hi ${encodeURIComponent(item.supplier_name || 'Supplier')},%0D%0A%0D%0AWe would like to request a restock of our figurine item: ${encodeURIComponent(item.description)}.%0D%0A%0D%0ACurrently we only have ${item.quantity} units left in stock.%0D%0A%0D%0AThank you!%0D%0AAdmin">Order Stock</a>` : 
                                `<a class="quick-action-link" onclick="openEditModal(${item.item_id})">Restock</a>`;

                            lowStockBody.append(`
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center;">
                                            ${imgTag}
                                            <div style="display:flex; flex-direction:column;">
                                                <span style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${item.description}</span>
                                                ${supplierHtml}
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="restock-badge">${item.quantity} left</span></td>
                                    <td>$${parseFloat(item.sell_price).toFixed(2)}</td>
                                    <td>${reorderLink}</td>
                                </tr>
                            `);
                        });
                    } else {
                        lowStockBody.append(`
                            <tr>
                                <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">All items fully stocked!</td>
                            </tr>
                        `);
                    }

                    // Update last updated timestamp
                    $('#dashLastUpdated').text(`Last updated: ${new Date().toLocaleTimeString()}`);
                }
            },
            error: function(xhr) {
                console.error('Failed to load dashboard metrics.');
            }
        });
    }

    // Expose to window scope so switchTab can call it
    window.loadAdminDashboard = loadAdminDashboard;

    // Trigger initial data loads
    fetchFigurines();
    fetchUsers();
    fetchTransactions();
    fetchDeletedFigurines();
    fetchDeletedUsers();
    loadAdminDashboard();

    // --------------------------------------------------------
    // 2. PRODUCT CRUD HANDLERS
    // --------------------------------------------------------

    // A. Create Figurine
    $('#addForm').on('submit', function (e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('description', $('#addDesc').val());
        formData.append('cost_price', $('#addCost').val());
        formData.append('sell_price', $('#addSell').val());
        formData.append('quantity', $('#addQty').val());
        formData.append('tags', JSON.stringify(getAddModalTags()));
        formData.append('category', JSON.stringify(getAddModalCategories()));
        formData.append('supplier_id', $('#addSupplier').val());

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
            dataType: 'json',
            success: function(data) {
                alert('Figurine created successfully!');
                closeAddModal();
                fetchFigurines();
                loadAnalyticsCharts(); // refresh analytics
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error creating figurine: ' + (errData.error || 'Failed to create figurine'));
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
        formData.append('tags', JSON.stringify(getEditModalTags()));
        formData.append('category', JSON.stringify(getEditModalCategories()));
        formData.append('supplier_id', $('#editSupplier').val());
        formData.append('keep_images', JSON.stringify(editKeptImages));

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
            dataType: 'json',
            success: function(data) {
                alert('Figurine updated successfully!');
                closeEditModal();
                fetchFigurines();
                loadAnalyticsCharts(); // refresh analytics
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error updating figurine: ' + (errData.error || 'Failed to update figurine'));
            }
        });
    });

    // Global scopes for CRUD triggers
    window.deleteItem = function (id) {
        if (confirm('Are you sure you want to delete this figurine from the catalog?')) {
            $.ajax({
                url: `${API_URL}/items/${id}`,
                type: 'DELETE',
                dataType: 'json',
                success: function(data) {
                    alert('Figurine deleted.');
                    fetchFigurines();
                    fetchDeletedFigurines();
                    loadAnalyticsCharts();
                    loadAdminDashboard();
                },
                error: function(xhr) {
                    const errData = xhr.responseJSON || {};
                    alert('Deletion failed: ' + (errData.error || 'Failed to delete figurine'));
                }
            });
        }
    };

    window.commitRestoreFigurine = function (id) {
        $.ajax({
            url: `${API_URL}/items/${id}/restore`,
            type: 'PUT',
            dataType: 'json',
            success: function(data) {
                alert('Figurine restored successfully.');
                fetchFigurines();
                fetchDeletedFigurines();
                loadAnalyticsCharts();
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Failed to restore figurine: ' + (errData.error || 'Failed to restore figurine'));
            }
        });
    };

    window.openEditModal = function (id) {
        $.ajax({
            url: `${API_URL}/items/${id}`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.result.length > 0) {
                    const item = data.result[0];
                    $('#editId').val(item.item_id);
                    $('#editDesc').val(item.description);
                    $('#editCost').val(item.cost_price);
                    $('#editSell').val(item.sell_price);
                    $('#editQty').val(item.quantity);
                    $('#editSupplier').val(item.supplier ? item.supplier.id : '');

                    // Populate kept images list
                    editKeptImages = [];
                    if (item.img_path) editKeptImages.push(item.img_path);
                    if (item.images && Array.isArray(item.images)) {
                        item.images.forEach(img => {
                            if (img && !editKeptImages.includes(img)) {
                                editKeptImages.push(img);
                            }
                        });
                    }
                    renderEditThumbnails();

                    // Prepopulate categories checkboxes
                    $('input[name="editCategories"]').prop('checked', false);
                    if (item.category && Array.isArray(item.category)) {
                        item.category.forEach(c => {
                            const catClean = c.trim().toLowerCase();
                            $(`input[name="editCategories"][value="${catClean}"]`).prop('checked', true);
                        });
                    }

                    // Prepopulate custom tags
                    editModalTags = [];
                    if (item.tags && Array.isArray(item.tags)) {
                        item.tags.forEach(t => {
                            const tagClean = t.trim().toLowerCase();
                            if (tagClean && !editModalTags.includes(tagClean)) {
                                editModalTags.push(tagClean);
                            }
                        });
                    }
                    renderEditCustomTags();

                    $('#editModal').addClass('active');
                }
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error loading figurine data: ' + (errData.error || 'Failed to load item'));
            }
        });
    };

    // --------------------------------------------------------
    // 3. ADMIN USER ACTIONS
    // --------------------------------------------------------
    window.commitUserRole = function (id) {
        const role = $(`#role-select-${id}`).val();
        $.ajax({
            url: `${API_URL}/users/${id}/role`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ role }),
            dataType: 'json',
            success: function(data) {
                alert('User role updated successfully.');
                fetchUsers();
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Role update failed: ' + (errData.error || 'Failed to update role'));
            }
        });
    };

    window.toggleUserDeactivation = function (id) {
        if (confirm('Toggle user activation/deactivation status?')) {
            $.ajax({
                url: `${API_URL}/users/${id}/deactivate`,
                type: 'PUT',
                dataType: 'json',
                success: function(data) {
                    alert(data.message);
                    fetchUsers();
                    fetchDeletedUsers();
                    loadAdminDashboard();
                },
                error: function(xhr) {
                    const errData = xhr.responseJSON || {};
                    alert('Deactivation action failed: ' + (errData.error || 'Failed to toggle user status'));
                }
            });
        }
    };

    window.commitRestoreUser = function (id) {
        $.ajax({
            url: `${API_URL}/users/${id}/deactivate`,
            type: 'PUT',
            dataType: 'json',
            success: function(data) {
                alert('Collector account activated successfully.');
                fetchUsers();
                fetchDeletedUsers();
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Failed to activate collector account: ' + (errData.error || 'Failed to activate account'));
            }
        });
    };

    // --------------------------------------------------------
    // 4. TRANSACTION ACTIONS & EMAIL INVOICES
    // --------------------------------------------------------
    window.commitTransactionStatus = function (id) {
        const status = $(`#status-select-${id}`).val();
        const selectEl = $(`#status-select-${id}`);
        selectEl.css('opacity', '0.5').prop('disabled', true);
        
        $.ajax({
            url: `${API_URL}/transactions/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status }),
            dataType: 'json',
            success: function(data) {
                alert(`Status updated! Email containing PDF invoice has been sent to customer.`);
                selectEl.css('opacity', '1').prop('disabled', false);
                fetchTransactions();
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Failed to update transaction status: ' + (errData.error || 'Failed to update transaction status'));
                selectEl.css('opacity', '1').prop('disabled', false);
            }
        });
    };

    window.deleteTransaction = function (id) {
        if (confirm('Are you sure you want to delete this payment record?')) {
            $.ajax({
                url: `${API_URL}/transactions/${id}`,
                type: 'DELETE',
                dataType: 'json',
                success: function(data) {
                    alert('Transaction record deleted.');
                    fetchTransactions();
                    loadAdminDashboard();
                },
                error: function(xhr) {
                    const errData = xhr.responseJSON || {};
                    alert('Failed to delete transaction: ' + (errData.error || 'Failed to delete transaction'));
                }
            });
        }
    };

    // --------------------------------------------------------
    // 5. CHART.JS ANALYTICS METRICS
    // --------------------------------------------------------
    let revChartInstance = null;
    let salesChartInstance = null;
    let seriesChartInstance = null;
    let addressChartInstance = null;

    function loadAnalyticsCharts() {
        // A. Sales Volume Bar & Revenue Line Charts
        $.ajax({
            url: `${API_URL}/sales-chart`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const months = (data.rows || []).map(r => r.month);
                const revenues = (data.rows || []).map(r => parseFloat(r.total || 0));
                const volumes = (data.rows || []).map(r => parseInt(r.volume || 0));
                
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

                // Render Sales volume Bar chart
                if (salesChartInstance) salesChartInstance.destroy();
                const ctxVolume = document.getElementById('salesVolumeChart').getContext('2d');
                salesChartInstance = new Chart(ctxVolume, {
                    type: 'bar',
                    data: {
                        labels: months.length > 0 ? months : ['No Data'],
                        datasets: [{
                            label: 'Volume Sold',
                            data: volumes.length > 0 ? volumes : [0],
                            backgroundColor: '#1c1c1c'
                        }]
                    },
                    options: { responsive: true }
                });
            },
            error: function(xhr) {
                console.error('Failed to fetch sales charts data');
            }
        });

        // B. Items Distribution Pie Chart
        $.ajax({
            url: `${API_URL}/items-chart`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const names = (data.rows || []).map(r => r.items);
                const totals = (data.rows || []).map(r => parseInt(r.total || 0));

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
            },
            error: function(xhr) {
                console.error('Failed to fetch items distribution chart data');
            }
        });

        // C. Customer Demographics Doughnut Chart
        $.ajax({
            url: `${API_URL}/address-chart`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                const locations = (data.rows || []).map(r => r.addressline || 'Not Provided');
                const counts = (data.rows || []).map(r => parseInt(r.total || 0));

                if (addressChartInstance) addressChartInstance.destroy();
                const ctxAddress = document.getElementById('addressDemographicsChart').getContext('2d');
                addressChartInstance = new Chart(ctxAddress, {
                    type: 'doughnut',
                    data: {
                        labels: locations.length > 0 ? locations : ['No Data'],
                        datasets: [{
                            data: counts.length > 0 ? counts : [1],
                            backgroundColor: [
                                '#c5a880', '#eddcc6', '#1c1c1c', '#a89475', 
                                '#e3d8c1', '#8c7d67', '#ebdcb9', '#dbccb1'
                            ]
                        }]
                    },
                    options: { 
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            },
            error: function(xhr) {
                console.error('Failed to fetch address demographics chart data');
            }
        });
    }

    // Expose to window scope
    window.loadAnalyticsCharts = loadAnalyticsCharts;

    // Trigger charts load
    loadAnalyticsCharts();

    // --------------------------------------------------------
    // 6. MODAL UTILITIES
    // --------------------------------------------------------
    window.openAddModal = () => {
        addModalTags = [];
        $('input[name="addCategories"]').prop('checked', false);
        $('#addTagInputField').val('');
        renderAddCustomTags();
        $('#addModal').addClass('active');
    };
    window.closeAddModal = () => {
        $('#addModal').removeClass('active');
        $('#addForm')[0].reset();
        addModalTags = [];
        $('input[name="addCategories"]').prop('checked', false);
        $('#addTagInputField').val('');
        renderAddCustomTags();
    };

    window.closeEditModal = () => {
        $('#editModal').removeClass('active');
        $('#editForm')[0].reset();
        $('#editCurrentImages').empty();
        $('#editCurrentImagesGroup').hide();
        editKeptImages = [];
        editModalTags = [];
        $('input[name="editCategories"]').prop('checked', false);
        $('#editTagInputField').val('');
        renderEditCustomTags();
    };

    window.exportTransactionsCSV = function () {
        $.ajax({
            url: `${API_URL}/transactions/export`,
            type: 'GET',
            xhrFields: { responseType: 'blob' },
            success: function(data, textStatus, jqXHR) {
                const blob = new Blob([data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions_summary.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: function(xhr) {
                alert('Failed to export transactions.');
            }
        });
    };

    // --------------------------------------------------------
    // 7. SUPPLIER CRUD & LOGIC
    // --------------------------------------------------------
    const suppliersTable = $('#suppliersTable').DataTable({
        columns: [
            { data: 'id' },
            { 
                data: 'name',
                render: (data, type, row) => `<a href="javascript:void(0)" class="quick-action-link" style="font-weight:700;" onclick="viewSupplierDetails(${row.id})">${data}</a>`
            },
            { data: 'contact_person', defaultContent: 'N/A' },
            { data: 'email', defaultContent: 'N/A' },
            { data: 'phone', defaultContent: 'N/A' },
            { data: 'address', defaultContent: 'N/A' },
            {
                data: 'id',
                render: data => `
                    <button class="admin-action-btn btn-success" onclick="openEditSupplierModal(${data})">Edit</button>
                    <button class="admin-action-btn btn-danger" onclick="deleteSupplier(${data})">Delete</button>
                `
            }
        ]
    });

    const expensesTable = $('#expensesTable').DataTable({
        columns: [
            { data: 'po_number' },
            { 
                data: 'supplier', 
                render: data => data ? data.name : 'N/A' 
            },
            { 
                data: 'created_at',
                render: data => new Date(data).toLocaleString()
            },
            { 
                data: 'total_cost',
                render: data => `$${parseFloat(data).toFixed(2)}`
            },
            { data: 'notes', defaultContent: '' }
        ],
        order: [[2, 'desc']]
    });

    function fetchSuppliers() {
        $.ajax({
            url: `${API_URL}/suppliers`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    suppliersTable.clear().rows.add(data.rows || []).draw();
                    populateSupplierDropdowns(data.rows || []);
                }
            },
            error: function(xhr) {
                console.error('Failed to load suppliers.');
            }
        });
    }
    window.fetchSuppliers = fetchSuppliers;

    function populateSupplierDropdowns(suppliers) {
        const addDropdown = $('#addSupplier');
        const editDropdown = $('#editSupplier');
        
        // Save current values to restore them
        const addSelected = addDropdown.val();
        const editSelected = editDropdown.val();

        addDropdown.empty().append('<option value="">No Supplier / None</option>');
        editDropdown.empty().append('<option value="">No Supplier / None</option>');

        suppliers.forEach(sup => {
            const opt = `<option value="${sup.id}">${sup.name}</option>`;
            addDropdown.append(opt);
            editDropdown.append(opt);
        });

        // Restore values
        if (addSelected) addDropdown.val(addSelected);
        if (editSelected) editDropdown.val(editSelected);
    }

    // Call fetchSuppliers initially to populate the dropdowns
    fetchSuppliers();
    fetchExpenses();

    // Modal triggers for Supplier
    window.openAddSupplierModal = () => {
        $('#addSupplierModal').addClass('active');
    };

    window.closeAddSupplierModal = () => {
        $('#addSupplierModal').removeClass('active');
        $('#addSupplierForm')[0].reset();
    };

    window.openEditSupplierModal = (id) => {
        $.ajax({
            url: `${API_URL}/suppliers/${id}`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.result) {
                    const sup = data.result;
                    $('#editSupplierId').val(sup.id);
                    $('#editSupplierName').val(sup.name);
                    $('#editSupplierContact').val(sup.contact_person);
                    $('#editSupplierEmail').val(sup.email);
                    $('#editSupplierPhone').val(sup.phone);
                    $('#editSupplierAddress').val(sup.address);
                    $('#editSupplierModal').addClass('active');
                }
            },
            error: function(xhr) {
                alert('Failed to load supplier details.');
            }
        });
    };

    window.closeEditSupplierModal = () => {
        $('#editSupplierModal').removeClass('active');
        $('#editSupplierForm')[0].reset();
    };

    // Add Supplier Form Submit
    $('#addSupplierForm').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            name: $('#addSupplierName').val(),
            contact_person: $('#addSupplierContact').val(),
            email: $('#addSupplierEmail').val(),
            phone: $('#addSupplierPhone').val(),
            address: $('#addSupplierAddress').val()
        };

        $.ajax({
            url: `${API_URL}/suppliers`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function(data) {
                alert('Supplier created successfully!');
                closeAddSupplierModal();
                fetchSuppliers();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error creating supplier: ' + (errData.error || 'Failed to create supplier'));
            }
        });
    });

    // Edit Supplier Form Submit
    $('#editSupplierForm').on('submit', function (e) {
        e.preventDefault();
        const id = $('#editSupplierId').val();
        const payload = {
            name: $('#editSupplierName').val(),
            contact_person: $('#editSupplierContact').val(),
            email: $('#editSupplierEmail').val(),
            phone: $('#editSupplierPhone').val(),
            address: $('#editSupplierAddress').val()
        };

        $.ajax({
            url: `${API_URL}/suppliers/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function(data) {
                alert('Supplier updated successfully!');
                closeEditSupplierModal();
                fetchSuppliers();
                // reload figurines and dashboard to reflect updated supplier name
                fetchFigurines();
                loadAdminDashboard();
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error updating supplier: ' + (errData.error || 'Failed to update supplier'));
            }
        });
    });

    // Delete Supplier
    window.deleteSupplier = function(id) {
        if (confirm('Are you sure you want to delete this supplier? Associated items will have their supplier set to None.')) {
            $.ajax({
                url: `${API_URL}/suppliers/${id}`,
                type: 'DELETE',
                dataType: 'json',
                success: function(data) {
                    alert('Supplier deleted successfully.');
                    fetchSuppliers();
                    fetchFigurines();
                    loadAdminDashboard();
                },
                error: function(xhr) {
                    const errData = xhr.responseJSON || {};
                    alert('Failed to delete supplier: ' + (errData.error || 'Failed to delete supplier'));
                }
            });
        }
    };

    // Purchase Order Cart state
    let poCart = [];
    let currentSupplierId = null;

    // Add item to Purchase Order Cart
    window.addToPOCart = (itemId, name, unitCost) => {
        const qtyInput = $(`#po-qty-${itemId}`);
        const quantity = parseInt(qtyInput.val()) || 0;
        
        if (quantity <= 0) {
            alert('Please enter a valid quantity of 1 or more.');
            return;
        }

        // Check if item already exists in cart
        const existing = poCart.find(i => i.item_id === itemId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            poCart.push({
                item_id: itemId,
                name: name,
                unit_cost: parseFloat(unitCost) || 0,
                quantity: quantity
            });
        }

        qtyInput.val(1); // Reset input quantity to 1
        renderPOCart();
    };

    // Render current Purchase Order Cart items
    function renderPOCart() {
        const cartWrapper = $('#poCartItems');
        cartWrapper.empty();

        if (poCart.length === 0) {
            cartWrapper.append('<div style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">Cart is empty</div>');
            $('#poCartTotal').text('$0.00');
            $('#checkoutPOBtn').prop('disabled', true);
            return;
        }

        let total = 0;
        poCart.forEach((item, index) => {
            const cost = item.unit_cost * item.quantity;
            total += cost;
            cartWrapper.append(`
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed rgba(197,168,128,0.15);">
                    <div style="flex: 1; padding-right: 0.5rem; text-align: left;">
                        <strong>${item.name}</strong><br>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">${item.quantity} x $${item.unit_cost.toFixed(2)}</span>
                    </div>
                    <div style="font-weight: 600; font-size: 0.8rem; margin-right: 0.5rem;">$${cost.toFixed(2)}</div>
                    <button class="admin-action-btn btn-danger" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px;" onclick="removeFromPOCart(${index})">&times;</button>
                </div>
            `);
        });

        $('#poCartTotal').text(`$${total.toFixed(2)}`);
        $('#checkoutPOBtn').prop('disabled', false);
    }

    // Remove item from Purchase Order Cart
    window.removeFromPOCart = (index) => {
        poCart.splice(index, 1);
        renderPOCart();
    };

    // Checkout Purchase Order (Procurement)
    window.checkoutPurchaseOrder = () => {
        if (poCart.length === 0 || !currentSupplierId) return;

        const notes = $('#poNotes').val().trim();
        const payload = {
            supplier_id: currentSupplierId,
            notes: notes,
            items: poCart.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity,
                unit_cost: item.unit_cost
            }))
        };

        $('#checkoutPOBtn').prop('disabled', true).text('Processing...');

        $.ajax({
            url: `${API_URL}/purchase-orders`,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            success: function(data) {
                if (data.success) {
                    alert('Purchase order created successfully and stock updated!');
                    closeViewSupplierModal();
                    
                    // Refresh data across tabs
                    fetchFigurines();
                    loadAdminDashboard();
                    fetchExpenses();
                } else {
                    alert('Error creating purchase order: ' + (data.error || 'Unknown error'));
                    $('#checkoutPOBtn').prop('disabled', false).text('Checkout Procurement Order');
                }
            },
            error: function(xhr) {
                const errData = xhr.responseJSON || {};
                alert('Error creating purchase order: ' + (errData.error || 'Failed to place order.'));
                $('#checkoutPOBtn').prop('disabled', false).text('Checkout Procurement Order');
            }
        });
    };

    // View Supplier Details (with Brands and Supplied Products)
    window.viewSupplierDetails = (id) => {
        currentSupplierId = id;
        poCart = []; // Clear cart on change
        $('#poNotes').val('');
        renderPOCart();

        $.ajax({
            url: `${API_URL}/suppliers/${id}`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.result) {
                    const sup = data.result;
                    $('#viewSupplierTitle').text(sup.name);
                    $('#viewSupplierContact').text(sup.contact_person || 'N/A');
                    $('#viewSupplierPhone').text(sup.phone || 'N/A');
                    $('#viewSupplierEmail').text(sup.email || 'N/A');
                    $('#viewSupplierAddress').text(sup.address || 'N/A');

                    // Extract unique brands
                    const brands = new Set();
                    const productsBody = $('#viewSupplierProductsTable tbody');
                    productsBody.empty();

                    if (sup.items && sup.items.length > 0) {
                        sup.items.forEach(item => {
                            const brandName = item.brand ? item.brand.name : 'Unknown Brand';
                            brands.add(brandName);

                            // Escape single quotes in product name
                            const escapedName = (item.name || item.description).replace(/'/g, "\\'");

                            productsBody.append(`
                                <tr>
                                    <td><strong>${item.name || item.description}</strong></td>
                                    <td>${brandName}</td>
                                    <td>$${parseFloat(item.cost_price).toFixed(2)}</td>
                                    <td>
                                        <input type="number" id="po-qty-${item.item_id}" class="admin-input" style="width: 60px; padding: 0.25rem; text-align: center; margin: 0;" min="1" value="1">
                                    </td>
                                    <td>
                                        <button class="admin-action-btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border-radius: 4px;" onclick="addToPOCart(${item.item_id}, '${escapedName}', ${item.cost_price})">Add</button>
                                    </td>
                                </tr>
                            `);
                        });
                    } else {
                        productsBody.append(`
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 1.5rem 0;">No products currently linked to this supplier.</td>
                            </tr>
                        `);
                    }

                    // Render Brands tags
                    const brandsWrapper = $('#viewSupplierBrands');
                    brandsWrapper.empty();
                    if (brands.size > 0) {
                        brands.forEach(b => {
                            brandsWrapper.append(`<span class="tag-badge" style="box-shadow:none;"><span class="tag-hash">★</span><span class="tag-text">${b}</span></span>`);
                        });
                    } else {
                        brandsWrapper.append(`<span style="font-size:0.85rem; color:var(--text-secondary);">No brands supplied.</span>`);
                    }

                    $('#viewSupplierModal').addClass('active');
                }
            },
            error: function(xhr) {
                alert('Failed to fetch supplier profile.');
            }
        });
    };

    window.closeViewSupplierModal = () => {
        $('#viewSupplierModal').removeClass('active');
    };

    function fetchExpenses() {
        $.ajax({
            url: `${API_URL}/purchase-orders`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.orders) {
                    expensesTable.clear().rows.add(data.orders).draw();
                    
                    // Calculate sum of total expenses
                    let totalExpenses = 0;
                    data.orders.forEach(order => {
                        totalExpenses += parseFloat(order.total_cost) || 0;
                    });
                    $('#totalExpensesText').text(`$${totalExpenses.toFixed(2)}`);
                }
            },
            error: function(xhr) {
                console.error('Failed to load purchase orders.');
            }
        });
    }
    window.fetchExpenses = fetchExpenses;

    window.exportExpensesCSV = () => {
        $.ajax({
            url: `${API_URL}/purchase-orders`,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                if (data.success && data.orders) {
                    let csv = 'PO Number,Supplier Name,Date,Total Cost ($),Notes\n';
                    data.orders.forEach(order => {
                        const formattedDate = new Date(order.created_at).toLocaleString();
                        const notes = order.notes ? order.notes.replace(/"/g, '""') : '';
                        csv += `"${order.po_number}","${order.supplier ? order.supplier.name : 'N/A'}","${formattedDate}",${parseFloat(order.total_cost).toFixed(2)},"${notes}"\n`;
                    });
                    
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `expenses_report_${Date.now()}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            },
            error: function() {
                alert('Failed to fetch purchase orders for CSV export.');
            }
        });
    };
});
