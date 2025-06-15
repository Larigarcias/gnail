document.addEventListener('DOMContentLoaded', function() {
    // --- Menu Hamburger e Overlay ---
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navOverlay = document.getElementById('navOverlay');
    const overlayLinks = document.querySelectorAll('.overlay-menu a');
    const body = document.body;

    hamburgerMenu.addEventListener('click', function() {
        navOverlay.classList.toggle('active');
        body.classList.toggle('no-scroll');
        const icon = hamburgerMenu.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });

    // Fechar o menu ao clicar em um link
    overlayLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Impede o comportamento padrão de link
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            navOverlay.classList.remove('active'); // Fecha o menu
            body.classList.remove('no-scroll'); // Habilita o scroll do body
            const icon = hamburgerMenu.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');

            // Scroll suave para a seção
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Fechar o menu ao clicar fora dele
    document.addEventListener('click', function(event) {
        if (navOverlay.classList.contains('active') &&
            !hamburgerMenu.contains(event.target) &&
            !navOverlay.contains(event.target)) {
            navOverlay.classList.remove('active');
            body.classList.remove('no-scroll');
            const icon = hamburgerMenu.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    });

    // --- Animações com Intersection Observer ---
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Adiciona 'is-visible' para o h2 para animação do underline
                if (entry.target.tagName === 'H2') {
                    entry.target.classList.add('is-visible');
                }

                // Ativa a animação do círculo SVG quando o wrapper da imagem é visível
                if (entry.target.classList.contains('about-us-image-wrapper')) {
                    const circle = entry.target.querySelector('.circle-border-svg circle');
                    if (circle) {
                        // Calcula a circunferência com base no raio do círculo SVG
                        // O valor 48 é o 'r' do círculo no SVG
                        const radius = circle.r.baseVal.value;
                        const circumference = 2 * Math.PI * radius;
                        circle.style.strokeDasharray = circumference;
                        circle.style.strokeDashoffset = circumference;
                        // Força um reflow para garantir que a propriedade seja aplicada antes da transição
                        void circle.offsetWidth;
                        circle.style.strokeDashoffset = 0; // Inicia a animação de desenho
                    }
                }
                
            } else {
                // Você pode adicionar lógica aqui para remover a classe 'is-visible'
                // se quiser que as animações sejam reativadas ao rolar para cima e para baixo.
                // entry.target.classList.remove('is-visible');
                // if (entry.target.tagName === 'H2') {
                //     entry.target.classList.remove('is-visible');
                // }
            }
        });
    }, observerOptions);

    // Observe os elementos para as animações
    document.querySelectorAll('.animate-fade-in, .animate-slide-up, .animate-scale-in, .map-placeholder, .horizontal-carousel-container, h2, .carousel-instruction, .about-us-image-wrapper').forEach(element => {
        observer.observe(element);
    });

    // --- Carrossel Horizontal de Serviços (AGORA MAIS SUAVE COM BOTÕES) ---
    const horizontalCarouselTrack = document.getElementById('horizontalCarouselTrack');
    const horizontalSlides = document.querySelectorAll('.horizontal-carousel-slide');
    const carouselPrevBtn = document.getElementById('carouselPrevBtn');
    const carouselNextBtn = document.getElementById('carouselNextBtn');
    let currentHorizontalIndex = 0;
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
    let autoSlideTimeout; // Para o slide automático

    // Função para obter a posição X (mouse ou touch)
    function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches ? event.touches[0].pageX : 0;
    }

    // Função para definir a transição da track
    function setSliderTransition(transitionDuration) {
        horizontalCarouselTrack.style.transition = `transform ${transitionDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    }

    // Função para setar a posição da track
    function setPositionByIndex() {
        if (horizontalSlides.length === 0) return;

        // Remove 'active' de todos os slides e adiciona ao slide atual
        horizontalSlides.forEach(slide => slide.classList.remove('active'));
        if (horizontalSlides[currentHorizontalIndex]) {
            horizontalSlides[currentHorizontalIndex].classList.add('active');
        }

        // Calcula o deslocamento para centralizar o slide ativo
        const container = horizontalCarouselTrack.parentElement; // .horizontal-carousel-container
        const containerWidth = container.offsetWidth;
        const activeSlide = horizontalSlides[currentHorizontalIndex];
        const activeSlideWidth = activeSlide ? activeSlide.offsetWidth : 0;
        const slideMargin = activeSlide ? (parseFloat(window.getComputedStyle(activeSlide).marginLeft) + parseFloat(window.getComputedStyle(activeSlide).marginRight)) : 0;
        const trackPaddingLeft = parseFloat(window.getComputedStyle(horizontalCarouselTrack).paddingLeft);

        let activeSlideStart = trackPaddingLeft;
        for (let i = 0; i < currentHorizontalIndex; i++) {
            activeSlideStart += (horizontalSlides[i] ? horizontalSlides[i].offsetWidth : 0) + slideMargin;
        }

        const centerOffset = (containerWidth - activeSlideWidth) / 2;
        const targetTranslateX = -activeSlideStart + centerOffset - (slideMargin / 2);

        currentTranslate = targetTranslateX; // Atualiza currentTranslate para a posição final
        prevTranslate = currentTranslate; // Garante que prevTranslate esteja sincronizado
        setSliderTransition(0.6); // Transição suave para o snap
        horizontalCarouselTrack.style.transform = `translateX(${currentTranslate}px)`;

        updateCarouselButtonsVisibility();
        resetAutoSlide(); // Reinicia o temporizador após o movimento
    }

    // Atualiza a visibilidade e estado dos botões do carrossel
    function updateCarouselButtonsVisibility() {
        if (carouselPrevBtn) {
            carouselPrevBtn.disabled = currentHorizontalIndex === 0;
        }
        if (carouselNextBtn) {
            carouselNextBtn.disabled = currentHorizontalIndex === horizontalSlides.length - 1;
        }
    }

    // Navega para um slide específico
    function goToSlide(index) {
        if (index >= 0 && index < horizontalSlides.length) {
            currentHorizontalIndex = index;
            setPositionByIndex();
        }
    }

    // Event listeners para os botões de navegação
    if (carouselPrevBtn) {
        carouselPrevBtn.addEventListener('click', () => {
            goToSlide(currentHorizontalIndex - 1);
        });
    }

    if (carouselNextBtn) {
        carouselNextBtn.addEventListener('click', () => {
            goToSlide(currentHorizontalIndex + 1);
        });
    }

    // Início do arrasto
    function touchStart(event) {
        if (event.type === 'touchstart' && event.touches.length > 1) return; // Ignora multi-touch
        isDragging = true;
        startPos = getPositionX(event);
        setSliderTransition(0); // Desabilita transição CSS durante o drag
        horizontalCarouselTrack.style.cursor = 'grabbing';
        cancelAnimationFrame(animationID); // Cancela qualquer animação em andamento
        clearTimeout(autoSlideTimeout); // Para o slide automático ao iniciar o arrasto
    }

    // Movimento do arrasto
    function touchMove(event) {
        if (!isDragging) return;
        // event.preventDefault(); // Evita scroll vertical indesejado, mas pode impactar o scroll da página

        const currentPosX = getPositionX(event);
        const distance = currentPosX - startPos;
        currentTranslate = prevTranslate + distance; // Calcula a nova posição baseada no movimento

        horizontalCarouselTrack.style.transform = `translateX(${currentTranslate}px)`;
    }

    // Fim do arrasto
    function touchEnd() {
        if (!isDragging) return;
        isDragging = false;
        horizontalCarouselTrack.style.cursor = 'grab';

        const movedBy = currentTranslate - prevTranslate; // Quanto o usuário moveu desde o último snap

        // Encontra o slide mais próximo para ajustar
        let closestSlideIndex = currentHorizontalIndex;
        let minDistance = Infinity;

        // Itera sobre todos os slides para encontrar o mais próximo da posição atual
        horizontalSlides.forEach((slide, index) => {
            const slideStartPos = horizontalCarouselTrack.getBoundingClientRect().left + slide.offsetLeft;
            const containerCenter = horizontalCarouselTrack.parentElement.offsetWidth / 2;
            const slideCenter = slideStartPos + (slide.offsetWidth / 2);
            const distanceToCenter = slideCenter - containerCenter;
            const absoluteDistance = Math.abs(distanceToCenter);

            if (absoluteDistance < minDistance) {
                minDistance = absoluteDistance;
                closestSlideIndex = index;
            }
        });

        // Determine se a intenção era ir para o próximo ou anterior com base no movimento e proximidade
        if (movedBy < -50 && closestSlideIndex < horizontalSlides.length - 1) { // Deslize para a esquerda
            closestSlideIndex = Math.min(closestSlideIndex + 1, horizontalSlides.length - 1);
        } else if (movedBy > 50 && closestSlideIndex > 0) { // Deslize para a direita
            closestSlideIndex = Math.max(closestSlideIndex - 1, 0);
        }

        currentHorizontalIndex = closestSlideIndex; // Define o novo slide ativo
        setPositionByIndex(); // Ajusta para o slide mais próximo com transição suave
    }

    // Simula o movimento do carrossel para frente/trás (não para arrasto, mas para funções programáticas se houver)
    function animate() {
        if (!isDragging) return; // Não anima se não estiver arrastando
        horizontalCarouselTrack.style.transform = `translateX(${currentTranslate}px)`;
        animationID = requestAnimationFrame(animate);
    }

    // Auto-slide (opcional)
    const AUTO_SLIDE_INTERVAL = 5000; // 5 segundos
    function startAutoSlide() {
        clearTimeout(autoSlideTimeout);
        autoSlideTimeout = setTimeout(() => {
            goToSlide((currentHorizontalIndex + 1) % horizontalSlides.length); // Loop infinito
        }, AUTO_SLIDE_INTERVAL);
    }

    function resetAutoSlide() {
        clearTimeout(autoSlideTimeout);
        startAutoSlide();
    }

    // Adiciona event listeners para arrasto
    horizontalCarouselTrack.addEventListener('touchstart', touchStart);
    horizontalCarouselTrack.addEventListener('touchend', touchEnd);
    horizontalCarouselTrack.addEventListener('mousedown', touchStart);
    horizontalCarouselTrack.addEventListener('mouseup', touchEnd);
    horizontalCarouselTrack.addEventListener('mouseleave', touchEnd); // Caso o mouse saia da área enquanto arrasta

    horizontalCarouselTrack.addEventListener('mousemove', touchMove);
    horizontalCarouselTrack.addEventListener('touchmove', touchMove);

    // Inicializa o carrossel (garante que o primeiro slide esteja ativo e centralizado ao carregar)
    window.addEventListener('load', () => {
        if (horizontalSlides.length > 0) {
            setPositionByIndex();
            updateCarouselButtonsVisibility();
            startAutoSlide(); // Inicia o auto-slide
        }
    });

    // Reajusta o carrossel se a janela for redimensionada
    window.addEventListener('resize', () => {
        if (horizontalSlides.length > 0) {
            setPositionByIndex();
            updateCarouselButtonsVisibility();
        }
    });


    // --- Custom Lightbox para a Galeria ---
    const customLightbox = document.getElementById('customLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const galleryFigures = document.querySelectorAll('.gallery-grid figure');

    galleryFigures.forEach(figure => {
        figure.addEventListener('click', function() {
            const imgSrc = this.querySelector('img').src;
            const imgAlt = this.querySelector('img').alt; // Usar alt para fallback
            const imgCaption = this.querySelector('img').dataset.caption || this.querySelector('figcaption').textContent;

            lightboxImage.src = imgSrc;
            lightboxImage.alt = imgAlt;
            lightboxCaption.textContent = imgCaption;

            customLightbox.classList.add('active');
            body.classList.add('no-scroll'); // Impede o scroll do body
        });
    });

    lightboxClose.addEventListener('click', function() {
        customLightbox.classList.remove('active');
        body.classList.remove('no-scroll');
    });

    // Fechar lightbox ao clicar fora da imagem (no fundo escuro)
    customLightbox.addEventListener('click', function(event) {
        if (event.target === customLightbox) {
            customLightbox.classList.remove('active');
            body.classList.remove('no-scroll');
        }
    });
});