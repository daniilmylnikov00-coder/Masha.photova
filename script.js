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
    const addPricingBtn = document.getElementById('addPricingBtn');
    const editAboutBtn = document.getElementById('editAboutBtn');
    const editHeroBtn = document.getElementById('editHeroBtn');

    function checkAdmin() {
        if (localStorage.getItem('isAdmin') === 'true') {
            if(adminUploadZone) adminUploadZone.style.display = 'block';
            if(addPricingBtn) addPricingBtn.style.display = 'inline-block';
            if(editAboutBtn) editAboutBtn.style.display = 'flex';
            if(editHeroBtn) editHeroBtn.style.display = 'flex'; // Показываем карандаш на главном экране
            if(loginBtn) loginBtn.style.display = 'none';
        }
    }
    checkAdmin();

    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    if (closeLogin) closeLogin.addEventListener('click', () => loginModal.style.display = 'none');

    if (submitLogin) {
        submitLogin.addEventListener('click', () => {
            if (passwordInput.value === ADMIN_PASSWORD) {
                localStorage.setItem('isAdmin', 'true');
                loginModal.style.display = 'none';
                checkAdmin(); 
                loadGallery('portraits', 'gallery-portraits');
                loadGallery('couples', 'gallery-couples');
                loadGallery('brand', 'gallery-brand');
                loadPricing(); 
            } else {
                alert("Wrong password!");
                passwordInput.value = '';
            }
        });
    }

    // === 3. ЗАГРУЗКА ФОТО В ГАЛЕРЕЮ ===
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

    // === 4. ОТОБРАЖЕНИЕ ФОТО И УДАЛЕНИЕ ===
    async function loadGallery(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        
        try {
            const { data: files, error } = await supabase.storage.from('photos').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
            if (error) throw error;

            const filteredFiles = files.filter(f => f.name.startsWith(category + '_'));
            
            if (filteredFiles.length === 0) {
                container.innerHTML = '<p style="padding: 20px; color: #888;">No photos yet.</p>';
                return;
            }
            container.innerHTML = ''; 
            
            filteredFiles.forEach(file => {
                const { data } = supabase.storage.from('photos').getPublicUrl(file.name);
                const wrapper = document.createElement('div');
                wrapper.className = 'photo-wrapper';
                const img = document.createElement('img');
                img.src = data.publicUrl;
                img.addEventListener('click', () => {
                    lightboxImg.src = data.publicUrl;
                    lightbox.classList.add('active');
                });
                wrapper.appendChild(img);

                if (isAdmin) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-photo-btn';
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.title = "Delete photo";
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this photo?")) {
                            deleteBtn.innerHTML = '...';
                            const { error } = await supabase.storage.from('photos').remove([file.name]);
                            if (error) {
                                alert("Error: " + error.message);
                                deleteBtn.innerHTML = '&times;';
                            } else {
                                wrapper.remove(); 
                            }
                        }
                    });
                    wrapper.appendChild(deleteBtn);
                }
                container.appendChild(wrapper);
            });
        } catch (error) {
            container.innerHTML = '<p style="padding: 20px; color: red;">Failed to load photos.</p>';
        }
    }
    loadGallery('portraits', 'gallery-portraits');
    loadGallery('couples', 'gallery-couples');
    loadGallery('brand', 'gallery-brand');

    // === 5. РЕДАКТИРОВАНИЕ ЦЕН ===
    const pricingContainer = document.getElementById('pricing-container');
    const packageModal = document.getElementById('packageModal');
    const closePackage = document.getElementById('closePackage');
    const savePackageBtn = document.getElementById('savePackageBtn');
    const packageModalTitle = document.getElementById('packageModalTitle');
    const pkgId = document.getElementById('pkgId');
    const pkgTitle = document.getElementById('pkgTitle');
    const pkgPrice = document.getElementById('pkgPrice');
    const pkgDesc = document.getElementById('pkgDesc');
    const pkgFeatures = document.getElementById('pkgFeatures');

    if (addPricingBtn) {
        addPricingBtn.addEventListener('click', () => {
            packageModalTitle.textContent = "Add New Package";
            pkgId.value = ""; pkgTitle.value = ""; pkgPrice.value = ""; pkgDesc.value = ""; pkgFeatures.value = "";
            packageModal.style.display = 'block';
        });
    }
    if (closePackage) closePackage.addEventListener('click', () => packageModal.style.display = 'none');

    async function loadPricing() {
        if(!pricingContainer) return;
        try {
            const { data: services, error } = await supabase.from('services').select('*').order('id', { ascending: true });
            if (error) throw error;
            
            if (!services || services.length === 0) {
                pricingContainer.innerHTML = '<p style="text-align:center; width:100%;">No packages found.</p>';
                return;
            }
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            pricingContainer.innerHTML = '';
            
            services.forEach(svc => {
                const card = document.createElement('div');
                card.className = 'pricing-card';
                card.style.position = 'relative';
                let featuresHtml = '';
                if(svc.features) svc.features.forEach(f => featuresHtml += `<li>${f}</li>`);
                const editIcon = isAdmin ? `<button class="edit-package-btn" data-id="${svc.id}">✏️</button>` : '';
                card.innerHTML = `
                    ${editIcon}
                    <h4>${svc.title}</h4>
                    <div class="price">${svc.price}</div>
                    <p class="package-desc">${svc.description || ''}</p>
                    <ul class="features">${featuresHtml}</ul>
                    <a href="https://ig.me/m/masha.photova" target="_blank" class="btn-primary" style="width:100%; display:block; text-align:center; box-sizing:border-box; text-decoration: none;">Book ${svc.title}</a>
                `;
                pricingContainer.appendChild(card);
            });
            
            if (isAdmin) {
                document.querySelectorAll('.edit-package-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        const svc = services.find(s => s.id == id);
                        if(svc) {
                            packageModalTitle.textContent = "Edit Package";
                            pkgId.value = svc.id; pkgTitle.value = svc.title; pkgPrice.value = svc.price; pkgDesc.value = svc.description || ""; pkgFeatures.value = svc.features ? svc.features.join('\n') : "";
                            packageModal.style.display = 'block';
                        }
                    });
                });
            }
        } catch (error) {
            pricingContainer.innerHTML = `<p style="text-align:center; width:100%; color:red;">Failed to load: ${error.message}</p>`;
        }
    }
    loadPricing();

    if(savePackageBtn) {
        savePackageBtn.addEventListener('click', async () => {
            const id = pkgId.value;
            const data = { title: pkgTitle.value, price: pkgPrice.value, description: pkgDesc.value, features: pkgFeatures.value.split('\n').filter(f => f.trim() !== '') };
            if (!data.title || !data.price) return alert("Title and Price are required!");
            savePackageBtn.disabled = true;
            savePackageBtn.textContent = "Saving...";
            let error;
            if (id) {
                const response = await supabase.from('services').update(data).eq('id', id);
                error = response.error;
            } else {
                const response = await supabase.from('services').insert([data]);
                error = response.error;
            }
            savePackageBtn.disabled = false;
            savePackageBtn.textContent = "Save Package";
            if (error) alert("Error: " + error.message);
            else { packageModal.style.display = 'none'; loadPricing(); }
        });
    }

    // === 6. РЕДАКТИРОВАНИЕ БЛОКА ОБО МНЕ (ТЕКСТ + ФОТО) ===
    const aboutImg = document.getElementById('about-img');
    const aboutTitle = document.getElementById('about-title');
    const aboutP1 = document.getElementById('about-p1');
    const aboutP2 = document.getElementById('about-p2');
    const aboutModal = document.getElementById('aboutModal');
    const closeAbout = document.getElementById('closeAbout');
    const saveAboutBtn = document.getElementById('saveAboutBtn');
    const aboutTitleInput = document.getElementById('aboutTitleInput');
    const aboutP1Input = document.getElementById('aboutP1Input');
    const aboutP2Input = document.getElementById('aboutP2Input');
    const aboutImgInput = document.getElementById('aboutImgInput');
    const uploadAboutImgBtn = document.getElementById('uploadAboutImgBtn');
    const aboutUploadStatus = document.getElementById('aboutUploadStatus');

    async function loadAbout() {
        try {
            const { data, error } = await supabase.from('about_settings').select('*').limit(1).single();
            if (error && error.code !== 'PGRST116') throw error; 
            
            if (data) {
                aboutTitle.innerHTML = data.title || "Nice to meet you.<br>I photograph what matters most.";
                aboutP1.textContent = data.paragraph1 || "";
                aboutP2.textContent = data.paragraph2 || "";
                if (data.image_url) aboutImg.src = data.image_url;
                if(aboutTitleInput) aboutTitleInput.value = (data.title || "").replace(/<br>/g, '\n');
                if(aboutP1Input) aboutP1Input.value = data.paragraph1 || "";
                if(aboutP2Input) aboutP2Input.value = data.paragraph2 || "";
            }
        } catch (error) {
            aboutTitle.innerHTML = "Nice to meet you.<br>I photograph what matters most.";
            aboutP1.textContent = "Hi, I'm Mariia — a photographer serving the NoVa & DC area.";
            aboutP2.textContent = "My sessions are calm, unhurried, and real.";
        }
    }
    loadAbout();

    if (editAboutBtn) editAboutBtn.addEventListener('click', () => {
        aboutUploadStatus.textContent = "";
        aboutImgInput.value = "";
        aboutModal.style.display = 'block';
    });
    if (closeAbout) closeAbout.addEventListener('click', () => aboutModal.style.display = 'none');

    if (uploadAboutImgBtn) {
        uploadAboutImgBtn.addEventListener('click', async () => {
            const file = aboutImgInput.files[0];
            if (!file) return aboutUploadStatus.textContent = "Please select a file.";

            aboutUploadStatus.textContent = "Uploading image...";
            aboutUploadStatus.style.color = "black";
            uploadAboutImgBtn.disabled = true;

            try {
                const fileName = `about_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName);
                const { error: dbError } = await supabase.from('about_settings').update({ image_url: urlData.publicUrl }).eq('id', 1);
                if (dbError) throw dbError;

                aboutUploadStatus.textContent = "Photo updated successfully!";
                aboutUploadStatus.style.color = "green";
                aboutImg.src = urlData.publicUrl; 
            } catch (error) {
                aboutUploadStatus.textContent = "Error: " + error.message;
                aboutUploadStatus.style.color = "red";
            } finally {
                uploadAboutImgBtn.disabled = false;
            }
        });
    }

    if (saveAboutBtn) {
        saveAboutBtn.addEventListener('click', async () => {
            saveAboutBtn.disabled = true;
            saveAboutBtn.textContent = "Saving text...";
            const newTitle = aboutTitleInput.value.replace(/\n/g, '<br>');
            const { error } = await supabase.from('about_settings').update({ title: newTitle, paragraph1: aboutP1Input.value, paragraph2: aboutP2Input.value }).eq('id', 1);
            saveAboutBtn.disabled = false;
            saveAboutBtn.textContent = "Save Changes";
            if (error) alert("Error: " + error.message);
            else { aboutModal.style.display = 'none'; loadAbout(); }
        });
    }

    // === 7. РЕДАКТИРОВАНИЕ ГЛАВНОГО ЭКРАНА (HERO) ===
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroBtn1 = document.getElementById('hero-btn1');
    const heroBtn2 = document.getElementById('hero-btn2');
    const heroModal = document.getElementById('heroModal');
    const closeHero = document.getElementById('closeHero');
    const saveHeroBtn = document.getElementById('saveHeroBtn');
    
    const heroTitleInput = document.getElementById('heroTitleInput');
    const heroSubtitleInput = document.getElementById('heroSubtitleInput');
    const heroBtn1Input = document.getElementById('heroBtn1Input');
    const heroBtn2Input = document.getElementById('heroBtn2Input');

    async function loadHero() {
        try {
            const { data, error } = await supabase.from('hero_settings').select('*').limit(1).single();
            if (error && error.code !== 'PGRST116') throw error; 
            
            if (data) {
                heroTitle.innerHTML = data.title || "Moments worth keeping.";
                heroSubtitle.textContent = data.subtitle || "Real moments. Warm light. Images you'll keep forever.";
                heroBtn1.textContent = data.btn1_text || "Check Availability";
                heroBtn2.textContent = data.btn2_text || "View Portfolio";

                heroTitleInput.value = (data.title || "").replace(/<br>/g, '\n');
                heroSubtitleInput.value = data.subtitle || "";
                heroBtn1Input.value = data.btn1_text || "";
                heroBtn2Input.value = data.btn2_text || "";
            }
        } catch (error) {
            console.log("Hero text using defaults.");
        }
    }
    loadHero();

    if (editHeroBtn) editHeroBtn.addEventListener('click', () => heroModal.style.display = 'block');
    if (closeHero) closeHero.addEventListener('click', () => heroModal.style.display = 'none');

    if (saveHeroBtn) {
        saveHeroBtn.addEventListener('click', async () => {
            saveHeroBtn.disabled = true;
            saveHeroBtn.textContent = "Saving...";
            
            const newTitle = heroTitleInput.value.replace(/\n/g, '<br>');
            
            const { error } = await supabase.from('hero_settings').update({
                title: newTitle,
                subtitle: heroSubtitleInput.value,
                btn1_text: heroBtn1Input.value,
                btn2_text: heroBtn2Input.value
            }).eq('id', 1);

            saveHeroBtn.disabled = false;
            saveHeroBtn.textContent = "Save Changes";

            if (error) {
                alert("Error: " + error.message);
            } else {
                heroModal.style.display = 'none';
                loadHero(); 
            }
        });
    }
});
