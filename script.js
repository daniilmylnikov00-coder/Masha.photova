document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Анимация появления при скролле
    const faders = document.querySelectorAll('.fade-in');
    
    const appearOptions = {
        threshold: 0.1, // Срабатывает, когда элемент появляется на 10%
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                // Добавляем класс для запуска CSS-анимации
                entry.target.classList.add('appear');
                // Отключаем наблюдение, чтобы анимация сработала только 1 раз
                appearOnScroll.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // 2. Логика Модального окна (Формы)
    const modal = document.getElementById("bookingModal");
    const openBtns = document.querySelectorAll(".open-modal");
    const closeBtn = document.querySelector(".close");
    const eventSelect = document.getElementById("event");

    openBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Запрещаем скролл

            // Если кнопка имеет data-event, подставляем значение
            const eventName = btn.getAttribute("data-event");
            if (eventName) {
                eventSelect.value = eventName;
            } else {
                eventSelect.value = "";
            }
        });
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
});