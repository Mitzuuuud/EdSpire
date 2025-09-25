"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Settings, Bell, Globe, Shield, CreditCard, Camera, Save, Trash2, Download, AlertTriangle, CheckCircle, Loader2, Calendar, BookOpen, Clock, Target } from "lucide-react"
import { motion } from "framer-motion"
import { getUserProfile, updateUserProfile, deleteUserAccount, getUserStats, type UserProfile, type UserProfileUpdate } from "@/lib/profile-service"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.1,
    } as const,
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.25, 0.1, 0.25, 1.0],
    } as const,
  },
} as const;

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<{uid: string, email: string, role: string} | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form states
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    timezone: "America/New_York",
    language: "English",
    avatar: "",
  })

  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    weeklyProgress: true,
    tutorUpdates: false,
    marketingEmails: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "tutors" as "public" | "tutors" | "private",
    showProgress: true,
    allowDirectMessages: true,
  })

  // User stats
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalHours: 0
  })

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)

  // Load user data on component mount
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current user from localStorage
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setError("Please sign in to view your profile")
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      setCurrentUser(user)

      // Load user profile from database
      const profileResult = await getUserProfile(user.uid)
      if (!profileResult.success || !profileResult.profile) {
        setError(profileResult.error || "Failed to load profile")
        setLoading(false)
        return
      }

      const userProfileData = profileResult.profile
      setUserProfile(userProfileData)

      // Update form states with loaded data
      setProfile({
        name: userProfileData.name || "",
        email: userProfileData.email || "",
        bio: userProfileData.bio || "",
        timezone: userProfileData.timezone || "America/New_York",
        language: userProfileData.language || "English",
        avatar: userProfileData.avatar || "",
      })

      // Set notifications with defaults if undefined
      setNotifications({
        sessionReminders: userProfileData.notifications?.sessionReminders ?? true,
        newMessages: userProfileData.notifications?.newMessages ?? true,
        weeklyProgress: userProfileData.notifications?.weeklyProgress ?? true,
        tutorUpdates: userProfileData.notifications?.tutorUpdates ?? false,
        marketingEmails: userProfileData.notifications?.marketingEmails ?? false,
      })

      // Set privacy with defaults if undefined
      setPrivacy({
        profileVisibility: userProfileData.privacy?.profileVisibility ?? "tutors",
        showProgress: userProfileData.privacy?.showProgress ?? true,
        allowDirectMessages: userProfileData.privacy?.allowDirectMessages ?? true,
      })

      // Load user statistics
      const stats = await getUserStats(user.uid)
      setUserStats(stats)

    } catch (error: any) {
      console.error('Error loading user data:', error)
      setError(error.message || "Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentUser) {
      setError("Please sign in to save changes")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: UserProfileUpdate = {
        name: profile.name,
        bio: profile.bio,
        timezone: profile.timezone,
        language: profile.language,
        avatar: profile.avatar,
        notifications,
        privacy,
        lastActiveAt: new Date()
      }

      const result = await updateUserProfile(currentUser.uid, updates)
      
      if (!result.success) {
        setError(result.error || "Failed to save changes")
        return
      }

      setSuccess("Profile updated successfully!")
      
      // Reload profile data to sync with database
      await loadUserData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!currentUser) {
      setError("Please sign in to delete account")
      return
    }

    if (deleteConfirmText !== "DELETE") {
      setError("Please type 'DELETE' to confirm account deletion")
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const result = await deleteUserAccount(currentUser.uid)
      
      if (!result.success) {
        setError(result.error || "Failed to delete account")
        setDeleting(false)
        return
      }

      // Clear local storage and redirect
      localStorage.removeItem('user')
      setSuccess("Account deleted successfully. Redirecting...")
      
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)

    } catch (error: any) {
      console.error('Error deleting account:', error)
      setError(error.message || "Failed to delete account")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/signin'}>
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <motion.main className="mx-auto w-full max-w-7xl px-6 py-8" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center space-x-2 mb-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Profile & Settings</h1>
          </div>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Information */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                        {profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-transparent"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{profile.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">Student</Badge>
                      <Badge variant="outline">Premium</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profile.timezone}
                      onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profile.language}
                      onValueChange={(value) => setProfile({ ...profile, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Spanish">Spanish</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                        <SelectItem value="Chinese">Chinese</SelectItem>
                        <SelectItem value="Japanese">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="session-reminders" className="font-medium">
                      Session Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground">Get notified before your tutoring sessions</p>
                  </div>
                  <Switch
                    id="session-reminders"
                    checked={notifications.sessionReminders}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, sessionReminders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="new-messages" className="font-medium">
                      New Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">Notifications for chat messages and updates</p>
                  </div>
                  <Switch
                    id="new-messages"
                    checked={notifications.newMessages}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, newMessages: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weekly-progress" className="font-medium">
                      Weekly Progress Reports
                    </Label>
                    <p className="text-sm text-muted-foreground">Summary of your learning progress each week</p>
                  </div>
                  <Switch
                    id="weekly-progress"
                    checked={notifications.weeklyProgress}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyProgress: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tutor-updates" className="font-medium">
                      Tutor Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Updates from your tutors and new tutor recommendations
                    </p>
                  </div>
                  <Switch
                    id="tutor-updates"
                    checked={notifications.tutorUpdates}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, tutorUpdates: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="font-medium">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Privacy & Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select
                    value={privacy.profileVisibility}
                    onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value as "public" | "tutors" | "private" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to everyone</SelectItem>
                      <SelectItem value="tutors">Tutors Only - Visible to your tutors</SelectItem>
                      <SelectItem value="private">Private - Only visible to you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-progress" className="font-medium">
                      Show Progress to Tutors
                    </Label>
                    <p className="text-sm text-muted-foreground">Allow tutors to see your learning progress</p>
                  </div>
                  <Switch
                    id="show-progress"
                    checked={privacy.showProgress}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, showProgress: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="direct-messages" className="font-medium">
                      Allow Direct Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">Let tutors send you direct messages</p>
                  </div>
                  <Switch
                    id="direct-messages"
                    checked={privacy.allowDirectMessages}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, allowDirectMessages: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Account Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge variant="default">{currentUser?.role === 'tutor' ? 'Tutor' : 'Student'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sessions</span>
                  <span className="font-medium">{userStats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed Sessions</span>
                  <span className="font-medium">{userStats.completedSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Sessions</span>
                  <span className="font-medium">{userStats.upcomingSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Hours</span>
                  <span className="font-medium">{userStats.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">{userProfile?.createdAt ? userProfile.createdAt.toLocaleDateString() : 'N/A'}</span>
                </div>
                <Separator />
                <Button variant="outline" className="w-full bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Export Sessions
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Separator />
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </CardContent>
            </Card>
            <motion.div className="mt-8 flex justify-end" variants={itemVariants}>
              <Button 
                onClick={handleSave} 
                size="lg" 
                className="w-full justify-start" 
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>

      {/* Error/Success Messages */}
      {error && (
        <motion.div 
          className="fixed top-4 right-4 z-50 p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-2 p-1"
            >
              ×
            </Button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div 
          className="fixed top-4 right-4 z-50 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSuccess(null)}
              className="ml-2 p-1"
            >
              ×
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete Account Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Account</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-confirm">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false)
                setDeleteConfirmText("")
                setError(null)
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
