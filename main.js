(function() {
    var plugin_name = 'lordserials_plugin';
    if (window[plugin_name]) return;
    window[plugin_name] = true;

    // Конфигурация плагина
    var CONFIG = {
        baseUrl: 'https://lordserials.fan',
        searchUrl: 'https://lordserials.fan/engine/ajax/search.php',
        proxyUrl: 'https://api.allorigins.win/raw?url=',
        pluginId: 'lordserials'
    };

    function startPlugin() {
        console.log('[LordSerials] Запуск плагина...');

        // Добавляем пункт в главное меню
        addMenuItem();

        // Регистрируем компонент для экрана поиска
        registerSearchComponent();

        // Регистрируем компонент для просмотра сериала
        registerSerialComponent();
    }

    // ============================================
    // ДОБАВЛЕНИЕ В МЕНЮ
    // ============================================
    function addMenuItem() {
        if (Lampa.Settings && Lampa.Settings.add) {
            Lampa.Settings.add({
                key: CONFIG.pluginId,
                name: 'LordSerials',
                description: 'Сериалы с lordserials.fan',
                icon: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'
            });
        }

        // Добавляем кнопку в меню категорий
        setTimeout(function() {
            var menu = $('.menu .menu__list').eq(0);
            if (menu.length > 0 && !document.querySelector('#lordserials-menu-item')) {
                var button = $('<div class="menu__item" id="lordserials-menu-item">' +
                    '<a>' +
                    '<span class="menu__icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;fill:currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></span>' +
                    '<span class="menu__text">LordSerials</span>' +
                    '</a>' +
                    '</div>');

                button.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: CONFIG.pluginId,
                        title: 'LordSerials - Поиск сериалов',
                        component: 'lordserials_search',
                        page: 1
                    });
                });

                menu.append(button);
            }
        }, 1000);
    }

    // ============================================
    // КОМПОНЕНТ ПОИСКА
    // ============================================
    function registerSearchComponent() {
        Lampa.Component.add('lordserials_search', function(object) {
            var self = this;
            var html = Lampa.Template.js('lordserials_search_template');
            var searchInput = '';
            var searchResults = [];

            this.create = function() {
                self.activity.loader(true);
                
                // Создаем интерфейс поиска
                var searchInterface = createSearchInterface();
                $(html).find('#lordserials-search-container').html(searchInterface);
                
                self.activity.loader(false);
            };

            this.render = function() {
                return html;
            };

            this.start = function() {
                Lampa.Controller.add('lordserials_search', {
                    toggle: function() {
                        Lampa.Controller.focus('lordserials_search_input');
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('lordserials_search');
            };

            function createSearchInterface() {
                var container = $('<div id="lordserials-search-container" style="padding:20px;"></div>');
                
                // Поле ввода поиска
                var searchBox = $('<div class="settings-input" style="margin-bottom:20px;">' +
                    '<input type="text" id="lordserials_search_input" class="settings-input__field" placeholder="Введите название сериала..." style="width:100%;padding:15px;font-size:18px;">' +
                    '<button id="lordserials_search_btn" class="settings-input__button" style="margin-top:10px;padding:15px 30px;font-size:16px;">Найти</button>' +
                    '</div>');
                
                container.append(searchBox);
                
                // Результаты поиска
                var resultsGrid = $('<div id="lordserials-results" class="cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;"></div>');
                container.append(resultsGrid);
                
                // Обработчик поиска
                searchBox.find('#lordserials_search_btn').on('hover:enter', function() {
                    var query = searchBox.find('#lordserials_search_input').val().trim();
                    if (query.length > 0) {
                        performSearch(query);
                    }
                });
                
                // Поддержка Enter
                searchBox.find('#lordserials_search_input').on('keydown', function(e) {
                    if (e.keyCode === 13) {
                        var query = $(this).val().trim();
                        if (query.length > 0) {
                            performSearch(query);
                        }
                    }
                });
                
                return container;
            }

            function performSearch(query) {
                self.activity.loader(true);
                console.log('[LordSerials] Поиск:', query);
                
                // Используем прокси для обхода CORS
                var searchUrl = CONFIG.baseUrl + '/index.php?do=search';
                var proxyUrl = CONFIG.proxyUrl + encodeURIComponent(searchUrl);
                
                // Пробуем несколько подходов к поиску
                $.ajax({
                    url: CONFIG.baseUrl + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(query),
                    type: 'GET',
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(data) {
                        console.log('[LordSerials] Поиск успешен');
                        parseSearchResults(data);
                    },
                    error: function(xhr, status, error) {
                        console.error('[LordSerials] Ошибка поиска:', error);
                        // Пробуем через прокси
                        $.ajax({
                            url: proxyUrl,
                            type: 'GET',
                            success: function(data) {
                                console.log('[LordSerials] Поиск через прокси успешен');
                                parseSearchResults(data);
                            },
                            error: function(xhr2, status2, error2) {
                                console.error('[LordSerials] Ошибка прокси:', error2);
                                self.activity.loader(false);
                                Lampa.Noty.show('Ошибка поиска. Сайт может быть недоступен.');
                            }
                        });
                    }
                });
            }

            function parseSearchResults(html) {
                var results = [];
                var $html = $(html);
                
                // Ищем карточки сериалов
                $html.find('.shortstory, .movie-card, .serial-card').each(function() {
                    var card = $(this);
                    var title = card.find('.title, h2, a').first().text().trim();
                    var link = card.find('a').first().attr('href');
                    var image = card.find('img').first().attr('src') || card.find('img').first().attr('data-src');
                    var description = card.find('.description, .info, .meta').first().text().trim();
                    
                    if (title && link) {
                        // Исправляем URL если относительный
                        if (link.startsWith('/')) {
                            link = CONFIG.baseUrl + link;
                        }
                        
                        results.push({
                            title: title,
                            url: link,
                            image: image || 'https://via.placeholder.com/200x300?text=No+Image',
                            description: description
                        });
                    }
                });
                
                // Если не нашли стандартные классы, пробуем другие
                if (results.length === 0) {
                    $html.find('a').each(function() {
                        var link = $(this);
                        var href = link.attr('href');
                        if (href && (href.includes('/serials/') || href.includes('/serial/'))) {
                            var title = link.text().trim() || link.find('img').attr('alt') || 'Без названия';
                            var image = link.find('img').first().attr('src') || link.find('img').first().attr('data-src');
                            
                            if (href.startsWith('/')) {
                                href = CONFIG.baseUrl + href;
                            }
                            
                            // Проверяем дубликаты
                            var exists = results.some(r => r.url === href);
                            if (!exists && title !== 'Без названия') {
                                results.push({
                                    title: title,
                                    url: href,
                                    image: image || 'https://via.placeholder.com/200x300?text=No+Image',
                                    description: ''
                                });
                            }
                        }
                    });
                }
                
                searchResults = results;
                displayResults(results);
                self.activity.loader(false);
            }

            function displayResults(results) {
                var resultsContainer = $('#lordserials-results');
                resultsContainer.empty();
                
                if (results.length === 0) {
                    resultsContainer.html('<p style="grid-column:1/-1;text-align:center;padding:40px;">Ничего не найдено</p>');
                    return;
                }
                
                results.forEach(function(item, index) {
                    var card = createResultCard(item, index);
                    resultsContainer.append(card);
                });
            }

            function createResultCard(item, index) {
                var card = $('<div class="card" style="cursor:pointer;" data-index="' + index + '">' +
                    '<div class="card-poster" style="position:relative;padding-bottom:150%;background:#1a1a1a;border-radius:8px;overflow:hidden;">' +
                    '<img src="' + item.image + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" onerror="this.src=\'https://via.placeholder.com/200x300?text=No+Image\'">' +
                    '</div>' +
                    '<div class="card-title" style="margin-top:10px;font-size:14px;font-weight:600;line-height:1.3;">' + item.title + '</div>' +
                    '</div>');
                
                card.on('hover:enter', function() {
                    Lampa.Activity.push({
                        url: 'lordserials_serial',
                        title: item.title,
                        component: 'lordserials_serial',
                        data: {
                            url: item.url,
                            title: item.title,
                            image: item.image
                        }
                    });
                });
                
                return card;
            }
        });

        // Добавим шаблон
        Lampa.Template.add('lordserials_search_template', 
            '<div class="activity" id="lordserials-search-activity">' +
            '<div class="activity__content" style="background:#0f0f0f;min-height:100vh;"></div>' +
            '</div>'
        );
    }

    // ============================================
    // КОМПОНЕНТ ПРОСМОТРА СЕРИАЛА
    // ============================================
    function registerSerialComponent() {
        Lampa.Component.add('lordserials_serial', function(object) {
            var self = this;
            var html = Lampa.Template.js('lordserials_serial_template');
            var serialData = object.data || {};
            var playerUrl = '';
            var episodes = [];

            this.create = function() {
                self.activity.loader(true);
                console.log('[LordSerials] Загрузка сериала:', serialData.url);
                
                loadSerialPage(serialData.url);
            };

            this.render = function() {
                return html;
            };

            this.start = function() {
                Lampa.Controller.add('lordserials_serial', {
                    toggle: function() {
                        Lampa.Controller.focus('lordserials_play_button');
                    },
                    back: function() {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('lordserials_serial');
            };

            function loadSerialPage(url) {
                var proxyUrl = CONFIG.proxyUrl + encodeURIComponent(url);
                
                $.ajax({
                    url: proxyUrl,
                    type: 'GET',
                    success: function(data) {
                        console.log('[LordSerials] Страница сериала загружена');
                        parseSerialPage(data);
                    },
                    error: function(xhr, status, error) {
                        console.error('[LordSerials] Ошибка загрузки страницы:', error);
                        self.activity.loader(false);
                        Lampa.Noty.show('Ошибка загрузки страницы сериала');
                    }
                });
            }

            function parseSerialPage(html) {
                var $html = $(html);
                
                // Ищем плеер
                var iframeSrc = '';
                var videoUrl = '';
                
                // Ищем iframe
                var iframe = $html.find('iframe[src*="video"], iframe[src*="player"], iframe[src*="embed"]').first();
                if (iframe.length > 0) {
                    iframeSrc = iframe.attr('src');
                    console.log('[LordSerials] Найден iframe:', iframeSrc);
                }
                
                // Ищем video тег
                var videoTag = $html.find('video source[src]');
                if (videoTag.length > 0) {
                    videoUrl = videoTag.attr('src');
                    console.log('[LordSerials] Найден video:', videoUrl);
                }
                
                // Ищем скрипт с данными
                var scriptData = $html.find('script:contains("player"), script:contains("video")').text();
                if (scriptData) {
                    console.log('[LordSerials] Найден скрипт с данными плеера');
                    // Пытаемся извлечь URL плеера
                    var playerMatch = scriptData.match(/['"]player_url['"]\s*:\s*['"]([^'"]+)['"]/);
                    if (playerMatch && playerMatch[1]) {
                        iframeSrc = playerMatch[1];
                        console.log('[LordSerials] URL плеера из скрипта:', iframeSrc);
                    }
                }
                
                // Ищем сезоны и серии
                episodes = parseEpisodes($html);
                
                // Отображаем интерфейс
                displaySerialInterface(iframeSrc || videoUrl, episodes);
                self.activity.loader(false);
            }

            function parseEpisodes($html) {
                var eps = [];
                
                // Ищем список серий
                $html.find('.episode-list li, .season-episode, .episode-item, .series-item').each(function() {
                    var item = $(this);
                    var title = item.find('.title, .episode-title, a').first().text().trim();
                    var videoUrl = item.find('a').attr('href') || item.data('url');
                    var season = item.data('season') || 1;
                    var episode = item.data('episode') || eps.length + 1;
                    
                    if (title) {
                        eps.push({
                            title: title,
                            url: videoUrl,
                            season: parseInt(season),
                            episode: parseInt(episode)
                        });
                    }
                });
                
                // Если не нашли стандартные классы, пробуем другие
                if (eps.length === 0) {
                    $html.find('[data-video], [data-url*="video"], [data-player]').each(function() {
                        var item = $(this);
                        var title = item.find('.title, span, div').first().text().trim() || 'Серия ' + (eps.length + 1);
                        var videoUrl = item.data('video') || item.data('url') || item.data('player');
                        
                        if (videoUrl) {
                            eps.push({
                                title: title,
                                url: videoUrl,
                                season: 1,
                                episode: eps.length + 1
                            });
                        }
                    });
                }
                
                console.log('[LordSerials] Найдено серий:', eps.length);
                return eps;
            }

            function displaySerialInterface(videoUrl, episodes) {
                var container = $(html).find('.activity__content');
                container.empty();
                
                // Заголовок
                var header = $('<div style="padding:20px;background:linear-gradient(180deg,#1a1a1a 0%,#0f0f0f 100%);">' +
                    '<h1 style="font-size:28px;font-weight:700;margin-bottom:10px;">' + serialData.title + '</h1>' +
                    '<p style="color:#888;">Сериал с lordserials.fan</p>' +
                    '</div>');
                container.append(header);
                
                // Кнопка воспроизведения
                if (videoUrl || episodes.length > 0) {
                    var playButton = $('<div class="button" id="lordserials_play_button" style="margin:20px;padding:20px 40px;background:#e50914;color:white;font-size:18px;font-weight:600;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;">' +
                        '<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>' +
                        'Смотреть' +
                        '</div>');
                    
                    playButton.on('hover:enter', function() {
                        var firstVideo = videoUrl || (episodes[0] ? episodes[0].url : null);
                        if (firstVideo) {
                            playVideo(firstVideo, serialData.title);
                        }
                    });
                    
                    container.append(playButton);
                }
                
                // Список серий
                if (episodes.length > 0) {
                    var episodesSection = $('<div style="padding:20px;">' +
                        '<h2 style="font-size:22px;font-weight:600;margin-bottom:20px;">Серии</h2>' +
                        '<div id="lordserials-episodes-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px;"></div>' +
                        '</div>');
                    
                    var episodesList = episodesSection.find('#lordserials-episodes-list');
                    
                    episodes.forEach(function(ep, index) {
                        var epCard = $('<div class="episode-card" style="padding:15px;background:#1a1a1a;border-radius:8px;cursor:pointer;" data-index="' + index + '">' +
                            '<div style="font-size:14px;font-weight:600;margin-bottom:5px;">Серия ' + ep.episode + '</div>' +
                            '<div style="font-size:13px;color:#888;">' + ep.title + '</div>' +
                            '</div>');
                        
                        epCard.on('hover:enter', function() {
                            if (ep.url) {
                                playVideo(ep.url, serialData.title + ' - Серия ' + ep.episode);
                            } else {
                                Lampa.Noty.show('Видео для этой серии недоступно');
                            }
                        });
                        
                        episodesList.append(epCard);
                    });
                    
                    container.append(episodesSection);
                }
                
                // Кнопка выбора сезона (если есть несколько сезонов)
                var seasons = [...new Set(episodes.map(e => e.season))];
                if (seasons.length > 1) {
                    var seasonSelector = $('<div style="padding:0 20px 20px;">' +
                        '<button id="lordserials-season-select" class="button" style="padding:15px 30px;background:#333;color:white;font-size:16px;border-radius:8px;cursor:pointer;">Выбрать сезон</button>' +
                        '</div>');
                    
                    seasonSelector.find('#lordserials-season-select').on('hover:enter', function() {
                        var seasonItems = seasons.map(s => ({
                            title: 'Сезон ' + s,
                            season: s
                        }));
                        
                        Lampa.Select.show({
                            title: 'Выберите сезон',
                            items: seasonItems,
                            onSelect: function(item) {
                                filterBySeason(item.season);
                            },
                            onBack: function() {
                                Lampa.Controller.toggle('lordserials_serial');
                            }
                        });
                    });
                    
                    container.append(seasonSelector);
                }
            }

            function filterBySeason(season) {
                var filteredEpisodes = episodes.filter(e => e.season === season);
                console.log('[LordSerials] Фильтр по сезону', season, ':', filteredEpisodes.length, 'серий');
                // Перерисовываем список серий
                $('#lordserials-episodes-list').empty();
                filteredEpisodes.forEach(function(ep, index) {
                    var epCard = $('<div class="episode-card" style="padding:15px;background:#1a1a1a;border-radius:8px;cursor:pointer;">' +
                        '<div style="font-size:14px;font-weight:600;margin-bottom:5px;">Серия ' + ep.episode + '</div>' +
                        '<div style="font-size:13px;color:#888;">' + ep.title + '</div>' +
                        '</div>');
                    
                    epCard.on('hover:enter', function() {
                        if (ep.url) {
                            playVideo(ep.url, serialData.title + ' - Серия ' + ep.episode);
                        } else {
                            Lampa.Noty.show('Видео для этой серии недоступно');
                        }
                    });
                    
                    $('#lordserials-episodes-list').append(epCard);
                });
            }

            function playVideo(url, title) {
                console.log('[LordSerials] Запуск видео:', url, title);
                
                // Проверяем, это iframe или прямой URL видео
                if (url.includes('http') && !url.match(/\.(m3u8|mp4|webm|mkv)($|\?)/i)) {
                    // Это скорее всего iframe или страница с плеером
                    // Пробуем извлечь прямой URL видео
                    extractVideoFromPlayer(url, title);
                } else {
                    // Прямой URL видео
                    var video = {
                        title: title,
                        url: url,
                        quality: '720p'
                    };
                    
                    Lampa.Player.play(video);
                    Lampa.Noty.show('Запуск: ' + title);
                }
            }

            function extractVideoFromPlayer(playerUrl, title) {
                self.activity.loader(true);
                console.log('[LordSerials] Извлечение видео из плеера:', playerUrl);
                
                // Если это iframe с того же домена
                if (playerUrl.includes(CONFIG.baseUrl)) {
                    $.ajax({
                        url: CONFIG.proxyUrl + encodeURIComponent(playerUrl),
                        type: 'GET',
                        success: function(data) {
                            var $playerHtml = $(data);
                            var videoSrc = $playerHtml.find('video source').attr('src') || 
                                          $playerHtml.find('video').attr('src') ||
                                          $playerHtml.find('iframe').attr('src');
                            
                            self.activity.loader(false);
                            
                            if (videoSrc) {
                                console.log('[LordSerials] Найден видео источник:', videoSrc);
                                Lampa.Player.play({
                                    title: title,
                                    url: videoSrc,
                                    quality: '720p'
                                });
                            } else {
                                Lampa.Noty.show('Не удалось найти видео источник');
                            }
                        },
                        error: function(xhr, status, error) {
                            self.activity.loader(false);
                            console.error('[LordSerials] Ошибка извлечения видео:', error);
                            Lampa.Noty.show('Ошибка загрузки плеера');
                        }
                    });
                } else {
                    // Сторонний плеер - пробуем открыть напрямую
                    self.activity.loader(false);
                    Lampa.Player.play({
                        title: title,
                        url: playerUrl,
                        quality: '720p'
                    });
                }
            }
        });

        // Добавим шаблон
        Lampa.Template.add('lordserials_serial_template', 
            '<div class="activity" id="lordserials-serial-activity">' +
            '<div class="activity__content" style="background:#0f0f0f;min-height:100vh;"></div>' +
            '</div>'
        );
    }

    // ============================================
    // ЗАПУСК ПЛАГИНА
    // ============================================
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
