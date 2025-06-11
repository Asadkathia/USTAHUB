/**
 * UstaHub Internationalization System (i18n.js)
 * Core module for handling multi-language support across the UstaHub platform
 * 
 * This module provides:
 * - Language detection and switching
 * - Translation loading and management
 * - DOM element translation
 * - RTL support
 */

window.UstaI18n = (function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    // Available languages (corresponding to JSON files in assets/lang/)
    availableLangs: ['en', 'ru', 'kk', 'ar', 'uz'],
    
    // Default language (fallback)
    defaultLang: 'en',
    
    // Path to language files
    langPath: 'assets/lang/',
    
    // Local storage key for saving language preference
    storageName: 'ustahub_language',
    
    // Selectors for elements with translations
    selectors: {
      container: '[data-i18n]',
      placeholder: '[data-i18n-placeholder]',
      ariaLabel: '[data-i18n-aria-label]'
    },
    
    // Debug mode (set to false in production)
    debug: false,
    
    // Flag placeholders as SVG data URLs (used when flag image files aren't available)
    flags: {
      en: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDAyNDdkIi8+PHBhdGggZD0iTTAsMGgzMHYyLjVIMHoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMCw1aDMwdjIuNUgweiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wLDEwaDMwdjIuNUgweiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0wLDE1aDMwdjIuNUgweiIgZmlsbD0iI2ZmZiIvPjxyZWN0IHdpZHRoPSIxNSIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMjQ3ZCIvPjxwYXRoIGQ9Ik0wLDBsMTUsMTBMMCwxMHoiIGZpbGw9IiNjZjE0MmIiLz48L3N2Zz4=',
      ru: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjZmZmIi8+PHJlY3QgeT0iNi42NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjciIGZpbGw9IiMwMDM5YTYiLz48cmVjdCB5PSIxMy4zMyIgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjciIGZpbGw9IiNkNTIyMjIiLz48L3N2Zz4=',
      kk: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDA5NmRmIi8+PGNpcmNsZSBjeD0iMTUiIGN5PSIxMCIgcj0iNSIgZmlsbD0iI2ZmY2MwMCIvPjwvc3ZnPg==',
      ar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDA2YzM1Ii8+PHJlY3QgeT0iNi42NiIgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjciIGZpbGw9IiNmZmYiLz48cmVjdCB5PSIxMy4zMyIgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjciIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iMjAiIGZpbGw9IiNjZTE0MmIiLz48L3N2Zz4=',
      uz: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMCAyMCI+PHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjYuNjYiIGZpbGw9IiMwMDk5ZGMiLz48cmVjdCB5PSI2LjY2IiB3aWR0aD0iMzAiIGhlaWdodD0iNi42NiIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjEzLjMzIiB3aWR0aD0iMzAiIGhlaWdodD0iNi42NyIgZmlsbD0iIzAwOTlkYyIvPjxyZWN0IHk9IjcuNSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjUiIGZpbGw9IiMwMDU1MmIiLz48L3N2Zz4='
    }
  };
  
  // State variables
  let currentLang = CONFIG.defaultLang;
  let translations = null;
  let languageData = {};
  let loadedLanguages = [];
  
  /**
   * Log message if debug mode is enabled
   */
  function debug(...args) {
    if (CONFIG.debug) {
      console.log('[UstaI18n]', ...args);
    }
  }
  
  /**
   * Initialize the i18n system
   */
  function init() {
    debug('Initializing UstaI18n system');
    
    // Get saved language preference or use browser language
    const savedLang = localStorage.getItem(CONFIG.storageName);
    const browserLang = navigator.language.split('-')[0];
    const initialLang = savedLang || 
                      (CONFIG.availableLangs.includes(browserLang) ? browserLang : CONFIG.defaultLang);
    
    debug('Initial language:', initialLang, 'saved:', savedLang, 'browser:', browserLang);
    
    // Load language data and initialize UI
    loadLanguageData().then(() => {
      // Create default language data if needed
      CONFIG.availableLangs.forEach(lang => {
        if (!languageData[lang]) {
          languageData[lang] = createDefaultLanguageData(lang);
        }
      });
      
      // Switch to the initial language
      switchLanguage(initialLang);
      
      // Dispatch initialization event
      document.dispatchEvent(new CustomEvent('i18n:initialized'));
    }).catch(error => {
      console.error('Error initializing i18n system:', error);
      // Fall back to default language if error occurs
      fallbackToDefaultLanguage();
    });
  }
  
  /**
   * Create default language data for a language
   */
  function createDefaultLanguageData(langCode) {
    const defaultMeta = {
      code: langCode,
      name: langCode.toUpperCase(),
      nativeName: langCode.toUpperCase(),
      direction: langCode === 'ar' ? 'rtl' : 'ltr',
      flag: CONFIG.flags[langCode] || `assets/img/flags/${langCode}.svg`
    };
    
    return {
      meta: defaultMeta,
      common: {
        home: "Home",
        about: "About",
        contact: "Contact",
        signIn: "Sign In",
        signUp: "Sign Up",
        search: "Search",
        close: "Close"
      }
    };
  }
  
  /**
   * Load all available language data
   */
  async function loadLanguageData() {
    debug('Loading language data');
    try {
      const promises = CONFIG.availableLangs.map(async lang => {
        if (loadedLanguages.includes(lang)) {
          debug(`Language ${lang} already loaded, skipping`);
          return languageData[lang];
        }
        
        debug(`Loading language file for ${lang}`);
        try {
          const response = await fetch(`${CONFIG.langPath}${lang}.json`);
          if (!response.ok) {
            console.error(`Failed to load language file for ${lang}: ${response.status} ${response.statusText}`);
            return createDefaultLanguageData(lang);
          }
          
          const data = await response.json();
          
          // Add flag SVG data URL if no flag URL is specified
          if (data.meta && !data.meta.flag) {
            data.meta.flag = CONFIG.flags[lang] || `assets/img/flags/${lang}.svg`;
          }
          
          languageData[lang] = data;
          loadedLanguages.push(lang);
          debug(`Language ${lang} loaded successfully`);
          return data;
        } catch (err) {
          console.error(`Error loading language file for ${lang}:`, err);
          return createDefaultLanguageData(lang);
        }
      });
      
      const results = await Promise.all(promises);
      const validResults = results.filter(Boolean);
      
      if (validResults.length === 0) {
        throw new Error('No language files could be loaded');
      }
      
      debug(`${validResults.length} language(s) loaded successfully`);
      return validResults;
    } catch (error) {
      console.error('Error loading language data:', error);
      throw error;
    }
  }
  
  /**
   * Switch to a different language
   */
  function switchLanguage(langCode) {
    if (!CONFIG.availableLangs.includes(langCode)) {
      console.error(`Language ${langCode} is not supported`);
      return;
    }
    
    debug(`Switching language to ${langCode}`);
    
    // Load the language file if not already loaded
    if (!loadedLanguages.includes(langCode)) {
      loadLanguageFile(langCode)
        .then(() => completeSwitchLanguage(langCode))
        .catch(error => {
          console.error(`Failed to load language ${langCode}:`, error);
          fallbackToDefaultLanguage();
        });
    } else {
      completeSwitchLanguage(langCode);
    }
  }
  
  /**
   * Complete the language switch after language data is loaded
   */
  function completeSwitchLanguage(langCode) {
    currentLang = langCode;
    translations = languageData[langCode];
    
    // Save preference
    localStorage.setItem(CONFIG.storageName, langCode);
    
    // Update UI
    updateUI();
    handleTextDirection();
    
    // Dispatch language changed event
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: langCode }
    }));
    
    debug(`Language switched to ${langCode}`);
  }
  
  /**
   * Load a specific language file
   */
  async function loadLanguageFile(langCode) {
    if (loadedLanguages.includes(langCode)) {
      return languageData[langCode];
    }
    
    debug(`Loading language file for ${langCode}`);
    
    try {
      const response = await fetch(`${CONFIG.langPath}${langCode}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add flag SVG data URL if no flag URL is specified
      if (data.meta && !data.meta.flag) {
        data.meta.flag = CONFIG.flags[langCode] || `assets/img/flags/${langCode}.svg`;
      }
      
      languageData[langCode] = data;
      loadedLanguages.push(langCode);
      debug(`Language ${langCode} loaded successfully`);
      return data;
    } catch (error) {
      console.error(`Error loading language file for ${langCode}:`, error);
      throw error;
    }
  }
  
  /**
   * Update all UI elements with translated text
   */
  function updateUI() {
    debug('Updating UI elements with translations');
    
    if (!translations) {
      debug('No translations available');
      return;
    }
    
    // Update regular text elements
    const textElements = document.querySelectorAll(CONFIG.selectors.container);
    debug(`Found ${textElements.length} text elements to update`);
    
    textElements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = getTranslation(key);
      if (text) {
        el.textContent = text;
      } else {
        debug(`No translation found for key: ${key}`);
      }
    });
    
    // Update placeholders
    const placeholderElements = document.querySelectorAll(CONFIG.selectors.placeholder);
    debug(`Found ${placeholderElements.length} placeholder elements to update`);
    
    placeholderElements.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = getTranslation(key);
      if (text) {
        el.placeholder = text;
      } else {
        debug(`No translation found for placeholder key: ${key}`);
      }
    });
    
    // Update aria-labels
    const ariaLabelElements = document.querySelectorAll(CONFIG.selectors.ariaLabel);
    debug(`Found ${ariaLabelElements.length} aria-label elements to update`);
    
    ariaLabelElements.forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      const text = getTranslation(key);
      if (text) {
        el.setAttribute('aria-label', text);
      } else {
        debug(`No translation found for aria-label key: ${key}`);
      }
    });
  }
  
  /**
   * Get a translation value by its key
   */
  function getTranslation(key) {
    if (!key || !translations) return null;
    
    // Handle nested keys (e.g., "common.home")
    const parts = key.split('.');
    let value = translations;
    
    for (const part of parts) {
      if (!value || value[part] === undefined) {
        debug(`Translation key not found: ${key}`);
        return null;
      }
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Handle RTL text direction for Arabic
   */
  function handleTextDirection() {
    if (!translations || !translations.meta) {
      debug('Cannot handle text direction: translations or meta data not available');
      return;
    }
    
    const direction = translations.meta.direction || 'ltr';
    debug(`Setting text direction to: ${direction}`);
    
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLang);
    
    if (direction === 'rtl') {
      document.body.classList.add('rtl');
      
      // Load RTL stylesheet if not already loaded
      if (!document.querySelector('link[href*="rtl.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/rtl.css';
        document.head.appendChild(link);
        debug('Added RTL stylesheet');
      }
    } else {
      document.body.classList.remove('rtl');
    }
  }
  
  /**
   * Fall back to default language if error occurs
   */
  function fallbackToDefaultLanguage() {
    console.warn(`Falling back to default language: ${CONFIG.defaultLang}`);
    currentLang = CONFIG.defaultLang;
    
    // Create a minimal default language data
    translations = createDefaultLanguageData(CONFIG.defaultLang);
    languageData[CONFIG.defaultLang] = translations;
    loadedLanguages.push(CONFIG.defaultLang);
    
    updateUI();
    handleTextDirection();
    
    // Try to load the default language in the background
    fetch(`${CONFIG.langPath}${CONFIG.defaultLang}.json`)
      .then(response => response.json())
      .then(data => {
        translations = data;
        languageData[CONFIG.defaultLang] = data;
        updateUI();
        handleTextDirection();
      })
      .catch(error => {
        console.error('Failed to load default language:', error);
      });
  }
  
  /**
   * Get flag URL for a language
   */
  function getFlagUrl(langCode) {
    // Use placeholder SVG data URL if available
    if (CONFIG.flags[langCode]) {
      return CONFIG.flags[langCode];
    }
    
    // Return SVG file path
    return `assets/img/flags/${langCode}.svg`;
  }
  
  // Public API
  return {
    init: init,
    switchLanguage: switchLanguage,
    getCurrentLanguage: () => currentLang,
    getTranslation: getTranslation,
    getAvailableLanguages: () => CONFIG.availableLangs,
    getFlagUrl: getFlagUrl,
    setDebug: (value) => {
      CONFIG.debug = !!value;
      return CONFIG.debug;
    }
  };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (typeof window.UstaI18n.init === 'function') {
    window.UstaI18n.init();
  }
}); 