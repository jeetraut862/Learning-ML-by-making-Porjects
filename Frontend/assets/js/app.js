/* ========== JS: Shared header/footer, router, storage, pages, interactivity ========== */

const App = (() => {
  /* ---------- Utilities ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmtDate = ts => new Date(ts).toLocaleString();
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------- Storage ---------- */
  const STORAGE_KEY = 'donations';
  const USER_KEY = 'currentUser'; // for signin

  const readDonations = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  };
  const writeDonations = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  const readUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch { return null; }
  };
  const writeUser = (obj) => localStorage.setItem(USER_KEY, JSON.stringify(obj));
  const clearUser = () => localStorage.removeItem(USER_KEY);

  /* ---------- Header + Footer Injection ---------- */
const headerHTML = `
  <div class="header">
    <div class="container nav">
      <!-- Brand -->
      <a class="brand" href="index.html">
        <span class="logo">🍲</span><span>FoodCare</span>
      </a>

      <!-- Desktop nav -->
      <nav class="navlinks" role="navigation" aria-label="Main">
        <a href="index.html">Home</a>
        <a href="donate.html">Donate</a>
        <a href="track.html">Track</a>
        <a href="about.html">About</a>
        <a href="contact.html">Contact</a>
        <a href="signup.html">Signup</a>
      </nav>

      <!-- Single auth section for both desktop/mobile -->
      <div class="nav-auth">
        <a class="nav-cta signin-link" href="signin.html">
          <span class="sign-in-icon">🔒</span> Sign In
        </a>
        <a class="nav-cta profile-link" href="profile.html" style="display:none;">
          <span class="sign-in-icon">👤</span> Profile
        </a>
        <button class="nav-cta signout-btn" style="display:none;">🚪 Sign Out</button>
      </div>

      <!-- Burger for mobile -->
      <button class="burger" aria-label="Toggle menu" title="Menu">☰</button>
    </div>

    <!-- Mobile menu -->
    <div class="mobile-menu" id="mobileMenu">
      <a href="index.html">Home</a>
      <a href="donate.html">Donate</a>
      <a href="track.html">Track</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="signup.html">Signup</a>
      <!-- Auth buttons will be dynamically added here -->
      <div class="mobile-auth"></div>
    </div>
  </div>
`;

  const footerHTML = `
    <footer class="footer">
      <div class="container inner">
        <div>© ${new Date().getFullYear()} FoodCare — Made with ❤️</div>
        <div><a href="about.html">About</a> · <a href="contact.html">Contact</a></div>
      </div>
    </footer>
  `;

  function injectChrome() {
  // Instead of creating new divs, inject into existing #header and #footer
  const headerMount = $('#header');
  if (headerMount) headerMount.innerHTML = headerHTML;

  const footerMount = $('#footer');
  if (footerMount) footerMount.innerHTML = footerHTML;

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  $$('.navlinks a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });

  // Mobile menu toggle
  const burger = $('.burger');
  const mobile = $('#mobileMenu');
  burger?.addEventListener('click', () => mobile?.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (!mobile?.contains(e.target) && e.target !== burger) mobile?.classList.remove('open');
  });

  // Auth UI
  updateAuthUI();
  $$('.signout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      clearUser ();
      updateAuthUI();
      toast('Signed out');
      if (location.pathname.includes('profile.html')) {
        location.href = 'signin.html';
      }
    });
  });
}


  function updateAuthUI() {
    const user = readUser();
    const signedIn = !!user;

    $$('.signin-link').forEach(el => el.style.display = signedIn ? 'none' : '');
    $$('.profile-link').forEach(el => el.style.display = signedIn ? '' : 'none');
    $$('.signout-btn').forEach(el => el.style.display = signedIn ? '' : 'none');
  }

  /* ---------- Toasts ---------- */
  let toastEl;
  function toast(msg = 'Saved!', ms = 2200) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* ---------- Profile Page ---------- */
  function initProfile() {
    const user = readUser();
    if (!user) {
      location.href = 'signin.html';
      return;
    }

    const nameEl = $('#profileName');
    const emailEl = $('#profileEmail');
    const roleEl = $('#profileRole');

    nameEl.textContent = user.name || '—';
    emailEl.textContent = user.email || '—';
    roleEl.textContent = user.role || '—';
  }

  /* ---------- Page Router ---------- */
  function initByPage() {
    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    if (page === 'donate') initDonate();
    if (page === 'track') initTrack();
    if (page === 'about') initAbout();
    if (page === 'contact') initContact();
    if (page === 'profile') initProfile();
  }

  /* ---------- Boot ---------- */
  function boot() {
    injectChrome();
    initByPage();
  }

  return { boot, writeUser, readUser, clearUser };
})();

document.addEventListener('DOMContentLoaded', App.boot);


/* ---------- Page Initializers ---------- */
function initHome() {
  // Donor highlights
  const donations = readDonations();
  const donors = [...new Set(donations.map(d => d.donorName))];
  
  $('#donorWeek')?.textContent = donors[0] || 'No donations yet';
  $('#donorMonth')?.textContent = donors.slice(-1)[0] || 'No donations yet';
}

function initDonate() {
  const form = $('#donationForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const donation = {
      id: uid(),
      donorName: formData.get('donorName'),
      title: formData.get('title'),
      qty: parseInt(formData.get('qty')),
      category: formData.get('category'),
      expiry: formData.get('expiry'),
      address: formData.get('address'),
      notes: formData.get('notes'),
      status: 'available',
      created: Date.now()
    };

    const donations = readDonations();
    donations.push(donation);
    writeDonations(donations);
    
    toast('Donation saved successfully!');
    form.reset();
    
    // Show preview
    $('#donationPreview').innerHTML = `
      <div class="card">
        <h3>✅ Donation Created</h3>
        <p><strong>${donation.title}</strong> (${donation.qty} items)</p>
        <p>Pickup: ${donation.address}</p>
      </div>
    `;
  });
}

function initTrack() {
  const donations = readDonations();
  const tbody = $('#tblBody');
  
  function renderTable(data = donations) {
    if (!tbody) return;
    
    tbody.innerHTML = data.map(d => `
      <tr>
        <td><strong>${d.title}</strong><br><small class="text-muted">${d.donorName}</small></td>
        <td>${d.qty}</td>
        <td>${d.category}</td>
        <td>${d.expiry || '—'}</td>
        <td>${d.address}</td>
        <td><span class="status-${d.status}">${d.status}</span></td>
        <td>${fmtDate(d.created)}</td>
        <td>
          <button class="btn" onclick="updateStatus('${d.id}')">Update</button>
        </td>
      </tr>
    `).join('');
  }

  // Initial render
  renderTable();
  
  // Filters
  $('#filterStatus')?.addEventListener('change', applyFilters);
  $('#filterCategory')?.addEventListener('change', applyFilters);
  $('#search')?.addEventListener('input', applyFilters);
  $('#sort')?.addEventListener('change', applyFilters);
  
  function applyFilters() {
    let filtered = [...donations];
    
    const status = $('#filterStatus')?.value;
    const category = $('#filterCategory')?.value;
    const search = $('#search')?.value.toLowerCase();
    const sort = $('#sort')?.value;
    
    if (status) filtered = filtered.filter(d => d.status === status);
    if (category) filtered = filtered.filter(d => d.category === category);
    if (search) {
      filtered = filtered.filter(d => 
        d.title.toLowerCase().includes(search) ||
        d.donorName.toLowerCase().includes(search) ||
        d.address.toLowerCase().includes(search)
      );
    }
    
    // Sort
    if (sort === 'new') filtered.sort((a, b) => b.created - a.created);
    if (sort === 'old') filtered.sort((a, b) => a.created - b.created);
    if (sort === 'qty') filtered.sort((a, b) => b.qty - a.qty);
    
    renderTable(filtered);
  }
  
  // Global function for status updates
  window.updateStatus = (id) => {
    const donations = readDonations();
    const donation = donations.find(d => d.id === id);
    if (donation) {
      const statuses = ['available', 'reserved', 'picked'];
      const currentIndex = statuses.indexOf(donation.status);
      donation.status = statuses[(currentIndex + 1) % statuses.length];
      writeDonations(donations);
      renderTable();
      toast(`Status updated to ${donation.status}`);
    }
  };
}

function initAbout() {
  const donations = readDonations();
  const totalMeals = donations.reduce((sum, d) => sum + d.qty, 0);
  const uniqueDonors = new Set(donations.map(d => d.donorName)).size;
  const lastDonation = donations.length > 0 ? 
    fmtDate(Math.max(...donations.map(d => d.created))) : '—';
  
  $('#statMeals').textContent = totalMeals;
  $('#statDonors').textContent = uniqueDonors;
  $('#statLast').textContent = lastDonation;
}

function initContact() {
  const form = $('#contactForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Message sent! We\'ll get back to you soon.');
    form.reset();
  });
}
