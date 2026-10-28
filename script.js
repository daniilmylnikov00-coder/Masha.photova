import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://olezthiuxjcuveduyxsg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_5yXVeHuf370Cq4cnlyhTgQ_W6tknQzh';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ВАШ ПАРОЛЬ ДЛЯ ВХОДА
const ADMIN_PASSWORD = "MashaAdmin2026"; 

document.addEventListener("DOMContentLoaded", () => {
    
    // === 1. АНИМАЦИИ ПОЯВЛЕНИЯ ===
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

    // === 2. ЛОГИКА ВХОДА (АДМИНКА) ===
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeLogin = document.getElementById('closeLogin');
    const submitLogin = document.getElementById('submitLogin');
    const passwordInput = document.getElementById('passwordInput');
    const adminUploadZone = document.getElementById('admin-upload-zone');

    // Проверяем, не залогинен ли уже админ (сохраняем в памяти браузера)
    if (localStorage.getItem('isAdmin') === 'true') {
        adminUploadZone.style.display = 'block';
        loginBtn.style.display = 'none'; // Прячем кнопку Login
    }

    loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    closeLogin.addEventListener('click', () => loginModal.style.display = 'none');

    submitLogin.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            localStorage.setItem('isAdmin', 'true');
            adminUploadZone.style.display = 'block';
            loginModal.style.display = 'none';
            loginBtn.style.display = 'none';
            alert("Welcome back, Admin!");
        } else {
            alert("Wrong password!");
            passwordInput.value = '';
        }
    });

    // === 3. ЗАГРУЗКА ФОТОГРАФИЙ ===
    const uploadModal = document.getElementById('uploadModal');
    const closeUpload = document.getElementById('closeUpload');
    const uploadBtn = document.getElementById('uploadBtn'); // Кнопка + Add Photo
    const doUploadBtn = document.getElementById('doUploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadFile = document.getElementById('uploadFile');
    const uploadCategory = document.getElementById('uploadCategory');

    uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'block';
        uploadStatus.textContent = '';
        uploadFile.value = '';
    });
    closeUpload.addEventListener('click', () => uploadModal.style.display = 'none');

    doUploadBtn.addEventListener('click', async () => {
        const file = uploadFile.files[0];
        const category = uploadCategory.value;

        if (!file) {
            uploadStatus.textContent = "Please select a file.";
            uploadStatus.style.color = "red";
            return;
        }

        uploadStatus.textContent = "Uploading...";
        uploadStatus.style.color = "black";
        doUploadBtn.disabled = true;

        try {
            // Сохраняем файл с именем: категория_время.jpg
            const fileName = `${category}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            
            const { data, error } = await supabase.storage
                .from('photos')
                .upload(fileName, file);

            if (error) throw error;

            uploadStatus.textContent = "Success! Photo added.";
            uploadStatus.style.color = "green";
            
            // Перезагружаем галереи, чтобы показать новое фото
            loadGallery('portraits', 'gallery-portraits');
            loadGallery('couples', 'gallery-couples');
            loadGallery('brand', 'gallery-brand');

            setTimeout(() => { uploadModal.style.display = 'none'; }, 1500);

        } catch (error) {
            console.error(error);
            uploadStatus.textContent = "Error: " + error.message;
            uploadStatus.style.color = "red";
        } finally {
            doUploadBtn.disabled = false;
        }
    });

    // === 4. ОТОБРАЖЕНИЕ ФОТО В АККОРДЕОНЕ ===
    async function loadGallery(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Получаем список всех файлов
        const { data: files, error } = await supabase.storage
            .from('photos')
            .list('', {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error("Error loading gallery:", error);
            return;
        }

        // Фильтруем файлы по категории (в начале имени файла)
        const filteredFiles = files.filter(f => f.name.startsWith(category + '_'));

        if (filteredFiles.length === 0) {
            container.innerHTML = '<p style="padding: 20px; color: #888;">No photos in this category yet.</p>';
            return;
        }

        container.innerHTML = ''; // Очищаем

        filteredFiles.forEach(file => {
            const { data } = supabase.storage.from('photos').getPublicUrl(file.name);
            const img = document.createElement('img');
            img.src = data.publicUrl;
            img.alt = file.name;
            container.appendChild(img);
        });
    }

    // Загружаем галереи при старте
    loadGallery('portraits', 'gallery-portraits');
    loadGallery('couples', 'gallery-couples');
    loadGallery('brand', 'gallery-brand');
});
