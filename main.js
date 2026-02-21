// ===================================================
// Плагин: Внешние субтитры для Lampa
// Описание: Добавляет кнопку в плеер для загрузки субтитров
// Версия: 1.0.0
// ===================================================

(function() {
    // Уникальный идентификатор плагина, чтобы избежать конфликтов и двойной загрузки
    var plugin_name = 'my_external_subtitles';
    // Флаг для предотвращения повторной инициализации
    if (window[plugin_name]) return;
    window[plugin_name] = true;

    // --- Функция инициализации плагина ---
    function startPlugin() {
        console.log('[SubtitlesPlugin] Запуск...');

        // 1. Регистрируем плагин в манифесте Lampa
        // Это добавит пункт "Субтитры" в главное меню приложения
        Lampa.Manifest.plugins.push({
            name: 'Субтитры',
            description: 'Загрузка внешних субтитров',
            url: 'mysubtitles', // Должен совпадать с url из manifest.json
            icon: 'https://cdn-icons-png.flaticon.com/512/2115/2115949.png',
            version: '1.0.0'
        });

        // 2. Создаем новый экран (Activity) для настроек
        // Этот экран будет открываться при выборе пункта меню "Субтитры"
        Lampa.Activity.temlate({
            url: 'mysubtitles', // Уникальный URL экрана
            title: 'Настройки субтитров', // Заголовок экрана
            component: 'mysubtitles', // Имя компонента для Controller
            activity: 'mysubtitles' // Тип активности
        });

        // 3. Создаем компонент, который будет отвечать за отображение содержимого экрана
        // Lampa.Controller используется для управления представлениями
        Lampa.Controller.add('mysubtitles', {
            create: function(params) {
                console.log('[SubtitlesPlugin] Открыт экран настроек');
                
                // Создаем HTML-структуру экрана
                var html = $('<div class="mysubtitles-wrapper"><div class="mysubtitles--inner"><h2>Настройки плагина субтитров</h2><p>Здесь можно будет добавить источники субтитров (OpenSubtitles, etc.).</p><button class="selector">Закрыть</button></div></div>');
                
                // Обработчик для кнопки "Закрыть"
                html.find('button').on('hover:enter', function() {
                    Lampa.Back(); // Возврат на предыдущий экран
                });

                // Возвращаем готовый HTML элемент для вставки в интерфейс
                return html;
            }
        });

        // 4. Главная фича: Кнопка в плеере для загрузки субтитров
        Lampa.Listener.follow('player', function(event) {
            // Событие 'player:ready' срабатывает, когда плеер полностью загрузился
            if (event.type == 'ready') {
                console.log('[SubtitlesPlugin] Плеер готов. Добавляем кнопку.');

                // Находим панель управления плеером или создаем свою.
                // Самый простой способ — добавить кнопку в правую часть элементов управления.
                var playerPanel = $('.player-controls__right'); // Примерный селектор, может отличаться

                // Наша новая кнопка
                var subButton = $('<div class="player-control__button" id="my-sub-btn" style="display: inline-block; width: 50px; text-align: center; cursor: pointer;">📜</div>');

                // Обработчик нажатия на кнопку
                subButton.on('hover:enter', function() {
                    loadExternalSubtitles();
                });

                // Добавляем кнопку на панель
                playerPanel.append(subButton);
            }
        });

        // Функция для загрузки и применения субтитров
        function loadExternalSubtitles() {
            // Получаем информацию о текущем контенте из плеера
            var currentVideo = Lampa.Player.getVideo(); // Предполагаемый метод API
            if (!currentVideo) {
                Lampa.Notify.show('Нет активного видео');
                return;
            }

            var movieId = currentVideo.id; // ID фильма
            var season = currentVideo.season; // Сезон для сериалов
            var episode = currentVideo.episode; // Эпизод

            console.log('[SubtitlesPlugin] Загружаем субтитры для:', movieId, 'S:', season, 'E:', episode);

            // Здесь должна быть логика запроса к API внешнего сервиса субтитров (например, OpenSubtitles)
            // Это демонстрационный пример с "заглушкой".
            var fakeSubtitleUrl = 'https://www.example.com/subtitles/' + movieId + '.vtt';

            // Создаем объект трека субтитров
            var subtitleTrack = {
                label: 'Внешние (EN)',
                kind: 'subtitles',
                src: fakeSubtitleUrl,
                srclang: 'en',
                'default': false
            };

            // Пытаемся добавить субтитры в плеер.
            // Используем Lampa.Player.addTracks или другой метод API для управления треками [citation:2]
            if (Lampa.Player && Lampa.Player.addTracks) {
                Lampa.Player.addTracks([subtitleTrack]);
                Lampa.Notify.show('Субтитры загружаются...');
            } else {
                // Альтернативный метод или заглушка, если API изменился
                console.warn('[SubtitlesPlugin] Метод addTracks не найден. API могло измениться.');
                
                // Пытаемся найти видео элемент и добавить <track> вручную
                var videoElement = document.querySelector('video');
                if (videoElement) {
                    var existingTrack = videoElement.querySelector('track[src="' + fakeSubtitleUrl + '"]');
                    if (!existingTrack) {
                        var track = document.createElement('track');
                        track.kind = subtitleTrack.kind;
                        track.label = subtitleTrack.label;
                        track.src = subtitleTrack.src;
                        track.srclang = subtitleTrack.srclang;
                        videoElement.appendChild(track);
                        videoElement.textTracks[0].mode = 'showing'; // Включаем первый трек
                        Lampa.Notify.show('Субтитры применены (ручной режим)');
                    }
                } else {
                    Lampa.Notify.show('Не удалось добавить субтитры');
                }
            }
        }
    }

    // --- Точка входа: проверяем, готова ли Lampa к загрузке плагинов ---
    if (window.appready) {
        // Если приложение уже загружено, запускаем сразу
        startPlugin();
    } else {
        // Если нет — ждем события готовности
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') {
                startPlugin();
            }
        });
    }

})();