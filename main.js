(function() {
    var plugin_name = 'my_external_subtitles';
    if (window[plugin_name]) return;
    window[plugin_name] = true;

    function startPlugin() {
        console.log('[SubtitlesPlugin] Запуск...');

        // БОЛЕЕ НАДЕЖНЫЙ СПОСОБ 1: Добавление через Lampa.Settings
        if (Lampa.Settings && Lampa.Settings.add) {
            Lampa.Settings.add({
                key: 'mysubtitles',
                name: 'Субтитры',
                description: 'Настройка внешних субтитров',
                icon: 'https://cdn-icons-png.flaticon.com/512/2115/2115949.png'
            });
            console.log('[SubtitlesPlugin] Пункт добавлен через Settings');
        } 
        // БОЛЕЕ НАДЕЖНЫЙ СПОСОБ 2: Альтернативный метод
        else if (Lampa.Manifest && Lampa.Manifest.settings) {
            Lampa.Manifest.settings.push({
                key: 'mysubtitles',
                name: 'Субтитры',
                icon: 'https://cdn-icons-png.flaticon.com/512/2115/2115949.png'
            });
            console.log('[SubtitlesPlugin] Пункт добавлен через Manifest.settings');
        }
        // ЗАПАСНОЙ ВАРИАНТ: Прямое добавление в DOM (менее предпочтительно)
        else {
            console.warn('[SubtitlesPlugin] Стандартные методы не сработали, пробуем прямой рендер');
            
            // Создаем наблюдатель за появлением меню
            var observer = new MutationObserver(function(mutations) {
                var menu = document.querySelector('.menu__list');
                if (menu && !document.querySelector('#my-subtitles-menu-item')) {
                    var menuItem = $('<li class="menu__item" id="my-subtitles-menu-item">' +
                        '<a>' +
                        '<span class="menu__icon"><img src="https://cdn-icons-png.flaticon.com/512/2115/2115949.png" style="width:24px;height:24px"></span>' +
                        '<span class="menu__text">Субтитры</span>' +
                        '</a>' +
                        '</li>');
                    
                    menuItem.on('hover:enter', function() {
                        Lampa.Activity.push({
                            url: 'mysubtitles',
                            title: 'Настройки субтитров'
                        });
                    });
                    
                    $(menu).append(menuItem);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // Регистрация экрана настроек (исправленный синтаксис)
        if (Lampa.Activity && Lampa.Activity.add) {
            Lampa.Activity.add({
                url: 'mysubtitles',
                title: 'Настройки субтитров',
                component: 'mysubtitles'
            });
        } else if (Lampa.Activity && Lampa.Activity.temlate) {
            Lampa.Activity.temlate({
                url: 'mysubtitles',
                title: 'Настройки субтитров',
                component: 'mysubtitles',
                activity: 'mysubtitles'
            });
        }

        // Контроллер для экрана настроек
        Lampa.Controller.add('mysubtitles', {
            create: function(params) {
                console.log('[SubtitlesPlugin] Открыт экран настроек');
                var html = $('<div class="mysubtitles-wrapper">' +
                    '<div class="mysubtitles--inner">' +
                    '<h2>Настройки плагина субтитров</h2>' +
                    '<p>Здесь можно будет добавить источники субтитров.</p>' +
                    '<button class="selector">Закрыть</button>' +
                    '</div>' +
                    '</div>');
                
                html.find('button').on('hover:enter', function() {
                    Lampa.Back();
                });

                return html;
            }
        });

        // Остальная часть плагина (кнопка в плеере, загрузка субтитров) остается без изменений
        Lampa.Listener.follow('player', function(event) {
            if (event.type == 'ready') {
                console.log('[SubtitlesPlugin] Плеер готов. Добавляем кнопку.');
                
                // Более надежный поиск панели плеера
                var playerPanel = $('.player-controls__right');
                if (playerPanel.length === 0) {
                    playerPanel = $('.player-controls');
                }
                
                if (playerPanel.length > 0) {
                    var subButton = $('<div class="player-control__button" id="my-sub-btn" style="display: inline-block; width: 50px; text-align: center; cursor: pointer;">📜</div>');
                    
                    subButton.on('hover:enter', function() {
                        loadExternalSubtitles();
                    });
                    
                    playerPanel.append(subButton);
                } else {
                    console.warn('[SubtitlesPlugin] Панель плеера не найдена');
                }
            }
        });

        function loadExternalSubtitles() {
            // ... (функция остается без изменений)
        }
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') {
                startPlugin();
            }
        });
    }
})();