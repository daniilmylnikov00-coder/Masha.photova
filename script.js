document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Анимация появления при скролле (Intersection Observer)
    const faders = document.querySelectorAll('.fade-in');
    
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
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

    // Открытие окна
    openBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Запрещаем скролл фона

            // Если кнопка имеет data-event (из карточки), подставляем значение в список
            const eventName = btn.getAttribute("data-event");
            if (eventName) {
                eventSelect.value = eventName;
            } else {
                // Если нажали на общую кнопку "Check Availability", сбрасываем выбор
                eventSelect.value = "";
            }
        });
    });

    // Закрытие окна по крестику
    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    });

    // Закрытие окна по клику вне его
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
});