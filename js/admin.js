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

    // Global fetch interceptor for automatic authorization headers and 401 session expiration handling
    const originalFetch = window.fetch;
    window.fetch = async function (resource, init) {
        const url = typeof resource === 'string' ? resource : resource.url;
        const currentToken = localStorage.getItem('token');
        if (url.includes('/api/v1/') && currentToken) {
            init = init || {};
            init.headers = init.headers || {};
            if (init.headers instanceof Headers) {
                init.headers.set('Authorization', `Bearer ${currentToken}`);
            } else {
                init.headers['Authorization'] = `Bearer ${currentToken}`;
            }
        }

        try {
            const res = await originalFetch(resource, init);
            
            if (res.status === 401) {
                let message = 'Session expired. Please log in again.';
                try {
                    const clone = res.clone();
                    const data = await clone.json();
                    message = data.message || data.error || message;
                } catch (e) {}
                
                alert(message);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                let loginUrl = 'login.html';
                const path = window.location.pathname;
                if (path.match(/\/(admin|customer)\//i)) {
                    loginUrl = '../login.html';
                }
                window.location.href = loginUrl;
                
                return new Promise(() => {}); // abort subsequent .then() chains
            }
            
            // Intercept json() to map message -> error for legacy compatibility and handle non-JSON error pages
            const originalJson = res.json;
            res.json = async function () {
                try {
                    const data = await originalJson.call(res);
                    if (data && typeof data === 'object') {
                        if (data.message && !data.error) {
                            data.error = data.message;
                        }
                    }
                    return data;
                } catch (jsonErr) {
                    if (!res.ok) {
                        return { error: `Server error (${res.status}). Please check your backend logs.` };
                    }
                    throw jsonErr;
                }
            };
            
            return res;
        } catch (err) {
            throw err;
        }
    };

    // --------------------------------------------------------
    // 1. DATA TABLES SETUP
    // --------------------------------------------------------

    // A. Figurines Table
    const figurinesTable = $('#figurinesTable').DataTable({
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
        fetch(`${API_URL}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load figurines.');
            return res.json();
        })
        .then(data => {
            figurinesTable.clear().rows.add(data.rows || []).draw();
        })
        .catch(err => console.error(err));
    }

    function fetchUsers() {
        fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load users.');
            return res.json();
        })
        .then(data => {
            usersTable.clear().rows.add(data.rows || []).draw();
        })
        .catch(err => console.error(err));
    }

    // Expose fetch functions to global scope if needed for reload signals
    window.fetchUsers = fetchUsers;
    window.fetchFigurines = fetchFigurines;

    function fetchTransactions() {
        fetch(`${API_URL}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load transactions.');
            return res.json();
        })
        .then(data => {
            transactionsTable.clear().rows.add(data.rows || []).draw();
        })
        .catch(err => console.error(err));
    }

    function fetchDeletedFigurines() {
        fetch(`${API_URL}/items/deleted`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load deleted figurines.');
            return res.json();
        })
        .then(data => {
            deletedFigurinesTable.clear().rows.add(data.rows || []).draw();
        })
        .catch(err => console.error(err));
    }

    function fetchDeletedUsers() {
        fetch(`${API_URL}/users/deleted`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load deactivated users.');
            return res.json();
        })
        .then(data => {
            deletedUsersTable.clear().rows.add(data.rows || []).draw();
        })
        .catch(err => console.error(err));
    }

    function loadAdminDashboard() {
        fetch(`${API_URL}/dashboard/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to load dashboard metrics.');
            return res.json();
        })
        .then(data => {
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
                        
                        lowStockBody.append(`
                            <tr>
                                <td>
                                    <div style="display:flex; align-items:center;">
                                        ${imgTag}
                                        <span style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${item.description}</span>
                                    </div>
                                </td>
                                <td><span class="restock-badge">${item.quantity} left</span></td>
                                <td>$${parseFloat(item.sell_price).toFixed(2)}</td>
                                <td><a class="quick-action-link" onclick="openEditModal(${item.item_id})">Restock</a></td>
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
        })
        .catch(err => console.error(err));
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

        const fileInput = document.getElementById('addFiles');
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('images', fileInput.files[i]);
            }
        }

        fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create figurine');
            alert('Figurine created successfully!');
            closeAddModal();
            fetchFigurines();
            loadAnalyticsCharts(); // refresh analytics
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Error creating figurine: ' + err.message);
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
        formData.append('keep_images', JSON.stringify(editKeptImages));

        const fileInput = document.getElementById('editFiles');
        if (fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('images', fileInput.files[i]);
            }
        }

        fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update figurine');
            alert('Figurine updated successfully!');
            closeEditModal();
            fetchFigurines();
            loadAnalyticsCharts(); // refresh analytics
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Error updating figurine: ' + err.message);
        });
    });

    // Global scopes for CRUD triggers
    window.deleteItem = function (id) {
        if (confirm('Are you sure you want to delete this figurine from the catalog?')) {
            fetch(`${API_URL}/items/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to delete figurine');
                alert('Figurine deleted.');
                fetchFigurines();
                fetchDeletedFigurines();
                loadAnalyticsCharts();
                loadAdminDashboard();
            })
            .catch(err => {
                alert('Deletion failed: ' + err.message);
            });
        }
    };

    window.commitRestoreFigurine = function (id) {
        fetch(`${API_URL}/items/${id}/restore`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to restore figurine');
            alert('Figurine restored successfully.');
            fetchFigurines();
            fetchDeletedFigurines();
            loadAnalyticsCharts();
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Failed to restore figurine: ' + err.message);
        });
    };

    window.openEditModal = function (id) {
        fetch(`${API_URL}/items/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load item');
            if (data.success && data.result.length > 0) {
                const item = data.result[0];
                $('#editId').val(item.item_id);
                $('#editDesc').val(item.description);
                $('#editCost').val(item.cost_price);
                $('#editSell').val(item.sell_price);
                $('#editQty').val(item.quantity);

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
        })
        .catch(err => {
            alert('Error loading figurine data: ' + err.message);
        });
    };

    // --------------------------------------------------------
    // 3. ADMIN USER ACTIONS
    // --------------------------------------------------------
    window.commitUserRole = function (id) {
        const role = $(`#role-select-${id}`).val();
        fetch(`${API_URL}/users/${id}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update role');
            alert('User role updated successfully.');
            fetchUsers();
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Role update failed: ' + err.message);
        });
    };

    window.toggleUserDeactivation = function (id) {
        if (confirm('Toggle user activation/deactivation status?')) {
            fetch(`${API_URL}/users/${id}/deactivate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to toggle user status');
                alert(data.message);
                fetchUsers();
                fetchDeletedUsers();
                loadAdminDashboard();
            })
            .catch(err => {
                alert('Deactivation action failed: ' + err.message);
            });
        }
    };

    window.commitRestoreUser = function (id) {
        fetch(`${API_URL}/users/${id}/deactivate`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to activate account');
            alert('Collector account activated successfully.');
            fetchUsers();
            fetchDeletedUsers();
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Failed to activate collector account: ' + err.message);
        });
    };

    // --------------------------------------------------------
    // 4. TRANSACTION ACTIONS & EMAIL INVOICES
    // --------------------------------------------------------
    window.commitTransactionStatus = function (id) {
        const status = $(`#status-select-${id}`).val();
        const selectEl = $(`#status-select-${id}`);
        selectEl.css('opacity', '0.5').prop('disabled', true);
        
        fetch(`${API_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update transaction status');
            alert(`Status updated! Email containing PDF invoice has been sent to customer.`);
            selectEl.css('opacity', '1').prop('disabled', false);
            fetchTransactions();
            loadAdminDashboard();
        })
        .catch(err => {
            alert('Failed to update transaction status: ' + err.message);
            selectEl.css('opacity', '1').prop('disabled', false);
        });
    };

    window.deleteTransaction = function (id) {
        if (confirm('Are you sure you want to delete this payment record?')) {
            fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(async res => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to delete transaction');
                alert('Transaction record deleted.');
                fetchTransactions();
                loadAdminDashboard();
            })
            .catch(err => {
                alert('Failed to delete transaction: ' + err.message);
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
        fetch(`${API_URL}/sales-chart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch sales charts data');
            return res.json();
        })
        .then(data => {
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
        })
        .catch(err => console.error(err));

        // B. Items Distribution Pie Chart
        fetch(`${API_URL}/items-chart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch items distribution chart data');
            return res.json();
        })
        .then(data => {
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
        })
        .catch(err => console.error(err));

        // C. Customer Demographics Doughnut Chart
        fetch(`${API_URL}/address-chart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch address demographics chart data');
            return res.json();
        })
        .then(data => {
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
        })
        .catch(err => console.error(err));
    }

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
        fetch(`${API_URL}/transactions/export`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to export transactions summary.');
            return res.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions_summary.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        })
        .catch(err => {
            alert('Export failed: ' + err.message);
        });
    };
});
