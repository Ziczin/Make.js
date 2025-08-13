export default function createAccordion(Component, Preferences, makeWith) {
    return class Accordion extends Component {
        constructor(...args) {
            super('div');
            this.addDecorator(makeWith.css('make-accordion'));
            let preferences;
            let cards;
            if (args.length > 0 && args[0] instanceof Preferences) {
                preferences = args[0];
                cards = args.slice(1);
            } else {
                preferences = new Preferences({});
                cards = args;
            }
            this.preferences = preferences;
            this.preferences
                .set('isMulti', false)
                .set('timeOpen', 300)
                .set('timeClose', 300);
            if (cards.length === 0 || !cards.every(card => 
                card instanceof Component && 
                card.constructor.name === 'Card')) {
                throw new Error('Accordion requires at least one Card element');
            }
            this.cards = cards;
            this.currentActiveIndices = new Set();
            this.previousActiveIndices = new Set();
            this.contentElements = [];
            this.isBuilding = false;
            this.transitioning = new Set();
            this.pendingIndex = null;
        }
        build(force = false) {
            if (this.destroyed) {
                return null;
            }
            if (this.isBuilding) return this.element;
            this.isBuilding = true;
            try {
                if (!this.element) {
                    this.element = document.createElement(this.elementType);
                    this.element.classList.add('make-accordion');
                }
                if (force || this.contentElements.length === 0) {
                    this.element.innerHTML = '';
                    this.contentElements = [];
                    this.cards.forEach((card, index) => {
                        const cardId = `accordion-content-${index}`;
                        const headerButton = card.build();
                        headerButton.classList.add('make-accordion-header');
                        headerButton.setAttribute('aria-controls', cardId);
                        headerButton.setAttribute('aria-expanded', 'false');
                        headerButton.id = headerButton.id || `accordion-header-${index}`;
                        if (!headerButton._accordionListener) {
                            const listener = () => this.toggleCard(index);
                            headerButton.addEventListener('click', listener);
                            headerButton._accordionListener = listener;
                        }
                        const content = card.cardContent.build();
                        content.classList.add('make-accordion-content');
                        content.setAttribute('id', cardId);
                        content.setAttribute('role', 'region');
                        content.setAttribute('aria-labelledby', headerButton.id);
                        content.style.overflow = 'hidden';
                        content.style.maxHeight = '0';
                        content.style.opacity = '0';
                        this.contentElements[index] = content;
                        this.element.appendChild(headerButton);
                        this.element.appendChild(content);
                    });
                }
                this.updateStates();
                return this.element;
            } finally {
                this.isBuilding = false;
            }
        }
        updateStates() {
            if (this.isBuilding || this.destroyed) return;
            const isMulti = this.preferences.get('isMulti', false);
            const timeOpen = this.preferences.get('timeOpen', 300);
            const timeClose = this.preferences.get('timeClose', 300);
            // Сохраняем предыдущее состояние для сравнения
            const previousActive = new Set(this.previousActiveIndices);
            this.previousActiveIndices = new Set(this.currentActiveIndices);
            // Обрабатываем только изменившиеся карточки
            this.cards.forEach((card, index) => {
                const headerButton = card.element || card.build();
                const content = this.contentElements[index];
                const isActive = this.currentActiveIndices.has(index);
                const wasActive = previousActive.has(index);
                // Пропускаем неизменные карточки
                if (isActive === wasActive) return;
                headerButton.setAttribute('aria-expanded', isActive.toString());
                // Для режима single обрабатываем закрытие и открытие последовательно
                if (!isMulti && isActive && wasActive) {
                    this._closeCard(index, content, timeClose);
                } else if (isActive) {
                    this._openCard(index, content, timeOpen);
                } else {
                    this._closeCard(index, content, timeClose);
                }
            });
        }
        _openCard(index, content, timeOpen) {
            if (this.transitioning.has(index)) return;
            
            // Правильная последовательность для анимации открытия
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            
            // Принудительное обновление layout
            void content.offsetHeight;
            
            this.transitioning.add(index);
            content.style.transition = `max-height ${timeOpen}ms ease-in-out, opacity ${timeOpen}ms ease-in-out`;
            
            const targetHeight = content.scrollHeight;
            content.style.maxHeight = targetHeight + 'px';
            content.style.opacity = '1';
            
            const handleTransitionEnd = () => {
                content.removeEventListener('transitionend', handleTransitionEnd);
                if (this.currentActiveIndices.has(index)) {
                    content.style.transition = 'none';
                    content.style.maxHeight = 'none';
                }
                this.transitioning.delete(index);
            };
            
            content.addEventListener('transitionend', handleTransitionEnd);
        }
        _closeCard(index, content, timeClose) {
            if (this.transitioning.has(index)) return;
            
            // Устанавливаем текущую высоту перед анимацией
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
            
            // Принудительное обновление layout
            void content.offsetHeight;
            
            this.transitioning.add(index);
            content.style.transition = `max-height ${timeClose}ms ease-in-out, opacity ${timeClose}ms ease-in-out`;
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            
            const handleTransitionEnd = () => {
                content.removeEventListener('transitionend', handleTransitionEnd);
                this.transitioning.delete(index);
            };
            
            content.addEventListener('transitionend', handleTransitionEnd);
        }
        toggleCard(index) {
            if (this.transitioning.has(index) || this.isBuilding) return;
            const isActive = this.currentActiveIndices.has(index);
            const isMulti = this.preferences.get('isMulti', false);
            if (isActive) {
                this.currentActiveIndices.delete(index);
            } else {
                if (!isMulti) {
                    // Для режима single закрываем все карточки перед открытием новой
                    this.previousActiveIndices = new Set(this.currentActiveIndices);
                    this.currentActiveIndices.clear();
                }
                this.currentActiveIndices.add(index);
            }
            this.updateStates();
        }
    };
}