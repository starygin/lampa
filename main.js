(function() {
    var plugin_name = 'lordserials_plugin';
    if (window[plugin_name]) {
        console.error('[LordSerials] Плагин уже загружен! Выход.');
        return;
    }
    window[plugin_name] = true;
    
    console.log('[LordSerials] ========================================');
    console.log('[LordSerials] ЗАГРУЗКА ПЛАГИНА НАЧАЛАСЬ');
    console.log('[LordSerials] window:', !!window);
    console.log('[LordSerials] window.Lampa:', !!window.Lampa);
    console.log('[LordSerials] Lampa.Activity:', !!(window.Lampa && window.Lampa.Activity));
    console.log('[LordSerials] Lampa.Component:', !!(window.Lampa && window.Lampa.Component));
    console.log('[LordSerials] Lampa.Settings:', !!(window.Lampa && window.Lampa.Settings));
    console.log('[LordSerials] ========================================');

    // Конфигурация плагина
    var CONFIG = {
        baseUrl: 'https://lordserials.fan',
        searchUrl: 'https://lordserials.fan/engine/ajax/search.php',
        pluginId: 'lordserials',
        requestTimeout: 15000,
        searchDebounceMs: 500
    };
    var PLUGIN_STATE = {
        started: false,
        registered: false
    };

    function notify(message) {
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(message);
    }

    function normalizeUrl(url) {
        if (!url) return '';
        if (/^\/\//.test(url)) return 'https:' + url;
        if (/^\//.test(url)) return CONFIG.baseUrl + url;
        return url;
    }

    function requestPage(url, onSuccess, onError) {
        console.log('[LordSerials] Direct request URL:', url);
        $.ajax({
            url: url,
            type: 'GET',
            timeout: CONFIG.requestTimeout,
            success: function(data) {
                if (!data || (typeof data === 'string' && data.trim().length < 20)) {
                    if (onError) onError(null, 'empty_response', 'empty direct response');
                    return;
                }
                console.log('[LordSerials] Direct request success');
                onSuccess(data);
            },
            error: function(xhr, status, error) {
                if (onError) onError(xhr, status, error || 'direct request failed');
            }
        });
    }

    function startPlugin() {
        console.log('[LordSerials] startPlugin ВЫЗВАН!');
        console.log('[LordSerials] Lampa:', window.Lampa ? 'найден' : 'НЕ НАЙДЕН');
        
        try {
            if (PLUGIN_STATE.started) return;
            // Проверяем наличие необходимых модулей Lampa
            if (!window.Lampa) {
                console.error('[LordSerials] Lampa не найден!');
                return;
            }
            if (!Lampa.Activity) {
                console.error('[LordSerials] Lampa.Activity не найден!');
                return;
            }
            if (!Lampa.Component) {
                console.error('[LordSerials] Lampa.Component не найден!');
                return;
            }
            
            console.log('[LordSerials] Все модули Lampa доступны');
            
            // Пробуем добавить тестовое сообщение через Noty
            if (Lampa.Noty) {
                Lampa.Noty.show('LordSerials загружен!');
                console.log('[LordSerials] Noty.show вызван');
            }

            if (!PLUGIN_STATE.registered) {
                console.log('[LordSerials] Вызов addMenuItem...');
                addMenuItem();
                console.log('[LordSerials] Вызов registerSearchComponent...');
                registerSearchComponent();
                console.log('[LordSerials] Вызов registerSerialComponent...');
                registerSerialComponent();
                PLUGIN_STATE.registered = true;
            }
            PLUGIN_STATE.started = true;
            
            console.log('[LordSerials] Плагин успешно инициализирован');
            console.log('[LordSerials] ========================================');
        } catch(err) {
            console.error('[LordSerials] Ошибка в startPlugin:', err);
            console.error('[LordSerials] Stack:', err.stack);
        }
    }

    // ============================================
    // ДОБАВЛЕНИЕ В МЕНЮ
    // ============================================
    function addMenuItem() {
        console.log('[LordSerials] addMenuItem ВЫЗВАН!');
        
        // Проверяем Lampa.Settings
        console.log('[LordSerials] Lampa.Settings:', !!Lampa.Settings);
        console.log('[LordSerials] Lampa.Settings.add:', !!(Lampa.Settings && Lampa.Settings.add));
        
        // Добавляем кнопку напрямую в главное меню
        setTimeout(function addMenuButton() {
            console.log('[LordSerials] addMenuButton вызван (setTimeout)');
            
            // Ищем главное меню
            var menu = $('.menu .menu__list').eq(0);
            console.log('[LordSerials] Меню найдено:', menu.length > 0, 'menu.length:', menu.length);
            
            if (menu.length > 0 && !document.querySelector('#lordserials-menu-item')) {
                console.log('[LordSerials] Создаем кнопку меню');
                
                var buttonHtml = '<div class="menu__item" id="lordserials-menu-item" style="cursor:pointer;">' +
                    '<a>' +
                    '<span class="menu__icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;fill:currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></span>' +
                    '<span class="menu__text">LordSerials</span>' +
                    '</a>' +
                    '</div>';
                
                var button = $(buttonHtml);

                button.on('click', function(e) {
                    console.log('[LordSerials] Клик по кнопке меню!');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        console.log('[LordSerials] Вызов Lampa.Activity.push...');
                        Lampa.Activity.push({
                            url: CONFIG.pluginId,
                            title: 'LordSerials - Поиск сериалов',
                            component: 'lordserials_search',
                            page: 1
                        });
                        console.log('[LordSerials] Activity.push успешен');
                    } catch(err) {
                        console.error('[LordSerials] Ошибка Activity.push:', err);
                        console.error('[LordSerials] Stack:', err.stack);
                        if (Lampa.Noty) {
                            notify('Ошибка: ' + err.message);
                        }
                    }
                });

                menu.append(button);
                console.log('[LordSerials] Кнопка добавлена в меню');
            } else if (menu.length === 0) {
                console.log('[LordSerials] Меню не найдено, пробуем еще раз через 500мс');
                setTimeout(addMenuButton, 500);
            }
        }, 500);
        
        // Наблюдатель на случай если меню динамическое
        var observer = new MutationObserver(function(mutations) {
            var menu = $('.menu .menu__list').eq(0);
            if (menu.length > 0 && !document.querySelector('#lordserials-menu-item')) {
                console.log('[LordSerials] Observer: меню обнаружено');
                
                var buttonHtml = '<div class="menu__item" id="lordserials-menu-item" style="cursor:pointer;">' +
                    '<a>' +
                    '<span class="menu__icon"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px;fill:currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg></span>' +
                    '<span class="menu__text">LordSerials</span>' +
                    '</a>' +
                    '</div>';
                
                var button = $(buttonHtml);

                button.on('click', function(e) {
                    console.log('[LordSerials] Observer: клик по кнопке!');
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        Lampa.Activity.push({
                            url: CONFIG.pluginId,
                            title: 'LordSerials - Поиск сериалов',
                            component: 'lordserials_search',
                            page: 1
                        });
                    } catch(err) {
                        console.error('[LordSerials] Observer ошибка:', err);
                    }
                });

                menu.append(button);
                console.log('[LordSerials] Observer: кнопка добавлена');
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        console.log('[LordSerials] Observer запущен');
    }

    // ============================================
    // КОМПОНЕНТ ПОИСКА
    // ============================================
    function registerSearchComponent() {
        console.log('[LordSerials] Регистрируем компонент поиска...');
        
        Lampa.Component.add('lordserials_search', function(object) {
            console.log('[LordSerials] Создаем компонент поиска', object);
            
            var self = this;
            var searchResults = [];
            var searchTimer = null;
            var mainContainer = null;

            this.create = function() {
                console.log('[LordSerials] Component create вызван');
                self.activity.loader(false);
                
                // Создаем простой HTML для теста
                mainContainer = createSearchInterface();
                
                console.log('[LordSerials] mainContainer:', mainContainer);
                console.log('[LordSerials] mainContainer.length:', mainContainer ? mainContainer.length : 'null');
                console.log('[LordSerials] mainContainer.html():', mainContainer ? mainContainer.html().substring(0, 200) : 'null');
                console.log('[LordSerials] Component create завершен');
            };

            this.render = function() {
                console.log('[LordSerials] Component render вызван');
                console.log('[LordSerials] Возвращаем mainContainer:', mainContainer);
                if (!mainContainer) {
                    console.log('[LordSerials] Создаем дефолтный контейнер');
                    mainContainer = $('<div class="lordserials-search-screen" style="padding:20px;color:white;"><h1>LordSerials</h1><p>Плагин загружен!</p></div>');
                }
                return mainContainer;
            };

            this.start = function() {
                console.log('[LordSerials] Component start вызван');
                Lampa.Controller.add('lordserials_search', {
                    toggle: function() {
                        console.log('[LordSerials] Controller toggle');
                    },
                    back: function() {
                        console.log('[LordSerials] Controller back');
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('lordserials_search');
            };

            function createSearchInterface() {
                console.log('[LordSerials] Создаем интерфейс поиска - START');
                
                // Простая структура для теста
                var html = '<div class="lordserials-search-screen" style="background:#0f0f0f;min-height:100%;padding:20px;">' +
                    '<h1 style="color:white;font-size:28px;margin-bottom:20px;">Поиск сериалов</h1>' +
                    '<input type="text" id="lordserials_search_input" placeholder="Введите название сериала..." style="width:100%;padding:15px;font-size:18px;background:#1a1a1a;color:#fff;border:1px solid #333;border-radius:8px;margin-bottom:15px;">' +
                    '<button id="lordserials_search_btn" style="padding:15px 40px;font-size:16px;background:#e50914;color:#fff;border:none;border-radius:8px;cursor:pointer;">Найти</button>' +
                    '<div id="lordserials-results" style="margin-top:30px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;"></div>' +
                    '</div>';
                
                var wrapper = $(html);
                
                console.log('[LordSerials] wrapper создан:', wrapper.length);
                console.log('[LordSerials] wrapper.html():', wrapper.html().substring(0, 100));
                
                // Обработчики привязываем к локальному контейнеру компонента
                var btn = wrapper.find('#lordserials_search_btn');
                var input = wrapper.find('#lordserials_search_input');
                
                btn.on('click', function() {
                    var query = input.val().trim();
                    console.log('[LordSerials] Клик по кнопке, query:', query);
                    if (query) performSearch(query);
                });
                
                input.on('input', function() {
                    clearTimeout(searchTimer);
                    var value = input.val().trim();
                    if (!value) {
                        wrapper.find('#lordserials-results').empty();
                        return;
                    }
                    searchTimer = setTimeout(function() {
                        performSearch(value);
                    }, CONFIG.searchDebounceMs);
                });
                
                input.on('keydown', function(e) {
                    if (e.keyCode === 13) {
                        var query = input.val().trim();
                        console.log('[LordSerials] Enter, query:', query);
                        if (query) performSearch(query);
                    }
                });
                
                setTimeout(function() {
                    input.trigger('focus');
                }, 0);
                
                console.log('[LordSerials] Создаем интерфейс поиска - END');
                return wrapper;
            }

            function performSearch(query) {
                console.log('[LordSerials] performSearch вызван с query:', query);
                console.log('[LordSerials] self:', self);
                console.log('[LordSerials] self.activity:', self.activity);
                
                if (!self || !self.activity) {
                    console.error('[LordSerials] self.activity не найден!');
                    notify('Ошибка интерфейса поиска');
                    return;
                }
                
                self.activity.loader(true);
                
                var searchUrl = CONFIG.baseUrl + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(query);
                console.log('[LordSerials] Search query raw:', query);
                console.log('[LordSerials] Search query encoded:', encodeURIComponent(query));
                console.log('[LordSerials] URL поиска:', searchUrl);
                requestPage(searchUrl, function(data) {
                    console.log('[LordSerials] Поиск успешен, данных:', data ? data.length : 0);
                    parseSearchResults(data);
                }, function(xhr, status, error) {
                    console.error('[LordSerials] Ошибка поиска:', status, error);
                    self.activity.loader(false);
                    notify('Ошибка поиска: сайт недоступен или блокирует запрос.');
                });
            }

            function parseSearchResults(html) {
                console.log('[LordSerials] Парсим результаты поиска');
                var results = [];
                var $html = $(html);
                var rawHtml = String(html || '');
                var parserDoc = null;
                try {
                    parserDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
                } catch (e) {
                    console.warn('[LordSerials] DOMParser failed:', e);
                }
                
                // Ищем карточки сериалов - разные возможные селекторы
                var selectors = [
                    '.shortstory',
                    '.movie-card', 
                    '.serial-card',
                    '.film-card',
                    '.movie-item',
                    '[itemtype*="Movie"]',
                    'a[href*="/serials/"]',
                    'a[href*="/serial/"]'
                ];
                
                selectors.forEach(function(selector) {
                    $html.find(selector).each(function() {
                        var card = $(this);
                        var title = card.find('.title, h2, h3, a').first().text().trim();
                        var link = card.attr('href') || card.find('a').first().attr('href');
                        var image = card.find('img').first().attr('src') || card.find('img').first().attr('data-src');
                        var description = card.find('.description, .info, .meta, .year').first().text().trim();
                        if (!title) {
                            title = card.attr('title') || card.find('a').first().attr('title') || card.find('img').first().attr('alt') || '';
                            title = title.trim();
                        }
                        
                        if (title && link) {
                            // Исправляем URL если относительный
                            link = normalizeUrl(link);
                            image = normalizeUrl(image);
                            
                            // Проверяем дубликаты
                            var exists = results.some(function(r) { return r.url === link; });
                            if (!exists) {
                                results.push({
                                    title: title,
                                    url: link,
                                    image: image || 'https://via.placeholder.com/200x300?text=No+Image',
                                    description: description
                                });
                            }
                        }
                    });
                });

                // Fallback: если карточки не разобрались, извлекаем прямые ссылки regex-ом.
                if (results.length === 0 && rawHtml) {
                    var linkRegex = /<a[^>]+href=["']([^"']*(?:\/serials?\/|\/tv-series\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
                    var match;
                    while ((match = linkRegex.exec(rawHtml)) !== null) {
                        var href = normalizeUrl(match[1] || '');
                        var text = String(match[2] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        if (!text) text = 'Сериал';
                        if (href) {
                            var existsByHref = results.some(function(r) { return r.url === href; });
                            if (!existsByHref) {
                                results.push({
                                    title: text,
                                    url: href,
                                    image: 'https://via.placeholder.com/200x300?text=No+Image',
                                    description: ''
                                });
                            }
                        }
                        if (results.length >= 40) break;
                    }
                }

                // Универсальный fallback: пробег по всем ссылкам HTML (часто у сайта меняются классы карточек).
                if (results.length === 0 && parserDoc) {
                    var anchors = parserDoc.querySelectorAll('a[href]');
                    for (var i = 0; i < anchors.length; i++) {
                        var a = anchors[i];
                        var hrefRaw = a.getAttribute('href') || '';
                        var href = normalizeUrl(hrefRaw);
                        var text = (a.textContent || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
                        var lowerHref = href.toLowerCase();

                        if (!href || href.indexOf('javascript:') === 0) continue;
                        if (lowerHref.indexOf('/index.php?') >= 0) continue;
                        if (lowerHref.indexOf('/page/') >= 0) continue;
                        if (!(/\/serials?\//i.test(lowerHref) || /\.html(\?|$)/i.test(lowerHref))) continue;
                        if (!text || text.length < 2) continue;

                        var existsUniversal = results.some(function(r) { return r.url === href; });
                        if (existsUniversal) continue;

                        var img = a.querySelector('img');
                        var imgUrl = img ? normalizeUrl(img.getAttribute('src') || img.getAttribute('data-src') || '') : '';
                        results.push({
                            title: text,
                            url: href,
                            image: imgUrl || 'https://via.placeholder.com/200x300?text=No+Image',
                            description: ''
                        });
                        if (results.length >= 40) break;
                    }
                }
                
                console.log('[LordSerials] Найдено результатов:', results.length);
                console.log('[LordSerials] HTML length:', rawHtml.length);
                searchResults = results;
                displayResults(results);
                self.activity.loader(false);
                if (!results.length) {
                    if (/cloudflare|attention required|access denied|captcha/i.test(rawHtml)) {
                        notify('Сайт защищён от запросов (Cloudflare/CAPTCHA). Попробуйте позже.');
                    } else {
                        notify('Ничего не найдено или сайт вернул неполные данные.');
                    }
                }
            }

            function displayResults(results) {
                console.log('[LordSerials] Отображаем результаты:', results.length);
                var resultsContainer = $('#lordserials-results');
                resultsContainer.empty();
                
                if (results.length === 0) {
                    resultsContainer.html('<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Ничего не найдено. Попробуйте другой запрос.</p>');
                    return;
                }
                
                results.forEach(function(item, index) {
                    var card = createResultCard(item, index);
                    resultsContainer.append(card);
                });
            }

            function createResultCard(item, index) {
                var card = $('<div class="card lordserials-card" style="cursor:pointer;" data-index="' + index + '">' +
                    '<div class="card-poster" style="position:relative;padding-bottom:150%;background:#1a1a1a;border-radius:8px;overflow:hidden;">' +
                    '<img src="' + item.image + '" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" onerror="this.src=\'https://via.placeholder.com/200x300?text=No+Image\'">' +
                    '</div>' +
                    '<div class="card-title" style="margin-top:10px;font-size:14px;font-weight:600;line-height:1.3;color:#fff;">' + item.title + '</div>' +
                    '</div>');
                
                // Используем jQuery.on('click')
                card.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[LordSerials] Клик по карточке:', item.title);
                    try {
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
                    } catch(err) {
                        console.error('[LordSerials] Ошибка перехода к сериалу:', err);
                        notify('Ошибка: ' + err.message);
                    }
                });
                
                return card;
            }
        });
        
        console.log('[LordSerials] Компонент поиска зарегистрирован');
    }

    // ============================================
    // КОМПОНЕНТ ПРОСМОТРА СЕРИАЛА
    // ============================================
    function registerSerialComponent() {
        console.log('[LordSerials] Регистрируем компонент сериала...');
        
        Lampa.Component.add('lordserials_serial', function(object) {
            console.log('[LordSerials] Создаем компонент сериала', object);
            
            var self = this;
            var serialData = object.data || {};
            var playerUrl = '';
            var episodes = [];
            var mainContainer = null;

            this.create = function() {
                console.log('[LordSerials] Component create вызван', serialData);
                self.activity.loader(true);
                
                // Создаем интерфейс
                mainContainer = createSerialInterface();
                
                console.log('[LordSerials] Загрузка сериала:', serialData.url);
                loadSerialPage(serialData.url);
            };

            this.render = function() {
                console.log('[LordSerials] Component render вызван');
                return mainContainer || $('<div class="activity"><div class="activity__content">Загрузка...</div></div>');
            };

            this.start = function() {
                console.log('[LordSerials] Component start вызван');
                Lampa.Controller.add('lordserials_serial', {
                    toggle: function() {
                        console.log('[LordSerials] Controller toggle');
                    },
                    back: function() {
                        console.log('[LordSerials] Controller back');
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('lordserials_serial');
            };
            
            function createSerialInterface() {
                console.log('[LordSerials] Создаем интерфейс сериала');
                var wrapper = $('<div class="activity"><div class="activity__content" style="background:#0f0f0f;min-height:100vh;"></div></div>');
                return wrapper;
            }

            function loadSerialPage(url) {
                requestPage(url, function(data) {
                    console.log('[LordSerials] Страница сериала загружена');
                    parseSerialPage(data);
                }, function(xhr, status, error) {
                    console.error('[LordSerials] Ошибка загрузки страницы:', error);
                    self.activity.loader(false);
                    notify('Ошибка загрузки страницы сериала');
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
                console.log('[LordSerials] Отображаем интерфейс сериала');
                
                // Находим контейнер внутри mainContainer
                var container = mainContainer.find('.activity__content');
                if (container.length === 0) {
                    console.error('[LordSerials] activity__content не найден!');
                    return;
                }
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

                    playButton.on('click', function(e) {
                        e.preventDefault();
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

                        epCard.on('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (ep.url) {
                                playVideo(ep.url, serialData.title + ' - Серия ' + ep.episode);
                            } else {
                                notify('Видео для этой серии недоступно');
                            }
                        });

                        episodesList.append(epCard);
                    });

                    container.append(episodesSection);
                }

                // Кнопка выбора сезона (если есть несколько сезонов)
                var seasonMap = {};
                episodes.forEach(function(e) { seasonMap[e.season] = true; });
                var seasons = Object.keys(seasonMap).map(function(s) { return parseInt(s); });
                if (seasons.length > 1) {
                    var seasonSelector = $('<div style="padding:0 20px 20px;">' +
                        '<button id="lordserials-season-select" class="button" style="padding:15px 30px;background:#333;color:white;font-size:16px;border-radius:8px;cursor:pointer;">Выбрать сезон</button>' +
                        '</div>');

                    seasonSelector.find('#lordserials-season-select').on('click', function(e) {
                        e.preventDefault();
                        var seasonItems = seasons.map(function(s) {
                            return {
                                title: 'Сезон ' + s,
                                season: s
                            };
                        });

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
                
                console.log('[LordSerials] Интерфейс сериала отображен');
            }

            function filterBySeason(season) {
                var filteredEpisodes = episodes.filter(function(e) { return e.season === season; });
                console.log('[LordSerials] Фильтр по сезону', season, ':', filteredEpisodes.length, 'серий');
                // Перерисовываем список серий
                $('#lordserials-episodes-list').empty();
                filteredEpisodes.forEach(function(ep, index) {
                    var epCard = $('<div class="episode-card" style="padding:15px;background:#1a1a1a;border-radius:8px;cursor:pointer;">' +
                        '<div style="font-size:14px;font-weight:600;margin-bottom:5px;">Серия ' + ep.episode + '</div>' +
                        '<div style="font-size:13px;color:#888;">' + ep.title + '</div>' +
                        '</div>');
                    
                    epCard.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (ep.url) {
                            playVideo(ep.url, serialData.title + ' - Серия ' + ep.episode);
                        } else {
                            notify('Видео для этой серии недоступно');
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
                    
                    if (Lampa.Player && Lampa.Player.play) {
                        Lampa.Player.play(video);
                        notify('Запуск: ' + title);
                    } else {
                        notify('Плеер Lampa недоступен');
                    }
                }
            }

            function extractVideoFromPlayer(playerUrl, title) {
                self.activity.loader(true);
                console.log('[LordSerials] Извлечение видео из плеера:', playerUrl);
                
                // Если это iframe с того же домена
                if (playerUrl.includes(CONFIG.baseUrl)) {
                    requestPage(playerUrl, function(data) {
                            var $playerHtml = $(data);
                            var videoSrc = $playerHtml.find('video source').attr('src') || 
                                          $playerHtml.find('video').attr('src') ||
                                          $playerHtml.find('iframe').attr('src');
                            
                            self.activity.loader(false);
                            
                            if (videoSrc) {
                                console.log('[LordSerials] Найден видео источник:', videoSrc);
                                if (Lampa.Player && Lampa.Player.play) {
                                    Lampa.Player.play({
                                        title: title,
                                        url: normalizeUrl(videoSrc),
                                        quality: '720p'
                                    });
                                } else {
                                    notify('Плеер Lampa недоступен');
                                }
                            } else {
                                notify('Не удалось найти видео источник');
                            }
                        }, function(xhr, status, error) {
                            self.activity.loader(false);
                            console.error('[LordSerials] Ошибка извлечения видео:', error);
                            notify('Ошибка загрузки плеера');
                        });
                } else {
                    // Сторонний плеер - пробуем открыть напрямую
                    self.activity.loader(false);
                    if (Lampa.Player && Lampa.Player.play) {
                        Lampa.Player.play({
                            title: title,
                            url: normalizeUrl(playerUrl),
                            quality: '720p'
                        });
                    } else {
                        notify('Плеер Lampa недоступен');
                    }
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
    console.log('[LordSerials] Проверка запуска...');
    console.log('[LordSerials] window.appready:', window.appready);
    console.log('[LordSerials] Lampa.Listener:', !!window.Lampa?.Listener);
    
    if (window.appready) {
        console.log('[LordSerials] appready=true, запускаем startPlugin()');
        startPlugin();
    } else {
        console.log('[LordSerials] appready=false, подписываемся на Lampa.Listener');
        if (Lampa && Lampa.Listener) {
            Lampa.Listener.follow('app', function(e) {
                console.log('[LordSerials] Событие app:', e.type);
                if (e.type == 'ready') {
                    console.log('[LordSerials] app.ready, запускаем startPlugin()');
                    startPlugin();
                }
            });
        } else {
            console.error('[LordSerials] Lampa.Listener не найден!');
        }
    }
})();
