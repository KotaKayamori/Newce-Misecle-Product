"use client"

import { useState } from "react"

/**
 * プロフィールページの全モーダル/画面の状態を一元管理するフック
 */
export function useProfileModals() {
  const [showReviews, setShowReviews] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showVisitedStores, setShowVisitedStores] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showLocationSettings, setShowLocationSettings] = useState(false)
  const [showPushNotificationSettings, setShowPushNotificationSettings] = useState(false)
  const [showMutedStoresSettings, setShowMutedStoresSettings] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [showBugReportForm, setShowBugReportForm] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [showOtherProfile, setShowOtherProfile] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showManagementScreen, setShowManagementScreen] = useState(false)
  const [showNotificationBroadcast, setShowNotificationBroadcast] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showPosts, setShowPosts] = useState(false)
  const [showNotificationPermission, setShowNotificationPermission] = useState(false)
  const [showGenderAgeModal, setShowGenderAgeModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMyVideosModal, setShowMyVideosModal] = useState(false)

  return {
    showReviews,
    setShowReviews,
    showNotifications,
    setShowNotifications,
    showVisitedStores,
    setShowVisitedStores,
    showAccountSettings,
    setShowAccountSettings,
    showLocationSettings,
    setShowLocationSettings,
    showPushNotificationSettings,
    setShowPushNotificationSettings,
    showMutedStoresSettings,
    setShowMutedStoresSettings,
    showEmailSettings,
    setShowEmailSettings,
    showFAQ,
    setShowFAQ,
    showContactForm,
    setShowContactForm,
    showBugReportForm,
    setShowBugReportForm,
    showProfileEdit,
    setShowProfileEdit,
    showProfileDetails,
    setShowProfileDetails,
    showOtherProfile,
    setShowOtherProfile,
    showLogoutConfirmation,
    setShowLogoutConfirmation,
    showManagementScreen,
    setShowManagementScreen,
    showNotificationBroadcast,
    setShowNotificationBroadcast,
    showFollowers,
    setShowFollowers,
    showFollowing,
    setShowFollowing,
    showPosts,
    setShowPosts,
    showNotificationPermission,
    setShowNotificationPermission,
    showGenderAgeModal,
    setShowGenderAgeModal,
    showUploadModal,
    setShowUploadModal,
    showMyVideosModal,
    setShowMyVideosModal,
  }
}

