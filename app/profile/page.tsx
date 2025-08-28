"use client"

import { useState } from "react"
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
import { User, Settings, Bell, Globe, Shield, CreditCard, Camera, Save } from "lucide-react"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: "easeOut",
    },
  },
}

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    bio: "Computer Science student passionate about mathematics and physics. Currently pursuing a Bachelor's degree with focus on machine learning and data science.",
    timezone: "America/New_York",
    language: "English",
    avatar: "/student-avatar.png",
  })

  const [notifications, setNotifications] = useState({
    sessionReminders: true,
    newMessages: true,
    weeklyProgress: true,
    tutorUpdates: false,
    marketingEmails: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "tutors",
    showProgress: true,
    allowDirectMessages: true,
  })

  const handleSave = () => {
    // Handle save logic here
    console.log("Saving profile:", { profile, notifications, privacy })
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
                    onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
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
                  <Badge variant="default">Premium</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sessions This Month</span>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-medium">Jan 2024</span>
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
                  Download Data
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Export Sessions
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Contact Support
                </Button>
                <Separator />
                <Button variant="destructive" className="w-full justify-start">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div className="mt-8 flex justify-end" variants={itemVariants}>
          <Button onClick={handleSave} size="lg" className="px-8">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </motion.div>
      </motion.main>
    </div>
  )
}
