# EdSpire 🎓

EdSpire is an AI-powered tutoring and study planning platform designed for university students. It combines personalized learning roadmaps, affordable tutoring with tokenized payments, and progress tracking into one seamless solution.

## Track 1: Student Lifestyle - Tutoring For Students

EdSpire is an innovative online tutoring platform designed to tackle the core challenges faced by university students in accessing quality education support. Our solution combines AI-driven personalization, affordable tutoring services, and flexible scheduling to make academic support accessible to all students.

## 🎯 Problem Statement

University students currently face three major challenges in their academic journey:

1. **Lack of Personalization**

   - 80% of students report that current AI solutions in education haven't met their personalization needs
   - Generic approaches fail to address individual learning styles and requirements

2. **Expensive Tutoring**

   - Traditional private tutoring sessions cost between RM 20-90 per hour
   - High costs make quality academic support inaccessible to many students

3. **Inconvenient Scheduling**
   - Students struggle to balance work, classes, and study time
   - Rigid tutoring schedules create additional stress and barriers to learning

## 💡 Our Solution

EdSpire addresses these challenges through:

**1. Personalized Study Assistant (AI Section) ⭐⭐⭐**

- AI-generated custom learning roadmap per subject/semester.
- Breaks roadmap into micro to-do lists scheduled in a To-Study Calendar.
- Suggests suitable tutors and auto-schedules sessions.

  https://github.com/user-attachments/assets/f930ad20-f82e-490a-93c5-ce6417172dda

**2. Gamified & Affordable Tutoring (Tutor Section) ⭐⭐**

- In-platform token (EdS) for payments and rewards.
- Earn tokens after completing sessions or challenges.
- Leaderboard system – top 3 active learners rewarded weekly.

**3. Learning Tracker (Summaries Section) ⭐**

- Track total sessions, study hours, completion rate per subject.
- View history of tutoring sessions with AI-generated highlights.

## 🚀 Key Features

- **AI Chat Assistant**: Get instant help with questions and concepts
- **Video Tutoring**: Real-time sessions with expert tutors
- **Leaderboard System**: Gamified learning experience with rewards
- **Smart Scheduling**: AI-powered calendar management
- **Performance Analytics**: Track your progress and improve
- **Resource Library**: Access to study materials and summaries

## 📖 User Guide Flow

### 🎓 Student Journey

```
Sign Up → Connect Wallet → Top-up Tokens → Browse Tutors → Book Session → Join Video Call → Rate Session → Earn Tokens
```

### 👨‍🏫 Tutor Journey

```
Sign Up → Complete Profile → Get Verified → Receive Bookings → Accept Session → Conduct Video Call → Earn Tokens → Track Analytics
```

### 💰 Token Economy

```
Earn Tokens → Book Sessions → Complete Sessions → Rate & Review → Claim Rewards → Top-up via MetaMask
```

## 🛠️ Tech Stack & Services

### Frontend

- **Next.js 15** - React framework with SSR/SSG
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS v3** - Utility-first styling
- **Radix UI** - Accessible component library

### Backend & Database

- **Firebase Authentication** - User login/signup
- **Firestore** - Real-time NoSQL database
- **Firebase Cloud Functions** - Serverless backend logic
- **Firebase Hosting** - Static site hosting

### Video Conferencing

- **Jitsi Meet** - Open-source video conferencing
- **WebRTC** - Real-time communication protocol
- **Screen Sharing** - Interactive learning sessions
- **Session Recording** - Optional session playback

### Blockchain & Payments

- **MetaMask** - Ethereum wallet integration
- **Ethereum Network** - Smart contract deployment
- **EdS Token** - Custom ERC-20 token
- **Smart Contracts** - Automated token transfers

### AI & Analytics

- **OpenRouter API** - AI chat assistant
- **Real-time Analytics** - User progress tracking
- **Leaderboard System** - Gamification features
- **Performance Metrics** - Learning insights

### Deployment & Infrastructure

- **Vercel** - Frontend deployment platform
- **Firebase** - Backend infrastructure
- **CDN** - Global content delivery
- **SSL/HTTPS** - Secure data transmission

## 🔗 Service Integration Flow

### Data Flow

```
User Action → Firebase Auth → Firestore Database → Real-time Updates → UI Refresh
```

### Video Session Flow

```
Session Booking → Jitsi Room Creation → Video Conference → Session Recording → Data Storage
```

### Payment Flow

```
MetaMask Wallet → Ethereum Transaction → Smart Contract → Token Transfer → Balance Update
```

### AI Integration Flow

```
User Question → OpenRouter API → AI Response → Firebase Storage → User Interface
```

## 🌐 Live Demo

**Production URL**: [https://ed-spire.vercel.app](https://ed-spire.vercel.app)

### What You Can Experience:

- **Student Dashboard** - Browse tutors, book sessions, track progress
- **Tutor Dashboard** - Manage bookings, conduct sessions, view earnings
- **AI Chat** - Get instant help with any subject
- **Video Sessions** - Real-time tutoring via Jitsi Meet
- **Token System** - Earn and spend EdS tokens
- **Mobile Responsive** - Works on all devices

## 🚀 Quick Start

### For Students

1. **Sign Up** with email/password
2. **Connect MetaMask** wallet
3. **Top-up tokens** for sessions
4. **Browse tutors** by subject
5. **Book sessions** and learn!

### For Tutors

1. **Sign Up** and select tutor role
2. **Complete profile** with specializations
3. **Get verified** by admin
4. **Receive bookings** from students
5. **Conduct sessions** and earn tokens!

## 📚 Documentation

- **Integration Flow**: [Simple Integration Flow](docs/SIMPLE_INTEGRATION_FLOW.md)
- **System Architecture**: [Integration Diagrams](docs/INTEGRATION_DIAGRAMS.md)
- **API Documentation**: Coming soon
- **Deployment Guide**: Coming soon

## 🔧 Development

### Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- MetaMask wallet
- Firebase project
- Vercel account

### Installation

```bash
git clone https://github.com/your-username/edspire.git
cd edspire
npm install
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
OPENROUTER_API_KEY=your_openrouter_key
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- **Email**: support@edspire.com
- **Discord**: [Join our community](https://discord.gg/edspire)
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-username/edspire/issues)

## 👥 Team

**BlockDee**

- **Kenneth Jonathan Mardiyo** - Full Stack Developer
- **Angelina Leanore** - Full Stack Developer
- **Bryan Christoper Pradibta** - Backend Developer
- **Kelvin Vallian Guinawa** - AI/ML Engineer

Developed with ❤️ for **Codenection 2025**

---

<div align="center">

**⭐ Star this repository if you find it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/your-username/edspire?style=social)](https://github.com/your-username/edspire)
[![GitHub forks](https://img.shields.io/github/forks/your-username/edspire?style=social)](https://github.com/your-username/edspire/fork)
[![GitHub issues](https://img.shields.io/github/issues/your-username/edspire)](https://github.com/your-username/edspire/issues)
[![GitHub license](https://img.shields.io/github/license/your-username/edspire)](https://github.com/your-username/edspire/blob/main/LICENSE)

</div>
