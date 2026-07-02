document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api/v1';

    // -------------------------------------------------------------------------
    // 1. SESSION GUARD (Redirect if already logged in)
    // -------------------------------------------------------------------------
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            if (user && user.role && user.role.trim().toLowerCase() === 'admin') {
                window.location.href = 'admin/admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } catch (e) {
            window.location.href = 'index.html';
        }
        return;
    }

    // -------------------------------------------------------------------------
    // 2. TOAST SYSTEM
    // -------------------------------------------------------------------------
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✨';
        if (type === 'error') icon = '⚠️';
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span>${message}</span>
            </div>
            <button class="toast-close-btn">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        const removeToast = () => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            }, { once: true });
        };

        const autoRemoveTimeout = setTimeout(removeToast, 4000);

        const closeBtn = toast.querySelector('.toast-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                clearTimeout(autoRemoveTimeout);
                removeToast();
            });
        }
    }

    // Check query parameters to display success messages from redirects
    const urlParams = new URLSearchParams(window.location.search);
    const regEmail = urlParams.get('email');
    const regSuccess = urlParams.get('registered');
    
    if (regSuccess && regEmail) {
        showToast("Account created successfully! Please sign in.", "success");
        const loginEmailInput = document.getElementById('loginEmail');
        if (loginEmailInput) {
            loginEmailInput.value = regEmail;
        }
        const loginPassInput = document.getElementById('loginPassword');
        if (loginPassInput) {
            loginPassInput.focus();
        }
    }

    // -------------------------------------------------------------------------
    // 3. FORM VALIDATIONS & API CALLS
    // -------------------------------------------------------------------------
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Email Validator
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!validateEmail(email)) {
                showToast("Please enter a valid email address.", "error");
                return;
            }

            const submitBtn = loginForm.querySelector('.btn-auth-submit');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Signing in...";
            submitBtn.disabled = true;

            try {
                const data = await $.ajax({
                    url: `${API_BASE_URL}/login`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ email, password }),
                    dataType: 'json'
                });

                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showToast(`Welcome back, ${data.user.name}!`, "success");
                    
                    setTimeout(() => {
                        if (data.user && data.user.role && data.user.role.trim().toLowerCase() === 'admin') {
                            window.location.href = 'admin/admin.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 1000);
                } else {
                    const errorMsg = data.message || data.error || "Invalid email or password.";
                    showToast(errorMsg, "error");
                }
            } catch (xhr) {
                const errData = xhr.responseJSON || {};
                const errorMsg = errData.message || errData.error || "Cannot connect to server. Ensure your backend is running.";
                console.error("Login API Error:", errData);
                showToast(errorMsg, "error");
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // 3.4 Dynamic Address Block Adder for Registration
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addressListContainer = document.getElementById('addressListContainer');

    if (addAddressBtn && addressListContainer) {
        addAddressBtn.addEventListener('click', () => {
            const addressCard = document.createElement('div');
            addressCard.className = 'address-item-card';
            addressCard.style.cssText = 'border: 1px solid rgba(197, 168, 128, 0.15); background-color: rgba(245, 239, 230, 0.2); border-radius: 12px; padding: 1.2rem; position: relative; margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.8rem;';
            
            addressCard.innerHTML = `
                <button type="button" class="remove-address-btn" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; font-size: 1.4rem; color: #C94A4A; cursor: pointer; line-height: 1;">&times;</button>
                <div class="input-group">
                    <label>Street Address</label>
                    <input type="text" class="addr-street" placeholder="e.g. 123 Main St" required autocomplete="street-address">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    <div class="input-group">
                        <label>City/Municipality</label>
                        <input type="text" class="addr-city" placeholder="City" required autocomplete="address-level2">
                    </div>
                    <div class="input-group">
                        <label>Province/State</label>
                        <input type="text" class="addr-province" placeholder="Province" required autocomplete="address-level1">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                    <div class="input-group">
                        <label>ZIP/Postal Code</label>
                        <input type="text" class="addr-zip" placeholder="ZIP" required autocomplete="postal-code">
                    </div>
                    <div class="input-group">
                        <label>Country</label>
                        <input type="text" class="addr-country" placeholder="Country" required autocomplete="country">
                    </div>
                </div>
            `;
            
            addressListContainer.appendChild(addressCard);
            
            // Remove button functionality
            const removeBtn = addressCard.querySelector('.remove-address-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    addressCard.remove();
                });
            }
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fnameInput = document.getElementById('registerFName');
            const lnameInput = document.getElementById('registerLName');
            const emailInput = document.getElementById('registerEmail');
            const phoneInput = document.getElementById('registerPhone');
            const dobInput = document.getElementById('registerDOB');
            const passwordInput = document.getElementById('registerPassword');
            const confirmPasswordInput = document.getElementById('registerConfirmPassword');

            const fname = fnameInput.value.trim();
            const lname = lnameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const dob = dobInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Client side validation
            if (fname.length < 2 || lname.length < 2) {
                showToast("Please enter valid first and last names.", "error");
                return;
            }
            if (!validateEmail(email)) {
                showToast("Please enter a valid email address.", "error");
                return;
            }
            if (phone.length < 7) {
                showToast("Please enter a valid phone number.", "error");
                return;
            }
            if (!dob) {
                showToast("Please select your date of birth.", "error");
                return;
            }
            if (password.length < 6) {
                showToast("Password must be at least 6 characters.", "error");
                return;
            }
            if (password !== confirmPassword) {
                showToast("Passwords do not match.", "error");
                return;
            }

            // Gather addresses array
            const addresses = [];
            const addressCards = document.querySelectorAll('.address-item-card');
            addressCards.forEach(card => {
                const street = card.querySelector('.addr-street').value.trim();
                const city = card.querySelector('.addr-city').value.trim();
                const province = card.querySelector('.addr-province').value.trim();
                const zip = card.querySelector('.addr-zip').value.trim();
                const country = card.querySelector('.addr-country').value.trim();
                
                if (street && city && province && zip && country) {
                    addresses.push({
                        streetAddress: street,
                        city: city,
                        province: province,
                        zipCode: zip,
                        country: country
                    });
                }
            });

            const submitBtn = registerForm.querySelector('.btn-auth-submit');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Creating account...";
            submitBtn.disabled = true;

            try {
                const data = await $.ajax({
                    url: `${API_BASE_URL}/register`,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ fname, lname, email, password, phone, dob, addresses }),
                    dataType: 'json'
                });

                if (data.success) {
                    showToast("Account created! Redirecting to sign in...", "success");
                    setTimeout(() => {
                        window.location.href = `login.html?registered=true&email=${encodeURIComponent(email)}`;
                    }, 1200);
                } else {
                    const errorMsg = data.message || data.error || "Registration failed. Try again.";
                    showToast(errorMsg, "error");
                }
            } catch (xhr) {
                const errData = xhr.responseJSON || {};
                const errorMsg = errData.message || errData.error || "Cannot connect to server. Ensure your backend is running.";
                console.error("Register API Error:", errData);
                showToast(errorMsg, "error");
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
