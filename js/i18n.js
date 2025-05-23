/**
 * Internationalization script for Punchlines website
 */

// Default language
let currentLanguage = 'en';

// Available languages
const availableLanguages = ['en', 'fr'];

// Languages directory mapping
const languageFolders = {
  'en': 'English (en-US)',
  'fr': 'French (fr-FR)'
};

// Language display names
const languageNames = {
  'en': 'English',
  'fr': 'Français'
};

// Translations storage
let translations = {};

// DOM elements with data-i18n attribute
let i18nElements = [];

// Function to get URL parameter
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Function to update URL with language parameter
function updateUrlLanguage(lang) {
  const url = new URL(window.location);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url);
}

// Expose language switching function for the new dropdown
window.switchLanguage = async function(lang) {
  if (lang && availableLanguages.includes(lang) && lang !== currentLanguage) {
    currentLanguage = lang;
    localStorage.setItem('punchlines-language', currentLanguage);
    
    // Update URL with new language
    updateUrlLanguage(currentLanguage);
    
    // Load new translations
    await loadTranslations(currentLanguage);
    
    // Update UI
    updateLanguageUI();
    
    // Translate page
    translatePage();
    
    // Update screenshots
    updateScreenshots(currentLanguage);
  }
};

// Initialize the internationalization
async function initI18n() {
  // First priority: Check URL parameter
  const urlLang = getUrlParameter('lang');
  if (urlLang && availableLanguages.includes(urlLang)) {
    currentLanguage = urlLang;
  } else {
    // Second priority: Try to get language from localStorage
    const savedLanguage = localStorage.getItem('punchlines-language');
    
    // Set language from saved preference, or browser preference, or default to English
    if (savedLanguage && availableLanguages.includes(savedLanguage)) {
      currentLanguage = savedLanguage;
    } else {
      // Check browser language
      const browserLang = navigator.language.split('-')[0];
      if (availableLanguages.includes(browserLang)) {
        currentLanguage = browserLang;
      }
    }
  }
  
  // Update URL to reflect current language
  updateUrlLanguage(currentLanguage);
  
  // Save to localStorage for future visits
  localStorage.setItem('punchlines-language', currentLanguage);
  
  // Load translations for the current language
  await loadTranslations(currentLanguage);
  
  // Update the UI to reflect the selected language
  updateLanguageUI();
  
  // Apply translations
  translatePage();
  
  // Update screenshots based on language
  updateScreenshots(currentLanguage);
}

// Load translations from JSON file
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations for ${lang}`);
    }
    translations = await response.json();
    return translations;
  } catch (error) {
    console.error('Error loading translations:', error);
    // Fallback to English if loading fails
    if (lang !== 'en') {
      return loadTranslations('en');
    }
  }
}

// Translate the page content
function translatePage() {
  // Find all elements with data-i18n attribute
  i18nElements = document.querySelectorAll('[data-i18n]');
  
  i18nElements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = getTranslation(key);
    
    if (translation) {
      // Check if the element has a data-i18n-attr attribute
      const attr = element.getAttribute('data-i18n-attr');
      if (attr) {
        // Set attribute instead of innerHTML (useful for placeholders, alt text, etc.)
        element.setAttribute(attr, translation);
      } else {
        // Handle possible HTML content in translations (like spans)
        if (translation.includes('<span>')) {
          element.innerHTML = translation.replace('<span>', `<span class="font-marker text-gray-800">`);
        } else {
          element.innerHTML = translation;
        }
      }
    }
  });
  
  // Update page title
  if (translations.meta && translations.meta.title) {
    document.title = translations.meta.title;
  }
}

// Get translation for a key (supports nested keys like "nav.home")
function getTranslation(key) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      return null;
    }
  }
  
  return value;
}

// Update screenshots based on selected language
function updateScreenshots(lang) {
  // Get all elements with data-screenshot attribute
  const screenshotElements = document.querySelectorAll('[data-screenshot]');
  
  if (screenshotElements.length > 0) {
    // Get the folder name for the current language
    const langFolder = languageFolders[lang] || languageFolders['en']; // Fallback to English if language folder not found
    
    // Update src for each screenshot
    screenshotElements.forEach(img => {
      const screenshotNumber = img.getAttribute('data-screenshot');
      const alt = img.getAttribute('alt');
      
      // Update src with appropriate language folder
      img.src = `assets/screens/${langFolder}/iOS Phones  6.9/${screenshotNumber}.png`;
      
      // Update loading behavior for better performance
      img.loading = "lazy";
    });
  }
}

// Update UI to reflect the selected language
function updateLanguageUI() {
  // Update language display in dropdown
  const currentLanguageEl = document.querySelector('.current-language');
  if (currentLanguageEl) {
    currentLanguageEl.textContent = languageNames[currentLanguage] || languageNames['en'];
  }
  
  // Update selected state in desktop dropdown menu
  document.querySelectorAll('.language-option').forEach(el => {
    if (el.getAttribute('data-lang') === currentLanguage) {
      el.setAttribute('aria-selected', 'true');
    } else {
      el.setAttribute('aria-selected', 'false');
    }
  });
  
  // Update mobile language options
  document.querySelectorAll('.mobile-language-option').forEach(el => {
    const isSelected = el.getAttribute('data-lang') === currentLanguage;
    const checkmark = el.querySelector('.mobile-lang-checkmark');
    
    el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    
    if (checkmark) {
      if (isSelected) {
        checkmark.classList.remove('hidden');
      } else {
        checkmark.classList.add('hidden');
      }
    }
  });
  
  // Update HTML lang attribute
  document.documentElement.setAttribute('lang', currentLanguage);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initI18n); 