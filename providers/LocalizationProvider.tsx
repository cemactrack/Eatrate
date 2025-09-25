import { useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import createContextHook from '@nkzw/create-context-hook';
import { useStorage } from './StorageProvider';

type Language = 'en' | 'fr';

interface LocalizationContextType {
  language: Language;
  isLoading: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLanguage: (lang: Language) => Promise<void>;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

// Translation keys and values
const translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.like': 'Like',
    'common.comment': 'Comment',
    'common.follow': 'Follow',
    'common.unfollow': 'Unfollow',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.done': 'Done',
    'common.close': 'Close',
    
    // Navigation
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.suppliers': 'Suppliers',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'nav.bookmarks': 'Bookmarks',
    'nav.achievements': 'Achievements',
    'nav.events': 'Events',
    'nav.reservations': 'Reservations',
    
    // Authentication
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.createAccount': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    
    // Restaurants
    'restaurant.rating': 'Rating',
    'restaurant.reviews': 'Reviews',
    'restaurant.menu': 'Menu',
    'restaurant.location': 'Location',
    'restaurant.hours': 'Hours',
    'restaurant.contact': 'Contact',
    'restaurant.cuisine': 'Cuisine',
    'restaurant.priceRange': 'Price Range',
    'restaurant.makeReservation': 'Make Reservation',
    'restaurant.writeReview': 'Write Review',
    
    // Food & Nutrition
    'food.calories': 'Calories',
    'food.protein': 'Protein',
    'food.carbs': 'Carbs',
    'food.fat': 'Fat',
    'food.fiber': 'Fiber',
    'food.sugar': 'Sugar',
    'food.vegan': 'Vegan',
    'food.vegetarian': 'Vegetarian',
    'food.glutenFree': 'Gluten Free',
    'food.dairyFree': 'Dairy Free',
    'food.halal': 'Halal',
    'food.kosher': 'Kosher',
    'food.spicy': 'Spicy',
    'food.estimatedCalories': 'Estimated Calories: {{calories}}',
    
    // Social
    'social.followers': 'Followers',
    'social.following': 'Following',
    'social.posts': 'Posts',
    'social.likes': 'Likes',
    'social.comments': 'Comments',
    'social.shares': 'Shares',
    'social.newPost': 'New Post',
    'social.whatsOnYourMind': "What's on your mind?",
    
    // Gamification
    'gamification.level': 'Level {{level}}',
    'gamification.points': '{{points}} Points',
    'gamification.achievements': 'Achievements',
    'gamification.badges': 'Badges',
    'gamification.challenges': 'Challenges',
    'gamification.leaderboard': 'Leaderboard',
    'gamification.unlocked': 'Unlocked!',
    'gamification.progress': 'Progress: {{current}}/{{total}}',
    
    // Events
    'events.upcoming': 'Upcoming Events',
    'events.ongoing': 'Ongoing Events',
    'events.past': 'Past Events',
    'events.attending': 'Attending',
    'events.interested': 'Interested',
    'events.maybe': 'Maybe',
    'events.foodFestival': 'Food Festival',
    'events.popup': 'Pop-up',
    'events.restaurantWeek': 'Restaurant Week',
    
    // Settings
    'settings.language': 'Language',
    'settings.darkMode': 'Dark Mode',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.about': 'About',
    'settings.support': 'Support',
    'settings.termsOfService': 'Terms of Service',
    'settings.privacyPolicy': 'Privacy Policy',
  },
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.retry': 'Réessayer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.share': 'Partager',
    'common.like': 'Aimer',
    'common.comment': 'Commenter',
    'common.follow': 'Suivre',
    'common.unfollow': 'Ne plus suivre',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.done': 'Terminé',
    'common.close': 'Fermer',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.search': 'Recherche',
    'nav.suppliers': 'Fournisseurs',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    'nav.notifications': 'Notifications',
    'nav.bookmarks': 'Favoris',
    'nav.achievements': 'Réalisations',
    'nav.events': 'Événements',
    'nav.reservations': 'Réservations',
    
    // Authentication
    'auth.login': 'Connexion',
    'auth.signup': 'Inscription',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.forgotPassword': 'Mot de passe oublié ?',
    'auth.createAccount': 'Créer un compte',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte ?',
    'auth.dontHaveAccount': "Vous n'avez pas de compte ?",
    
    // Restaurants
    'restaurant.rating': 'Note',
    'restaurant.reviews': 'Avis',
    'restaurant.menu': 'Menu',
    'restaurant.location': 'Localisation',
    'restaurant.hours': 'Horaires',
    'restaurant.contact': 'Contact',
    'restaurant.cuisine': 'Cuisine',
    'restaurant.priceRange': 'Gamme de prix',
    'restaurant.makeReservation': 'Réserver',
    'restaurant.writeReview': 'Écrire un avis',
    
    // Food & Nutrition
    'food.calories': 'Calories',
    'food.protein': 'Protéines',
    'food.carbs': 'Glucides',
    'food.fat': 'Lipides',
    'food.fiber': 'Fibres',
    'food.sugar': 'Sucre',
    'food.vegan': 'Végétalien',
    'food.vegetarian': 'Végétarien',
    'food.glutenFree': 'Sans gluten',
    'food.dairyFree': 'Sans lactose',
    'food.halal': 'Halal',
    'food.kosher': 'Casher',
    'food.spicy': 'Épicé',
    'food.estimatedCalories': 'Calories estimées : {{calories}}',
    
    // Social
    'social.followers': 'Abonnés',
    'social.following': 'Abonnements',
    'social.posts': 'Publications',
    'social.likes': 'J\'aime',
    'social.comments': 'Commentaires',
    'social.shares': 'Partages',
    'social.newPost': 'Nouvelle publication',
    'social.whatsOnYourMind': 'À quoi pensez-vous ?',
    
    // Gamification
    'gamification.level': 'Niveau {{level}}',
    'gamification.points': '{{points}} Points',
    'gamification.achievements': 'Réalisations',
    'gamification.badges': 'Badges',
    'gamification.challenges': 'Défis',
    'gamification.leaderboard': 'Classement',
    'gamification.unlocked': 'Débloqué !',
    'gamification.progress': 'Progrès : {{current}}/{{total}}',
    
    // Events
    'events.upcoming': 'Événements à venir',
    'events.ongoing': 'Événements en cours',
    'events.past': 'Événements passés',
    'events.attending': 'Participe',
    'events.interested': 'Intéressé',
    'events.maybe': 'Peut-être',
    'events.foodFestival': 'Festival gastronomique',
    'events.popup': 'Éphémère',
    'events.restaurantWeek': 'Semaine des restaurants',
    
    // Settings
    'settings.language': 'Langue',
    'settings.darkMode': 'Mode sombre',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Confidentialité',
    'settings.about': 'À propos',
    'settings.support': 'Support',
    'settings.termsOfService': 'Conditions d\'utilisation',
    'settings.privacyPolicy': 'Politique de confidentialité',
  },
};

const STORAGE_KEY = 'app_language';

export const [LocalizationProvider, useLocalization] = createContextHook<LocalizationContextType>(() => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const { getItem, setItem } = useStorage();

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to get saved language
        const savedLanguage = await getItem(STORAGE_KEY);
        
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
          setLanguage(savedLanguage);
        } else {
          // Use device locale as fallback
          const deviceLocale = Localization.getLocales()[0]?.languageTag || 'en';
          const deviceLanguage = deviceLocale.startsWith('fr') ? 'fr' : 'en';
          setLanguage(deviceLanguage);
          await setItem(STORAGE_KEY, deviceLanguage);
        }
      } catch (error) {
        console.error('Failed to initialize language:', error);
        setLanguage('en'); // Fallback to English
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    try {
      setLanguage(lang);
      await setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    if (!params) return translation;
    
    // Replace parameters in translation
    return Object.entries(params).reduce(
      (text, [param, value]) => text.replace(new RegExp(`{{${param}}}`, 'g'), String(value)),
      translation
    );
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: string = 'XAF'): string => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-CM' : 'en-CM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    language,
    isLoading,
    t,
    changeLanguage,
    formatDate,
    formatTime,
    formatCurrency,
  };
});