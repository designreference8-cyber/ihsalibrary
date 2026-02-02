/**
 * LMS - Library Management System
 * Vanilla JS Implementation
 */

// --- State & Data Management ---

const defaultData = {
    books: [
        { id: 101, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', quantity: 5, available: 3 },
        { id: 102, title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', quantity: 3, available: 1 },
        { id: 103, title: 'Design Patterns', author: 'Erich Gamma', category: 'Technology', quantity: 4, available: 4 },
    ],
    members: [
        { id: 'M001', name: 'John Doe', email: 'john@example.com', type: 'Student', joined: '2025-01-10' },
        { id: 'M002', name: 'Jane Smith', email: 'jane@example.com', type: 'Faculty', joined: '2025-01-15' },
    ],
    circulation: [
        { id: 1, bookId: 102, memberId: 'M001', issueDate: '2026-01-20', dueDate: '2026-02-03', returnDate: null, status: 'Issued' },
        { id: 2, bookId: 101, memberId: 'M001', issueDate: '2026-01-10', dueDate: '2026-01-24', returnDate: '2026-01-20', status: 'Returned' },
    ],
    adminConfig: {
        username: 'admin',
        password: 'admin123'
    },
    reviews: []
};

class Store {
    constructor() {
        this.data = defaultData; // Initial default
    }

    async init() {
        try {
            const res = await fetch('api/data.php');
            if (res.ok) {
                const json = await res.json();
                if (Object.keys(json).length > 0) {
                    this.data = json;
                }
            }
        } catch (err) {
            console.error('Failed to load DB:', err);
        }
    }

    async save() {
        try {
            await fetch('api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.data)
            });
        } catch (err) {
            console.error('Failed to save DB:', err);
        }
    }

    get(key) {
        return this.data[key];
    }

    add(key, item) {
        this.data[key].push(item);
        this.save();
    }

    update(key, idField, id, updates) {
        const index = this.data[key].findIndex(item => item[idField] == id);
        if (index !== -1) {
            this.data[key][index] = { ...this.data[key][index], ...updates };
            this.save();
        }
    }

    delete(key, idField, id) {
        this.data[key] = this.data[key].filter(item => item[idField] != id);
        this.save();
    }
}

const store = new Store();

// --- Auth ---

function renderLogin() {
    // ... existing renderLogin code ...
    const existing = document.getElementById('login-overlay');
    if (existing) return;

    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.className = 'login-overlay';
    overlay.innerHTML = `
        <div class="login-card">
            <div class="login-split">
                <!-- Check Status Panel -->
                <div class="login-panel" style="background: #f1f5f9; border-right: 1px solid #e2e8f0;">
                    <div class="login-header">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; color: #64748b; margin-bottom: 1rem;"></i>
                        <h2>Check Status</h2>
                        <p>Search library catalog.</p>
                    </div>
                    <form onsubmit="handleCheckStatus(event)">
                        <div class="form-group">
                            <label class="form-label">Book ID</label>
                            <input type="text" name="bookId" class="form-input" required placeholder="Enter Book ID" autofocus>
                        </div>
                        <button type="submit" class="btn btn-secondary" style="width: 100%; margin-top: 1rem;">Check</button>
                    </form>
                    <div id="check-status-result" style="margin-top: 1.5rem;"></div>
                </div>

                <!-- Admin Panel -->
                <div class="login-panel admin-panel">
                    <div class="login-header">
                        <i class="fa-solid fa-user-shield" style="font-size: 2.5rem; color: #3b82f6; margin-bottom: 1rem;"></i>
                        <h2>Admin Login</h2>
                        <p>Internal staff access needed.</p>
                    </div>
                    <form onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" name="username" class="form-input" required placeholder="admin">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" name="password" class="form-input" required placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">Sign In</button>
                    </form>
                </div>

                <!-- Member Panel -->
                <div class="login-panel member-panel">
                    <div class="login-header">
                        <i class="fa-solid fa-users" style="font-size: 2.5rem; color: #10b981; margin-bottom: 1rem;"></i>
                        <h2>Member Login</h2>
                        <p>Student / Faculty access.</p>
                    </div>
                    <form onsubmit="handleMemberLogin(event)">
                        <div class="form-group">
                            <label class="form-label">Member ID</label>
                            <input type="text" name="memberId" class="form-input" required placeholder="Ex: M001" style="font-size: 1.1rem; letter-spacing: 0.5px;">
                        </div>
                        <div style="flex-grow: 1;"></div>
                         <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; color: #166534; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem;">
                            <i class="fa-solid fa-circle-info"></i> No password required. Just enter your assigned Member ID.
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; background-color: #10b981;">Access Portal</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    const app = document.getElementById('app');
    if (app) app.style.filter = 'blur(5px)';
}

function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const u = formData.get('username');
    const p = formData.get('password');

    // Get config from store or default
    let config = store.get('adminConfig');
    // Sanity check if store version is old
    if (!config) {
        config = { username: 'admin', password: 'admin123' };
        store.data.adminConfig = config;
        store.save();
    }

    if (u === config.username && p === config.password) {
        sessionStorage.setItem('lms_token', 'true');
        sessionStorage.setItem('lms_role', 'admin');
        navigate('dashboard');
    } else {
        alert('Invalid Username or Password');
        e.target.reset();
        e.target.querySelector('input').focus();
    }
}

// ... handleMemberLogin ...

function openAdminSettings() {
    let config = store.get('adminConfig');
    if (!config) config = { username: 'admin', password: 'admin123' };

    const modalSchema = `
        <form onsubmit="handleSaveAdminConfig(event)">
            <div class="form-group">
                <label class="form-label">Admin Username</label>
                <input type="text" name="username" class="form-input" required value="${config.username}">
            </div>
            <hr style="margin: 1.5rem 0; border: 0; border-top: 1px solid #e2e8f0;">
            <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" name="newPassword" class="form-input" placeholder="Leave blank to keep current">
            </div>
            <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" name="confirmPassword" class="form-input" placeholder="Confirm new password">
            </div>
            <div style="background-color: #fef2f2; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem;">
                <i class="fa-solid fa-triangle-exclamation"></i> Warning: If you forget these credentials, you will lose admin access and need to clear browser data.
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Save Credentials</button>
        </form>
    `;
    showModal('Admin Settings', modalSchema);
}

function handleSaveAdminConfig(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username').trim();
    const newPass = formData.get('newPassword');
    const confirmPass = formData.get('confirmPassword');

    let config = store.get('adminConfig') || { username: 'admin', password: 'admin123' };

    if (!username) {
        alert('Username cannot be empty');
        return;
    }

    config.username = username;

    if (newPass) {
        if (newPass !== confirmPass) {
            alert('Passwords do not match!');
            return;
        }
        config.password = newPass;
    }

    store.data.adminConfig = config;
    store.save();

    alert('Admin credentials updated successfully! You may need to login again next time.');
    closeModal();
}

function handleMemberLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const memberId = formData.get('memberId').trim();

    const member = store.get('members').find(m => m.id === memberId);

    if (member) {
        sessionStorage.setItem('lms_token', 'true');
        sessionStorage.setItem('lms_role', 'member');
        sessionStorage.setItem('lms_member_id', memberId);
        navigate('dashboard'); // Redirect to Member Dashboard
    } else {
        alert('Invalid Member ID. Please contact the librarian.');
        e.target.reset();
        e.target.querySelector('input').focus();
    }
}

function logout() {
    if (confirm('Log out of the system?')) {
        sessionStorage.removeItem('lms_token');
        sessionStorage.removeItem('lms_role');
        sessionStorage.removeItem('lms_member_id');
        window.location.reload();
    }
}

// --- Navigation & Router ---

function navigate(view) {
    // Auth Check
    const isAuthenticated = sessionStorage.getItem('lms_token');
    const role = sessionStorage.getItem('lms_role');

    if (!isAuthenticated) {
        renderLogin();
        return;
    }

    // If authenticated, ensure no login overlay
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) loginOverlay.remove();
    document.getElementById('app').style.filter = 'none';

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.dataset.view) {
            btn.classList.toggle('active', btn.dataset.view === view);
        }
    });

    // Role-based UI
    const isAdmin = role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'flex' : 'none';
    });

    updateSidebarProfile(); // Update sidebar on nav change

    // Update Content
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    contentArea.innerHTML = '';

    switch (view) {
        case 'dashboard':
            pageTitle.innerText = 'Dashboard';
            renderDashboard(contentArea);
            break;
        case 'books':
            pageTitle.innerText = 'Book Catalog';
            renderBooks(contentArea);
            break;
        case 'members':
            pageTitle.innerText = 'Members';
            renderMembers(contentArea);
            break;
        case 'circulation':
            pageTitle.innerText = 'Circulation';
            renderCirculation(contentArea);
            break;
    }
}

// --- Views ---

function renderDashboard(container) {
    const role = sessionStorage.getItem('lms_role');
    const memberId = sessionStorage.getItem('lms_member_id');
    const books = store.get('books');
    const circulation = store.get('circulation');
    const reviews = store.get('reviews') || [];

    // --- MEMBER DASHBOARD ---
    if (role === 'member') {
        const myActive = circulation.filter(c => c.memberId === memberId && c.status === 'Issued');
        const myHistory = circulation.filter(c => c.memberId === memberId && c.status === 'Returned');
        const member = store.get('members').find(m => m.id === memberId);

        container.innerHTML = `
            <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
                <div style="display: flex; align-items: center; gap: 1.5rem;">
                    <div style="width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 2.5rem; border: 4px solid rgba(255,255,255,0.3);">
                        ${member.photo ? `<img src="${member.photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : '<i class="fa-solid fa-user"></i>'}
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 2rem;">Welcome back, ${member.name.split(' ')[0]}!</h2>
                        <p style="margin: 0.5rem 0 0; opacity: 0.9;">Member ID: <strong>${memberId}</strong> | <i class="fa-solid fa-book-open"></i> ${myActive.length} Books currently borrowing</p>
                    </div>
                </div>
            </div>

            <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <!-- Currently Reading -->
                <div class="card">
                     <h3 style="margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;"><i class="fa-solid fa-book-reader" style="color: #3b82f6;"></i> Currently Reading</h3>
                     ${myActive.length === 0 ? '<p style="color: #64748b; font-style: italic;">No books currently issued.</p>' : ''}
                     <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${myActive.map(c => {
            const book = books.find(b => b.id == c.bookId);
            const isOverdue = new Date(c.dueDate) < new Date();
            const daysLeft = Math.ceil((new Date(c.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

            return `
                            <div style="display: flex; gap: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; align-items: center;">
                                <div style="width: 50px; height: 70px; background: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    ${book.image ? `<img src="${book.image}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` : '<i class="fa-solid fa-book" style="color: #cbd5e1;"></i>'}
                                </div>
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 0.25rem;">${book.title}</h4>
                                    <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem;">Due: ${c.dueDate} (${daysLeft > 0 ? daysLeft + ' days left' : 'Overdue'})</div>
                                    ${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : '<span class="badge badge-warning">On Loan</span>'}
                                </div>
                            </div>
                            `;
        }).join('')}
                     </div>
                </div>

                <!-- Reading History -->
                <div class="card">
                    <h3 style="margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;"><i class="fa-solid fa-clock-rotate-left" style="color: #10b981;"></i> Reading History</h3>
                    <div style="height: 400px; overflow-y: auto; padding-right: 0.5rem;">
                         ${myHistory.length === 0 ? '<p style="color: #64748b; font-style: italic;">No reading history yet.</p>' : ''}
                         <table style="width: 100%;">
                            ${myHistory.slice().reverse().map(c => {
            const book = books.find(b => b.id == c.bookId);
            const myReview = reviews.find(r => r.bookId == c.bookId && r.memberId === memberId);

            return `
                                <tr style="border-bottom: 1px solid #f1f5f9;">
                                    <td style="padding: 0.75rem 0;">
                                        <div style="font-weight: 600;">${book.title}</div>
                                        <div style="font-size: 0.8rem; color: #64748b;">Returned: ${c.returnDate}</div>
                                    </td>
                                    <td style="text-align: right;">
                                        ${myReview ?
                    `<span style="color: #eab308; font-size: 0.9rem;"><i class="fa-solid fa-star"></i> ${myReview.rating}</span>` :
                    `<button class="btn btn-sm btn-secondary" onclick="openWriteReviewModal('${c.bookId}')">Write Review</button>`
                }
                                    </td>
                                </tr>
                            `;
        }).join('')}
                         </table>
                    </div>
                </div>
            </div>

            <div style="margin-top: 2rem; display: flex; justify-content: center;">
                 <button class="btn btn-secondary" onclick="openCheckStatusModal()" style="padding: 1rem 2rem; font-size: 1.1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><i class="fa-solid fa-magnifying-glass"></i> Check Book Status</button>
            </div>
        `;
        return;
    }

    // --- ADMIN DASHBOARD ---

    const members = store.get('members');

    const issuedCount = circulation.filter(c => c.status === 'Issued').length;
    const overdueCount = circulation.filter(c => {
        return c.status === 'Issued' && new Date(c.dueDate) < new Date();
    }).length;

    // Recent Reviews for Admin
    const recentReviews = reviews.slice(-3).reverse();

    container.innerHTML = `
        <div class="grid-4">
            <div class="card stat-card">
                <div>
                    <div class="stat-label">Total Books</div>
                    <div class="stat-value">${books.length}</div>
                </div>
                <div class="stat-icon bg-blue-light"><i class="fa-solid fa-book"></i></div>
            </div>
            <div class="card stat-card">
                <div>
                    <div class="stat-label">Issued Books</div>
                    <div class="stat-value">${issuedCount}</div>
                </div>
                <div class="stat-icon bg-orange-light"><i class="fa-solid fa-hand-holding-hand"></i></div>
            </div>
            <div class="card stat-card">
                <div>
                    <div class="stat-label">Overdue</div>
                    <div class="stat-value">${overdueCount}</div>
                </div>
                <div class="stat-icon bg-red-light" style="background:#fee2e2; color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
            <div class="card stat-card">
                <div>
                    <div class="stat-label">Total Members</div>
                    <div class="stat-value">${members.length}</div>
                </div>
                <div class="stat-icon bg-purple-light"><i class="fa-solid fa-users"></i></div>
            </div>
        </div>

        <div style="margin-top: 2rem; display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            <div class="card">
                <h3 style="margin-bottom: 1rem;">Recent Transactions</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Book ID</th>
                            <th>Member</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${circulation.slice(-5).reverse().map(c => `
                            <tr>
                                <td>#${c.bookId}</td>
                                <td>${c.memberId}</td>
                                <td>
                                    <span class="badge badge-${c.status === 'Issued' ? 'warning' : 'success'}">${c.status}</span>
                                </td>
                                <td>${c.status === 'Issued' ? c.issueDate : c.returnDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
             <div class="card">
                <h3 style="margin-bottom: 1rem;">Quick Actions</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <button class="btn btn-primary" onclick="navigate('books')"><i class="fa-solid fa-plus"></i> Add New Book</button>
                    <button class="btn btn-secondary" onclick="navigate('members')"><i class="fa-solid fa-user-plus"></i> Register Member</button>
                    <button class="btn btn-secondary" onclick="navigate('circulation')"><i class="fa-solid fa-rotate-left"></i> Issue / Return</button>
                    <button class="btn btn-secondary" onclick="openCheckStatusModal()"><i class="fa-solid fa-magnifying-glass"></i> Check Book Status</button>
                </div>
                
            </div>
        </div>

        <div class="card" style="margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <h3 style="margin: 0;"><i class="fa-solid fa-comments" style="color: #64748b;"></i> Recent Reviews</h3>
                    <span class="badge badge-success">${reviews.length} Total</span>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="printReviews()"><i class="fa-solid fa-print"></i> Print Report</button>
            </div>
            
            ${reviews.length === 0 ? '<p style="color:#94a3b8; font-style: italic;">No reviews have been submitted yet.</p>' : ''}
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
                ${reviews.slice().reverse().map(r => {
        const b = books.find(bk => bk.id == r.bookId) || { title: 'Unknown' };
        const m = members.find(mem => mem.id === r.memberId) || { name: 'Unknown Member' };

        return `
                        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; background: #f8fafc;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                                <div style="font-weight: 600; font-size: 1.1rem; color: #1e293b;">${b.title}</div>
                                <div style="color: #eab308;"><i class="fa-solid fa-star"></i> ${r.rating}</div>
                            </div>
                            <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; font-style: italic;">"${r.text}"</p>
                            <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
                                <div style="width: 30px; height: 30px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #64748b;">
                                    <i class="fa-solid fa-user"></i>
                                </div>
                                <div style="font-size: 0.85rem;">
                                    <div style="font-weight: 500; color: #334155;">${m.name}</div>
                                    <div style="color: #94a3b8; font-size: 0.75rem;">${r.date || 'Recently'}</div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function openWriteReviewModal(bookId) {
    const book = store.get('books').find(b => b.id == bookId);
    if (!book) return;

    const modalSchema = `
        <form onsubmit="handleSubmitReview(event, '${bookId}')">
            <h3 style="margin-bottom: 1rem;">Review: ${book.title}</h3>
            <div class="form-group">
                <label class="form-label">Rating</label>
                <div style="display: flex; gap: 1rem; font-size: 1.5rem; color: #eab308; cursor: pointer;">
                    <select name="rating" class="form-input" style="width: 100%;">
                        <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ (Good)</option>
                        <option value="3">⭐⭐⭐ (Average)</option>
                        <option value="2">⭐⭐ (Poor)</option>
                        <option value="1">⭐ (Terrible)</option>
                    </select>
                </div>
            </div>
             <div class="form-group">
                <label class="form-label">Review</label>
                <textarea name="text" class="form-input" rows="3" required placeholder="What did you think of this book?"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Review</button>
        </form>
    `;
    showModal('Write a Review', modalSchema);
}

function handleSubmitReview(e, bookId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const memberId = sessionStorage.getItem('lms_member_id');

    store.add('reviews', {
        id: Date.now(),
        bookId: bookId,
        memberId: memberId,
        rating: formData.get('rating'),
        text: formData.get('text'),
        date: new Date().toISOString().split('T')[0]
    });

    closeModal();
    alert('Thank you for your review!');
    renderDashboard(document.getElementById('content-area'));
}

// --- Helpers ---

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function renderBooks(container) {
    const books = store.get('books');
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="text" placeholder="Search books..." class="form-input" style="max-width: 300px;">
                    <button class="btn btn-secondary" onclick="importBooksCSV()"><i class="fa-solid fa-file-csv"></i> Import CSV</button>
                    <button class="icon-btn" onclick="downloadBookTemplate()" title="Download CSV Template"><i class="fa-solid fa-download"></i></button>
                    <button class="btn btn-secondary" onclick="printSelectedBooks()"><i class="fa-solid fa-print"></i> Print Selected</button>
                </div>
                <button class="btn btn-primary" onclick="openAddBookModal()">+ Add Book</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;"><input type="checkbox" onchange="toggleSelectAll(this)"></th>
                            <th>Cover</th>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${books.map(book => `
                            <tr>
                                <td><input type="checkbox" class="book-select" value="${book.id}"></td>
                                <td>
                                    <div class="book-thumb" style="background-image: url('${book.image || ''}');">
                                        ${!book.image ? '<i class="fa-solid fa-book"></i>' : ''}
                                    </div>
                                </td>
                                <td>${book.id}</td>
                                <td style="font-weight: 500;">${book.title}</td>
                                <td>${book.author}</td>
                                <td><span class="badge" style="background:#f1f5f9;">${book.category}</span></td>
                                <td>${book.available} / ${book.quantity}</td>
                                <td style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="openEditBookModal('${book.id}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="showBarcode('Book', '${book.id}', '${book.title}')"><i class="fa-solid fa-barcode"></i></button>
                                    <button class="icon-btn" style="color:red;" onclick="deleteBook('${book.id}')"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderMembers(container) {
    const members = store.get('members');
    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="text" placeholder="Search members..." class="form-input" style="max-width: 300px;">
                    <button class="btn btn-secondary" onclick="importMembersCSV()"><i class="fa-solid fa-file-csv"></i> Import CSV</button>
                    <button class="icon-btn" onclick="downloadMemberTemplate()" title="Download CSV Template"><i class="fa-solid fa-download"></i></button>
                    <button class="btn btn-secondary" onclick="openIDCardSettings()"><i class="fa-solid fa-cog"></i> Card Settings</button>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                     <!-- Bulk Actions -->
                    <button class="btn btn-secondary" onclick="printSelectedMemberIDs()"><i class="fa-solid fa-print"></i> Print Selected</button>
                    <button class="btn btn-secondary" onclick="downloadSelectedMemberIDs()"><i class="fa-solid fa-file-zipper"></i> Download ZIP</button>
                    <button class="btn btn-primary" onclick="openAddMemberModal()">+ Register Member</button>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" onchange="toggleSelectAllMembers(this)"></th>
                        <th>Photo</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${members.map(m => `
                        <tr>
                            <td><input type="checkbox" class="member-select" value="${m.id}"></td>
                            <td>
                                <div class="member-thumb" style="background-image: url('${m.photo || ''}');">
                                    ${!m.photo ? '<i class="fa-solid fa-user"></i>' : ''}
                                </div>
                            </td>
                            <td>${m.id}</td>
                            <td style="font-weight: 500;">${m.name}</td>
                            <td>${m.email}</td>
                            <td>${m.type}</td>
                            <td style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="openEditMemberModal('${m.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="showMemberIDCard('${m.id}', '${m.name}', '${m.type}')" title="ID Card"><i class="fa-solid fa-id-card"></i> ID Card</button>
                                <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: #ef4444; border-color: #fee2e2; background: #fef2f2;" onclick="deleteMember('${m.id}')" title="Delete Member"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function printSelectedMemberIDs() {
    const selected = Array.from(document.querySelectorAll('.member-select:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        alert('Please select at least one member to print.');
        return;
    }

    const members = store.get('members').filter(m => selected.includes(m.id));
    const template = localStorage.getItem('lms_id_card_template');
    const bgStyle = template ? `background-image: url('${template}');` : 'background-color: #f8fafc; border: 1px solid #ccc;';

    const modalContent = `
        <div class="id-card-grid-print">
            ${members.map(m => {
        const photoUrl = m.photo ? `url('${m.photo}')` : '';
        const photoIcon = m.photo ? '' : '<i class="fa-solid fa-user"></i>';

        return `
                <div class="id-card" style="${bgStyle}">
                    <div class="id-card-content">
                        <div class="id-photo" style="background-image: ${photoUrl}; background-size: cover; background-position: center;">${photoIcon}</div>
                        <div class="id-right-col">
                            <div class="id-details">
                                <div class="id-name">${m.name}</div>
                                <div class="id-role">${m.type}</div>
                                <div class="id-number">ID: ${m.id}</div>
                            </div>
                            <div class="id-barcode-container">
                                <svg class="member-barcode-svg" data-id="${m.id}"></svg>
                            </div>
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
             <button class="btn btn-primary no-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Cards</button>
        </div>
    `;

    showModal('Print Member ID Cards', modalContent);

    setTimeout(() => {
        members.forEach(m => {
            JsBarcode(`.member-barcode-svg[data-id="${m.id}"]`, m.id, {
                format: "CODE128",
                lineColor: "#000",
                width: 1.5,
                height: 40,
                displayValue: false,
                background: "rgba(255,255,255,0.8)"
            });
        });
    }, 500);
}

async function downloadSelectedMemberIDs() {
    // Check libraries
    if (typeof JSZip === 'undefined') {
        alert('Error: JSZip library not loaded. Please check your internet connection.');
        return;
    }

    const selected = Array.from(document.querySelectorAll('.member-select:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        alert('Please select at least one member to download.');
        return;
    }

    // Show loading
    const btn = document.querySelector('button[onclick="downloadSelectedMemberIDs()"]');
    const oldHtml = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    const zip = new JSZip();
    const members = store.get('members').filter(m => selected.includes(m.id));
    const template = localStorage.getItem('lms_id_card_template');
    const bgStyle = template ? `background-image: url('${template}');` : 'background-color: #f8fafc; border: 1px solid #ccc;';

    // Create hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    for (const m of members) {
        const photoUrl = m.photo ? `url('${m.photo}')` : '';
        const photoIcon = m.photo ? '' : '<i class="fa-solid fa-user"></i>';

        container.innerHTML = `
             <div id="temp-card-${m.id}" class="id-card" style="${bgStyle}; transform: scale(1);">
                <div class="id-card-content">
                    <div class="id-photo" style="background-image: ${photoUrl}; background-size: cover; background-position: center;">${photoIcon}</div>
                    <div class="id-right-col">
                        <div class="id-details">
                            <div class="id-name">${m.name}</div>
                            <div class="id-role">${m.type}</div>
                            <div class="id-number">ID: ${m.id}</div>
                        </div>
                        <div class="id-barcode-container">
                            <svg id="temp-barcode-${m.id}"></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Generate barcode
        JsBarcode(`#temp-barcode-${m.id}`, m.id, {
            format: "CODE128",
            lineColor: "#000",
            width: 1.5,
            height: 40,
            displayValue: false,
            background: "rgba(255,255,255,0.8)"
        });

        // Small delay for rendering
        await new Promise(r => setTimeout(r, 100));

        const element = document.getElementById(`temp-card-${m.id}`);
        try {
            const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
            const filename = `${m.name.replace(/\s+/g, '_')}_${m.id}.png`;
            zip.file(filename, base64Data, { base64: true });
        } catch (err) {
            console.error(`Error capturing card for ${m.name}`, err);
        }
    }

    document.body.removeChild(container);

    // Generate ZIP
    zip.generateAsync({ type: "blob" }).then(function (content) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "Member_ID_Cards.zip";
        link.click();

        // Restore button
        if (btn) btn.innerHTML = oldHtml;
        alert('Download ready! Check your downloads folder.');
    });
}

function renderCirculation(container, filterText = '') {
    const circulation = store.get('circulation');
    const books = store.get('books');
    const members = store.get('members');

    // Filter Logic
    const filtered = circulation.filter(c => {
        if (!filterText) return true;
        return c.bookId.toString().includes(filterText);
    });

    container.innerHTML = `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="text" placeholder="Search by Book ID..." class="form-input" style="max-width: 300px;" 
                        value="${filterText}"
                        oninput="renderCirculation(document.getElementById('content-area'), this.value)">
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="openScanReturnModal()"><i class="fa-solid fa-barcode"></i> Scan Return</button>
                    <button class="btn btn-primary" onclick="openIssueBookModal()">+ Issue Book</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Book ID</th>
                            <th>Book Title</th>
                            <th>Member</th>
                            <th>Issue Date</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.slice().reverse().map(c => {
        const book = books.find(b => b.id == c.bookId) || { title: 'Unknown Book' };
        const member = members.find(m => m.id === c.memberId) || { name: 'Unknown Member' };
        const isOverdue = c.status === 'Issued' && new Date(c.dueDate) < new Date();

        return `
                                <tr>
                                    <td>${c.bookId}</td>
                                    <td>${book.title}</td>
                                    <td>${member.name} <span style="color:#64748b; font-size:0.8rem;">(${c.memberId})</span></td>
                                    <td>${c.issueDate}</td>
                                    <td style="${isOverdue ? 'color: #ef4444; font-weight: 600;' : ''}">${c.dueDate} ${isOverdue ? '(Overdue)' : ''}</td>
                                    <td>
                                        <span class="badge badge-${c.status === 'Issued' ? 'warning' : 'success'}">${c.status}</span>
                                    </td>
                                    <td>
                                        ${c.status === 'Issued' ?
                `<button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="openReturnBookModal(${c.id})">Return</button>` :
                '<span style="color:#94a3b8;">Completed</span>'
            }
                                    </td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Maintain focus if filtering
    if (filterText) {
        const input = container.querySelector('input');
        input.focus();
        // Move cursor to end
        input.setSelectionRange(input.value.length, input.value.length);
    }
}

function openIssueBookModal() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 14);
    const defaultDue = nextWeek.toISOString().split('T')[0];

    const modalSchema = `
        <form onsubmit="handleIssueBook(event)">
            <div class="form-group">
                <label class="form-label">Book ID</label>
                <input type="text" name="bookId" class="form-input" required placeholder="Scan or type Book ID">
            </div>
            <div class="form-group">
                <label class="form-label">Member ID</label>
                <input type="text" name="memberId" class="form-input" required placeholder="Scan or type Member ID">
            </div>
             <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Issue Date</label>
                    <input type="date" name="issueDate" class="form-input" required value="${today}">
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="dueDate" class="form-input" required value="${defaultDue}">
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Issue Book</button>
        </form>
    `;
    showModal('Issue Book', modalSchema);
    // Auto focus first input
    setTimeout(() => document.querySelector('input[name="bookId"]').focus(), 100);
}

function handleIssueBook(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookId = formData.get('bookId').trim();
    const memberId = formData.get('memberId').trim();
    const issueDate = formData.get('issueDate');
    const dueDate = formData.get('dueDate');

    // Validations
    const book = store.get('books').find(b => b.id == bookId);
    if (!book) {
        alert('Book not found!');
        return;
    }
    if (book.available < 1) {
        alert('Book is out of stock!');
        return;
    }

    const member = store.get('members').find(m => m.id === memberId);
    if (!member) {
        alert('Member not found!');
        return;
    }

    // Check if member already has this book issued
    const existingIssue = store.get('circulation').find(c => c.bookId == bookId && c.memberId === memberId && c.status === 'Issued');
    if (existingIssue) {
        alert('Member already has this book issued!');
        return;
    }

    // Add record
    store.add('circulation', {
        id: Math.floor(Math.random() * 100000),
        bookId: book.id, // Use actual ID type from found book
        memberId: member.id,
        issueDate,
        dueDate,
        returnDate: null,
        status: 'Issued'
    });

    // Update Book Stock
    store.update('books', 'id', book.id, { available: book.available - 1 });

    closeModal();
    renderCirculation(document.getElementById('content-area'));
}

function openScanReturnModal() {
    const modalSchema = `
        <form onsubmit="handleScanReturn(event)">
            <div class="form-group">
                <label class="form-label">Scan Book ID to Return</label>
                <input type="text" name="bookId" class="form-input" required placeholder="Book ID" autofocus>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Find Transaction</button>
        </form>
    `;
    showModal('Scan & Return', modalSchema);
    setTimeout(() => document.querySelector('input[name="bookId"]').focus(), 100);
}

function handleScanReturn(e) {
    e.preventDefault();
    const bookId = new FormData(e.target).get('bookId').trim();

    // Find active transactions
    const issues = store.get('circulation').filter(c => c.bookId == bookId && c.status === 'Issued');

    if (issues.length === 0) {
        alert('No active issued record found for Book ID: ' + bookId);
        e.target.reset();
        return;
    }

    if (issues.length === 1) {
        // Perfect case
        closeModal();
        openReturnBookModal(issues[0].id);
    } else {
        // Multiple issues (edge case)
        // Show list to select
        const members = store.get('members');
        const listHtml = issues.map(c => {
            const m = members.find(mem => mem.id === c.memberId);
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #eee; padding:0.5rem; margin-bottom:0.5rem; border-radius:4px;">
                    <div>
                        <strong>${m ? m.name : c.memberId}</strong> <br>
                        <small>Due: ${c.dueDate}</small>
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="closeModal(); openReturnBookModal(${c.id})">Select</button>
                </div>
            `;
        }).join('');

        showModal('Multiple Matches Found', `
            <div style="margin-bottom:1rem;">Multiple active issues found for Book ID <strong>${bookId}</strong>. Please select:</div>
            ${listHtml}
        `);
    }
}

function openReturnBookModal(circulationId) {
    const record = store.get('circulation').find(c => c.id === circulationId);
    if (!record) return;

    const book = store.get('books').find(b => b.id == record.bookId) || { title: 'Unknown', id: record.bookId };
    const member = store.get('members').find(m => m.id === record.memberId) || { name: 'Unknown', id: record.memberId };
    const isOverdue = new Date(record.dueDate) < new Date();

    const modalSchema = `
        <form onsubmit="handleReturnBook(event, ${circulationId})">
            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b;">Book Title</div>
                        <div style="font-weight: 600;">${book.title}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">Book ID</div>
                        <div style="font-weight: 500;">${book.id}</div>
                    </div>
                     <div>
                        <div style="font-size: 0.8rem; color: #64748b;">Borrowed By</div>
                        <div style="font-weight: 600;">${member.name}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">Due Date</div>
                        <div style="font-weight: 600; color: ${isOverdue ? '#ef4444' : 'inherit'}">${record.dueDate} ${isOverdue ? '(Overdue)' : ''}</div>
                    </div>
                </div>
            </div>
            
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; color: #047857; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                   Confirming return will restore <strong>+1 stock</strong>.
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">Confirm Return</button>
        </form>
    `;
    showModal('Return Book', modalSchema);
}

function handleReturnBook(e, circulationId) {
    e.preventDefault();
    const record = store.get('circulation').find(c => c.id === circulationId);
    if (!record) return;

    // Update Record
    store.update('circulation', 'id', circulationId, {
        status: 'Returned',
        returnDate: new Date().toISOString().split('T')[0]
    });

    // Update Book Stock
    const book = store.get('books').find(b => b.id == record.bookId);
    if (book) {
        store.update('books', 'id', book.id, { available: book.available + 1 });
    }

    closeModal();
    renderCirculation(document.getElementById('content-area'));
}

function openEditBookModal(id) {
    const book = store.get('books').find(b => b.id == id);
    if (!book) return;

    const modalSchema = `
        <form onsubmit="handleEditBook(event, '${id}')">
            <div class="form-group">
                <label class="form-label">Cover Image (Leave empty to keep current)</label>
                <input type="file" name="image" accept="image/*" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-input" required value="${book.title}">
            </div>
            <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Author</label>
                    <input type="text" name="author" class="form-input" required value="${book.author}">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" name="category" class="form-input" required value="${book.category}">
                </div>
            </div>
            <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                 <div class="form-group">
                    <label class="form-label">Book ID</label>
                    <input type="text" name="id" class="form-input" value="${book.id}" disabled style="background: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="form-group">
                    <label class="form-label">Total Quantity</label>
                    <input type="number" name="quantity" class="form-input" required value="${book.quantity}">
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Save Changes</button>
        </form>
    `;
    showModal('Edit Book Details', modalSchema);
}

async function handleEditBook(e, originalId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('image');

    // Get existing book to preserve image if not updated
    const existingBook = store.get('books').find(b => b.id == originalId);
    let imageBase64 = existingBook.image;

    if (file && file.size > 0) {
        imageBase64 = await readFileAsBase64(file);
    }

    const updates = {
        title: formData.get('title'),
        author: formData.get('author'),
        category: formData.get('category'),
        quantity: parseInt(formData.get('quantity')),
        // Recalculate available based on new quantity vs currently issued
        available: parseInt(formData.get('quantity')) - (existingBook.quantity - existingBook.available),
        image: imageBase64
    };

    store.update('books', 'id', originalId, updates);
    closeModal();
    renderBooks(document.getElementById('content-area'));
}

function openEditMemberModal(id) {
    const member = store.get('members').find(m => m.id === id);
    if (!member) return;

    const modalSchema = `
        <form onsubmit="handleEditMember(event, '${id}')">
             <div class="form-group">
                <label class="form-label">Profile Photo (Leave empty to keep current)</label>
                <input type="file" name="photo" accept="image/*" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" name="name" class="form-input" required value="${member.name}">
            </div>
             <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-input" required value="${member.email}">
            </div>
            <div class="grid-3" style="grid-template-columns: 1fr 1fr; gap: 1rem;">
                 <div class="form-group">
                    <label class="form-label">Member ID</label>
                    <input type="text" name="id" class="form-input" value="${member.id}" disabled style="background: #f1f5f9; cursor: not-allowed;">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select name="type" class="form-input">
                        <option ${member.type === 'Student' ? 'selected' : ''}>Student</option>
                        <option ${member.type === 'Faculty' ? 'selected' : ''}>Faculty</option>
                        <option ${member.type === 'Staff' ? 'selected' : ''}>Staff</option>
                    </select>
                </div>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Save Changes</button>
        </form>
    `;
    showModal('Edit Member Details', modalSchema);
}

async function handleEditMember(e, originalId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('photo');

    const existingMember = store.get('members').find(m => m.id === originalId);
    let photoBase64 = existingMember.photo;

    if (file && file.size > 0) {
        photoBase64 = await readFileAsBase64(file);
    }

    const updates = {
        name: formData.get('name'),
        email: formData.get('email'),
        type: formData.get('type'),
        photo: photoBase64
    };

    store.update('members', 'id', originalId, updates);
    closeModal();
    renderMembers(document.getElementById('content-area'));
}


function openCheckStatusModal() {
    const modalSchema = `
        <form onsubmit="handleCheckStatus(event)">
            <div class="form-group">
                <label class="form-label">Book ID</label>
                <input type="text" name="bookId" class="form-input" required placeholder="Scan or type ID (e.g. BK-101)" autofocus>
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Check Status</button>
        </form>
        <div id="check-status-result" style="margin-top: 1.5rem;"></div>
    `;
    showModal('Check Book Status', modalSchema);

    // Autofocus helper
    setTimeout(() => {
        const input = document.querySelector('input[name="bookId"]');
        if (input) input.focus();
    }, 100);
}

function handleCheckStatus(e) {
    e.preventDefault();
    // Allow text IDs, so no parseInt
    const bookId = new FormData(e.target).get('bookId').trim();
    const resultContainer = document.getElementById('check-status-result');
    // Loose equality or string comparison
    const book = store.get('books').find(b => b.id == bookId);

    if (!book) {
        resultContainer.innerHTML = `<div class="card" style="background: #fee2e2; color: #b91c1c; text-align: center;">Book ID <strong>${bookId}</strong> not found.</div>`;
        setTimeout(() => {
            const input = e.target.querySelector('input[name="bookId"]');
            if (input) {
                input.value = '';
                input.focus();
            }
        }, 1000);
        return;
    }

    const issueRecord = store.get('circulation').find(c => c.bookId == bookId && c.status === 'Issued');
    const member = issueRecord ? store.get('members').find(m => m.id === issueRecord.memberId) : null;

    // Status Badge Logic
    const statusBadge = issueRecord
        ? `<span class="badge badge-warning" style="font-size: 1rem; padding: 0.5rem 1rem;">Issued</span>`
        : `<span class="badge badge-success" style="font-size: 1rem; padding: 0.5rem 1rem;">Available</span>`;

    // Holder Info Logic
    let holderInfo = '';
    if (issueRecord && member) {
        const isOverdue = new Date(issueRecord.dueDate) < new Date();
        holderInfo = `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                <h4 style="margin-bottom: 0.5rem; color: #64748b; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Borrowed By</h4>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="member-thumb" style="width: 50px; height: 50px; font-size: 1.5rem; background-image: url('${member.photo || ''}');">
                        ${!member.photo ? '<i class="fa-solid fa-user"></i>' : ''}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 1.1rem;">${member.name}</div>
                        <div style="color: #64748b;">ID: ${member.id}</div> 
                    </div>
                </div>
                <div style="margin-top: 1rem; display: flex; justify-content: space-between; background: #f8fafc; padding: 0.75rem; border-radius: 6px;">
                    <div>
                        <div style="font-size: 0.8rem; color: #64748b;">Issued Date</div>
                        <div style="font-weight: 500;">${issueRecord.issueDate}</div>
                    </div>
                     <div>
                        <div style="font-size: 0.8rem; color: #64748b;">Due Date</div>
                        <div style="font-weight: 500; color: ${isOverdue ? '#ef4444' : 'inherit'};">${issueRecord.dueDate} ${isOverdue ? '(Overdue)' : ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    resultContainer.innerHTML = `
        <div class="card" style="border: 1px solid #e2e8f0; box-shadow: none;">
            <div style="display: flex; gap: 1.5rem;">
                <div class="book-thumb" style="width: 80px; height: 120px; font-size: 2rem; border-radius: 6px; flex-shrink: 0; background-image: url('${book.image || ''}');">
                     ${!book.image ? '<i class="fa-solid fa-book"></i>' : ''}
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">${book.title}</div>
                    <div style="color: #64748b; margin-bottom: 0.5rem;">${book.author}</div>
                    <div style="margin-bottom: 1rem;">${statusBadge}</div>
                </div>
            </div>
            ${holderInfo}
        </div>
    `;

    // Reset input for next scan
    e.target.reset();
    setTimeout(() => {
        const input = e.target.querySelector('input[name="bookId"]');
        if (input) input.focus();
    }, 100);
}


// --- Initialization ---

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
});

// Start on Dashboard
// Start on Dashboard
(async () => {
    try {
        await store.init();
    } catch (e) {
        console.error('Init failed', e);
    }
    navigate('dashboard');
})();


// --- Helpers & Utilities ---

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
            return obj;
        }, {});
    });
}

async function importBooksCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        try {
            const data = parseCSV(text);
            let count = 0;
            data.forEach(row => {
                if (row.title) {
                    store.add('books', {
                        id: Math.floor(Math.random() * 10000), // Better ID gen in real app
                        title: row.title,
                        author: row.author || 'Unknown',
                        category: row.category || 'General',
                        quantity: parseInt(row.quantity) || 1,
                        available: parseInt(row.quantity) || 1,
                        image: ''
                    });
                    count++;
                }
            });
            alert(`Successfully imported ${count} books!`);
            renderBooks(document.getElementById('content-area'));
        } catch (err) {
            alert('Error parsing CSV. Please ensure format is: Title, Author, Category, Quantity');
            console.error(err);
        }
    };
    input.click();
}

async function importMembersCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        try {
            const data = parseCSV(text);
            let count = 0;
            data.forEach(row => {
                if (row.name) {
                    const id = 'M' + Math.floor(Math.random() * 10000);
                    store.add('members', {
                        id: id,
                        name: row.name,
                        email: row.email || '',
                        type: row.type || 'Student',
                        joined: new Date().toISOString().split('T')[0],
                        photo: ''
                    });
                    count++;
                }
            });
            alert(`Successfully imported ${count} members!`);
            renderMembers(document.getElementById('content-area'));
        } catch (err) {
            alert('Error parsing CSV. Please ensure format is: Name, Email, Type');
            console.error(err);
        }
    };
    input.click();
}

function downloadBookTemplate() {
    const csvContent = "Title,Author,Category,Quantity\nExample Book Title,Author Name,Fiction,5";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function downloadMemberTemplate() {
    const csvContent = "Name,Email,Type\nJohn Doe,john@example.com,Student";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'member_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function showModal(title, content) {
    const modalContainer = document.getElementById('modal-container');
    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="if(event.target === this) closeModal()">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">${title}</div>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        store.delete('books', 'id', id);
        renderBooks(document.getElementById('content-area'));
    }
}

function showBarcode(type, id, label) {
    const modalContent = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
            <svg id="barcode"></svg>
            <div style="margin-top: 1rem; font-weight: 500;">${type}: ${label}</div>
            <button class="btn btn-primary no-print" onclick="window.print()" style="margin-top: 2rem;"><i class="fa-solid fa-print"></i> Print</button>
        </div>
    `;
    showModal(`${type} Barcode`, modalContent);

    setTimeout(() => {
        JsBarcode("#barcode", id, {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 60,
            displayValue: true
        });
    }, 100);
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.book-select');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

function toggleSelectAllMembers(checkbox) {
    const checkboxes = document.querySelectorAll('.member-select');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

function printSelectedBooks() {
    const selected = Array.from(document.querySelectorAll('.book-select:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        alert('Please select at least one book to print.');
        return;
    }

    const books = store.get('books').filter(b => selected.includes(b.id.toString()));

    const modalContent = `
        <div class="barcode-grid">
            ${books.map(b => `
                <div class="barcode-item">
                    <div class="barcode-title">${b.title}</div>
                    <svg class="barcode-svg" data-id="${b.id}"></svg>
                    <div class="barcode-id">${b.id}</div>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 1rem;">
             <button class="btn btn-primary no-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Labels</button>
        </div>
    `;

    showModal('Print Book Labels', modalContent);

    setTimeout(() => {
        books.forEach(b => {
            JsBarcode(`.barcode-svg[data-id="${b.id}"]`, b.id.toString(), {
                format: "CODE128",
                width: 1.5,
                height: 30,
                displayValue: false,
                margin: 0
            });
        });
    }, 100);
}

function showMemberIDCard(id, name, type) {
    const template = localStorage.getItem('lms_id_card_template');
    const member = store.get('members').find(m => m.id === id);
    const photoUrl = member && member.photo ? `url('${member.photo}')` : '';
    const photoIcon = member && member.photo ? '' : '<i class="fa-solid fa-user"></i>';
    const bgStyle = template ? `background-image: url('${template}');` : 'background-color: #f8fafc; border: 1px solid #ccc;';

    const modalContent = `
        <div class="id-card-container">
            <div class="id-card" style="${bgStyle}">
                <div class="id-card-content">
                    <div class="id-photo" style="background-image: ${photoUrl}; background-size: cover; background-position: center;">${photoIcon}</div>
                    <div class="id-right-col">
                        <div class="id-details">
                            <div class="id-name">${name}</div>
                            <div class="id-role">${type}</div>
                            <div class="id-number">ID: ${id}</div>
                        </div>
                        <div class="id-barcode-container">
                            <svg id="card-barcode"></svg>
                        </div>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary no-print" onclick="window.print()" style="margin-top: 1rem;"><i class="fa-solid fa-print"></i> Print Card</button>
        </div>
    `;

    showModal('Member ID Card', modalContent);

    setTimeout(() => {
        JsBarcode("#card-barcode", id, {
            format: "CODE128",
            lineColor: "#000",
            width: 1.5,
            height: 40,
            displayValue: false,
            background: "rgba(255,255,255,0.8)"
        });
    }, 100);
}

function printSelectedMemberIDs() {
    const selected = Array.from(document.querySelectorAll('.member-select:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        alert('Please select at least one member to print.');
        return;
    }

    const members = store.get('members').filter(m => selected.includes(m.id));
    const template = localStorage.getItem('lms_id_card_template');
    const bgStyle = template ? `background-image: url('${template}');` : 'background-color: #f8fafc; border: 1px solid #ccc;';

    const modalContent = `
        <div class="id-card-grid-print">
            ${members.map(m => {
        const photoUrl = m.photo ? `url('${m.photo}')` : '';
        const photoIcon = m.photo ? '' : '<i class="fa-solid fa-user"></i>';
        const bgStyle = template ? `background-image: url('${template}');` : 'background-color: #f8fafc; border: 1px solid #ccc;';

        return `
                <div class="id-card" style="${bgStyle}">
                    <div class="id-card-content">
                        <div class="id-photo" style="background-image: ${photoUrl}; background-size: cover; background-position: center;">${photoIcon}</div>
                        <div class="id-details">
                            <div class="id-name">${m.name}</div>
                            <div class="id-role">${m.type}</div>
                            <div class="id-number">ID: ${m.id}</div>
                        </div>
                        <div class="id-barcode-container">
                            <svg class="member-barcode-svg" data-id="${m.id}"></svg>
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
             <button class="btn btn-primary no-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Cards</button>
        </div>
    `;

    showModal('Print Member ID Cards', modalContent);

    setTimeout(() => {
        members.forEach(m => {
            JsBarcode(`.member-barcode-svg[data-id="${m.id}"]`, m.id, {
                format: "CODE128",
                lineColor: "#000",
                width: 1.5,
                height: 40,
                displayValue: false,
                background: "rgba(255,255,255,0.8)"
            });
        });
    }, 100);
}

function openIDCardSettings() {
    const currentTemplate = localStorage.getItem('lms_id_card_template') || '';

    const modalContent = `
        <form onsubmit="handleSaveIDTemplate(event)">
            <div class="form-group">
                <label class="form-label">Upload Custom Background (Landscape)</label>
                <input type="file" name="template" accept="image/*" class="form-input">
                <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">Recommended size: 350x220px or similar ratio.</p>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <label class="form-label">Current Preview:</label>
                <div class="id-card" style="background-image: url('${currentTemplate}'); width: 100%; max-width: 350px; height: 220px; background-color: #eee; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center;">
                    ${!currentTemplate ? '<span style="color: #999">No custom background set</span>' : ''}
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%;">Save Template</button>
            <button type="button" class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;" onclick="clearIDTemplate()">Reset to Default</button>
        </form>
    `;
    showModal('ID Card Settings', modalContent);
}

async function handleSaveIDTemplate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('template');

    if (file && file.size > 0) {
        const base64 = await readFileAsBase64(file);
        localStorage.setItem('lms_id_card_template', base64);
        alert('Template saved successfully!');
        closeModal();
    } else {
        alert('Please select an image file.');
    }
}

function clearIDTemplate() {
    localStorage.removeItem('lms_id_card_template');
    alert('Template reset to default.');
    closeModal();
}

function openAddBookModal() {
    const modalSchema = `
        <form onsubmit="handleAddBook(event)">
            <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" name="title" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Author</label>
                <input type="text" name="author" class="form-input" required>
            </div>
            <div class="grid-2" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select name="category" class="form-input">
                        <option>Fiction</option>
                        <option>Non-Fiction</option>
                        <option>Technology</option>
                        <option>Science</option>
                        <option>History</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Quantity</label>
                    <input type="number" name="quantity" class="form-input" required min="1" value="1">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Cover Image</label>
                <input type="file" name="image" accept="image/*" class="form-input">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Add Book</button>
        </form>
    `;
    showModal('Add New Book', modalSchema);
}

async function handleAddBook(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Generate ID
    const books = store.get('books');
    const newId = books.length > 0 ? Math.max(...books.map(b => parseInt(b.id))) + 1 : 101;

    const book = {
        id: newId,
        title: formData.get('title'),
        author: formData.get('author'),
        category: formData.get('category'),
        quantity: parseInt(formData.get('quantity')),
        available: parseInt(formData.get('quantity')),
        image: null
    };

    const file = formData.get('image');
    if (file && file.size > 0) {
        book.image = await readFileAsBase64(file);
    }

    store.add('books', book);
    closeModal();
    renderBooks(document.getElementById('content-area'));
}

function openAddMemberModal() {
    const modalSchema = `
        <form onsubmit="handleAddMember(event)">
             <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-input" required>
            </div>
             <div class="form-group">
                <label class="form-label">Type</label>
                <select name="type" class="form-input">
                    <option>Student</option>
                    <option>Faculty</option>
                    <option>Staff</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Profile Photo</label>
                <input type="file" name="photo" accept="image/*" class="form-input">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Register Member</button>
        </form>
    `;
    showModal('Register New Member', modalSchema);
}

async function handleAddMember(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Generate ID (M + random 3 digits)
    const newId = 'M' + Math.floor(100 + Math.random() * 900);

    const member = {
        id: newId,
        name: formData.get('name'),
        email: formData.get('email'),
        type: formData.get('type'),
        joined: new Date().toISOString().split('T')[0],
        photo: null
    };

    const file = formData.get('photo');
    if (file && file.size > 0) {
        member.photo = await readFileAsBase64(file);
    }

    store.add('members', member);
    closeModal();
    renderMembers(document.getElementById('content-area'));
}

// --- UI Updates ---

function updateSidebarProfile() {
    const role = sessionStorage.getItem('lms_role');
    const memberId = sessionStorage.getItem('lms_member_id');
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');

    if (!avatarEl || !nameEl || !roleEl) return;

    if (role === 'member' && memberId) {
        const member = store.get('members').find(m => m.id === memberId);
        if (member) {
            nameEl.innerText = member.name;
            roleEl.innerText = 'Member';
            avatarEl.innerText = member.name.charAt(0).toUpperCase();
            avatarEl.style.background = '#3b82f6'; // Blue for members
            avatarEl.style.color = 'white';
        }
    } else {
        // Default Admin
        nameEl.innerText = 'Admin User';
        roleEl.innerText = 'Librarian';
        avatarEl.innerText = 'A';
        avatarEl.style.background = '#e2e8f0';
        avatarEl.style.color = '#1e293b';
    }
}

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    store.load();
    updateSidebarProfile();

    const token = sessionStorage.getItem('lms_token');
    const role = sessionStorage.getItem('lms_role');

    if (token && role) {
        navigate(role === 'member' ? 'dashboard' : 'books');
    } else {
        renderLogin();
    }
});
