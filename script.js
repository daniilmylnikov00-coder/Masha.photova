import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://olezthiuxjcuveduyxsg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_5yXVeHuf370Cq4cnlyhTgQ_W6tknQzh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_PASSWORD = "MashaAdmin2026"; 

document.addEventListener("DOMContentLoaded", () => {
    
    // === 0. LIGHTBOX ДЛЯ ФОТО ===
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `<span class="lightbox-close">&times;</span><img src="" alt="Full view">`;
    document.body.appendChild(lightbox);
    const lightboxImg = lightbox.querySelector('img');
    
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) lightbox.classList.remove('active');
    });

    // === 1. АНИМАЦИИ ===
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('appear');
            observer.unobserve(entry.target);
        });
    }, appearOptions);
    faders.forEach(fader => appearOnScroll.observe(fader));

    // === 2. ЛОГИКА ВХОДА ===
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const submitLogin = document.getElementById('submitLogin');
    const passwordInput = document.getElementById('passwordInput');
    const adminUploadZone = document.getElementById('admin-upload-zone');
    const editPricingBtn = document.getElementById('editPricingBtn');

    if (localStorage.getItem('isAdmin') === 'true') {
        if(adminUploadZone) adminUploadZone.style.display = 'block';
        if(editPricingBtn) editPricingBtn.style.display = 'block';
        if(loginBtn) loginBtn.style.display = 'none';
    }

    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    if (closeLogin) closeLogin.addEventListener('click', () => loginModal.style.display = 'none');

    if (submitLogin) {
        submitLogin.addEventListener('click', () => {
            if (passwordInput.value === ADMIN_PASSWORD) {
                localStorage.setItem('isAdmin', 'true');
                if(adminUploadZone) adminUploadZone.style.display = 'block';
                if(editPricingBtn) editPricingBtn.style.display = 'block';
                loginModal.style.display = 'none';
                if(loginBtn) loginBtn.style.display = 'none';
            } else {
                alert("Wrong password!");
                passwordInput.value = '';
            }
        });
    }

    // === 3. ЗАГРУЗКА ФОТО ===
    const uploadModal = document.getElementById('uploadModal');
    const closeUpload = document.getElementById('closeUpload');
    const uploadBtn = document.getElementById('uploadBtn'); 
    const doUploadBtn = document.getElementById('doUploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadFile = document.getElementById('uploadFile');
    const uploadCategory = document.getElementById('uploadCategory');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            uploadModal.style.display = 'block';
            if(uploadStatus) uploadStatus.textContent = '';
            if(uploadFile) uploadFile.value = '';
        });
    }
    if (closeUpload) closeUpload.addEventListener('click', () => uploadModal.style.display = 'none');

    if (doUploadBtn) {
        doUploadBtn.addEventListener('click', async () => {
            const file = uploadFile.files[0];
            const category = uploadCategory.value;
            if (!file) return uploadStatus.textContent = "Please select a file.";

            uploadStatus.textContent = "Uploading...";
            uploadStatus.style.color = "black";
            doUploadBtn.disabled = true;

            try {
                const fileName = `${category}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { error } = await supabase.storage.from('photos').upload(fileName, file);
                if (error) throw error;
                uploadStatus.textContent = "Success!";
                uploadStatus.style.color = "green";
                loadGallery('portraits', 'gallery-portraits');
                loadGallery('couples', 'gallery-couples');
                loadGallery('brand', 'gallery-brand');
                setTimeout(() => { uploadModal.style.display = 'none'; }, 1500);
            } catch (error) {
                uploadStatus.textContent = "Error: " + error.message;
                uploadStatus.style.color = "red";
            } finally {
                doUploadBtn.disabled = false;
            }
        });
    }

    // === 4. ОТОБРАЖЕНИЕ ФОТО ===
    async function loadGallery(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const { data: files } = await supabase.storage.from('photos').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        const filteredFiles = files.filter(f => f.name.startsWith(category + '_'));
        if (filteredFiles.length === 0) {
            container.innerHTML = '<p style="padding: 20px; color: #888;">No photos yet.</p>';
            return;
        }
        container.innerHTML = ''; 
        filteredFiles.forEach(file => {
            const { data } = supabase.storage.from('photos').getPublicUrl(file.name);
            const img = document.createElement('img');
            img.src = data.publicUrl;
            img.addEventListener('click', () => {
                lightboxImg.src = data.publicUrl;
                lightbox.classList.add('active');
            });
            container.appendChild(img);
        });
    }
    loadGallery('portraits', 'gallery-portraits');
    loadGallery('couples', 'gallery-couples');
    loadGallery('brand', 'gallery-brand');

    // === 5. РЕДАКТИРОВАНИЕ ЦЕН (БЛОК INVESTMENT) ===
    const pricingContainer = document.getElementById('pricing-container');
    const packageModal = document.getElementById('packageModal');
    const closePackage = document.getElementById('closePackage');
    const savePackageBtn = document.getElementById('savePackageBtn');

    if (editPricingBtn) editPricingBtn.addEventListener('click', () => packageModal.style.display = 'block');
    if (closePackage) closePackage.addEventListener('click', () => packageModal.style.display = 'none');

    // Загрузка цен из базы
    async function loadPricing() {
        if(!pricingContainer) return;
        const { data: services, error } = await supabase.from('services').select('*').order('id', { ascending: true });
        if (error || services.length === 0) {
            pricingContainer.innerHTML = '<p>Error loading packages.</p>';
            return;
        }
        pricingContainer.innerHTML = '';
        services.forEach(svc => {
            const card = document.createElement('div');
            card.className = 'pricing-card';
            
            // Собираем список фич
            let featuresHtml = '';
            if(svc.features && svc.features.length > 0) {
                svc.features.forEach(f => featuresHtml += `<li>${f}</li>`);
            }

            card.innerHTML = `
                <h4>${svc.title}</h4>
                <div class="price">${svc.price}</div>
                <p class="package-desc">${svc.description || ''}</p>
                <ul class="features">${featuresHtml}</ul>
                <a href="https://ig.me/m/masha.photova" target="_blank" class="btn-primary" style="width:100%; display:block; text-align:center; box-sizing:border-box; text-decoration: none;">Book ${svc.title}</a>
            `;
            pricingContainer.appendChild(card);
        });
    }
    loadPricing();

    // Сохранение нового пакета
    if(savePackageBtn) {
        savePackageBtn.addEventListener('click', async () => {
            const title = document.getElementById('pkgTitle').value;
            const price = document.getElementById('pkgPrice').value;
            const desc = document.getElementById('pkgDesc').value;
            const featuresRaw = document.getElementById('pkgFeatures').value;
            
            // Разбиваем текст на массив строк
            const features = featuresRaw.split('\n').filter(f => f.trim() !== '');

            if (!title || !price) return alert("Title and Price are required!");

            savePackageBtn.disabled = true;
            savePackageBtn.textContent = "Saving...";

            const { error } = await supabase.from('services').insert([
                { title: title, price: price, description: desc, features: features }
            ]);

            savePackageBtn.disabled = false;
            savePackageBtn.textContent = "Save Package";

            if (error) {
                alert("Error: " + error.message);
            } else {
                packageModal.style.display = 'none';
                document.getElementById('pkgTitle').value = '';
                document.getElementById('pkgPrice').value = '';
                document.getElementById('pkgDesc').value = '';
                document.getElementById('pkgFeatures').value = '';
                loadPricing(); // Перезагружаем карточки
            }
        });
    }
});
