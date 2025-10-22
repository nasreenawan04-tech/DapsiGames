# DapsiGames Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based with Gaming + Education Fusion

**Key References:**
- Duolingo's gamification patterns and achievement systems
- Discord's community and leaderboard aesthetics
- Kahoot's energetic, competitive interface design
- Linear's clean typography and modern UI patterns

**Core Design Principle:** Bridge educational credibility with gaming excitement through vibrant-yet-trustworthy visual language that motivates students through competition and achievement.

## Color System

### Primary Palette
- **Primary Blue:** 221 83% 53% - Trust, learning, primary actions
- **Success Green:** 158 64% 52% - Achievements, positive feedback, progress
- **Energy Orange:** 38 92% 50% - Gaming excitement, CTAs, highlights
- **Neutral Base:** 220 14% 96% - Backgrounds and surfaces

### Semantic Colors
- **Warning:** 45 93% 47% - Alerts, time-sensitive actions
- **Error:** 0 84% 60% - Validation errors, critical states
- **Info:** 199 89% 48% - Tips, informational highlights
- **Leaderboard Gold:** 43 74% 66% - Top rank indicators
- **Leaderboard Silver:** 0 0% 78% - Second place
- **Leaderboard Bronze:** 28 80% 52% - Third place

### Dark Mode
- **Background:** 222 47% 11% - Primary dark surface
- **Surface:** 217 33% 17% - Card backgrounds
- **Primary:** 221 83% 63% - Lighter blue for contrast
- **Text:** 210 40% 98% - High contrast reading

## Typography

### Font Families
- **Display/Headings:** Inter (600-800 weights) - Modern, confident, gaming-inspired
- **Body/UI:** System UI stack - Optimal performance and readability
- **Monospace:** JetBrains Mono - Scores, stats, code elements

### Type Scale
- **Hero:** text-6xl (60px) font-bold - Landing page headlines
- **H1:** text-4xl (36px) font-bold - Page titles
- **H2:** text-3xl (30px) font-semibold - Section headers
- **H3:** text-2xl (24px) font-semibold - Card titles
- **Body Large:** text-lg (18px) - Primary content
- **Body:** text-base (16px) - Standard text
- **Small:** text-sm (14px) - Secondary information
- **Micro:** text-xs (12px) - Metadata, timestamps

## Layout System

### Spacing Scale
**Core Units:** Use Tailwind spacing units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- **Micro gaps:** gap-2 (8px) - Icon to text, tight elements
- **Component padding:** p-4 to p-6 - Cards, buttons, inputs
- **Section spacing:** py-12 to py-20 - Vertical section rhythm
- **Container margins:** mx-8 to mx-16 - Page edge breathing room

### Grid System
- **Container:** max-w-7xl mx-auto - Primary content constraint
- **Leaderboard:** Single column with expanding rows
- **Game Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Dashboard Stats:** grid-cols-2 lg:grid-cols-4
- **Study Materials:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation
- **Header:** Sticky top-0, backdrop-blur-lg, shadow-sm with subtle border
- **Desktop Nav:** Horizontal with hover states (blue underline animation)
- **Mobile:** Slide-in drawer from left, overlay backdrop
- **User Menu:** Dropdown with avatar, points badge, profile shortcuts

### Cards
- **Base Card:** rounded-xl shadow-md hover:shadow-lg transition-all bg-white dark:bg-surface
- **Game Card:** Includes thumbnail, difficulty badge, point value, play button
- **Achievement Card:** Icon, title, progress bar, unlock status
- **Leaderboard Entry:** Rank badge, avatar, username, points, trend indicator
- **Stat Card:** Large number, label, change indicator, micro sparkline

### Buttons
- **Primary:** bg-primary text-white rounded-lg px-6 py-3 font-semibold hover:brightness-110
- **Secondary:** bg-green text-white - Achievement, success actions
- **Accent:** bg-orange text-white - Gaming CTAs, energy actions
- **Outline:** border-2 border-primary text-primary bg-transparent - Secondary actions
- **Ghost:** text-primary hover:bg-primary/10 - Tertiary actions

### Forms
- **Input Fields:** rounded-lg border-2 border-gray-300 focus:border-primary px-4 py-3
- **Labels:** text-sm font-semibold mb-2 text-gray-700
- **Validation:** Success (green border + checkmark), Error (red border + message)
- **Search:** Rounded-full with magnifying glass icon, subtle shadow

### Leaderboard Components
- **Podium Display:** Top 3 with elevated platforms (gold tallest), crown icons
- **Rank Badge:** Circular with gradient based on position (top 10 special treatment)
- **Point Counter:** Animated number with +/- change indicators
- **User Row:** Alternating subtle backgrounds, highlight current user with blue glow

### Achievement System
- **Badge Display:** Circular icons with gradient backgrounds, locked state in grayscale
- **Progress Rings:** SVG circular progress indicators around badges
- **Trophy Tiers:** Bronze, Silver, Gold, Platinum color schemes
- **Unlock Animation:** Scale-up with particle effects, celebration micro-interaction

### Gaming Elements
- **Difficulty Badges:** Pill-shaped with color coding (Easy: green, Medium: orange, Hard: red)
- **Point Display:** Large, bold numbers with +point animations on earn
- **Timer:** Circular countdown with color transitions (green → yellow → red)
- **Score Popup:** Floating +points notification that fades and rises

## Visual Effects

### Animations (Minimal, Purposeful)
- **Hover States:** 200ms ease transitions on scale (1.02) and shadow
- **Page Transitions:** 300ms fade-in on route changes
- **Point Gain:** +point number floats up and fades (500ms)
- **Achievement Unlock:** Scale pulse + confetti particles (1s, once)
- **Leaderboard Update:** Subtle highlight flash on position change

### Shadows
- **Subtle:** shadow-sm - Default cards
- **Medium:** shadow-md - Hover states
- **Strong:** shadow-xl - Modals, dropdowns
- **Glow:** Primary blue glow on active elements

### Borders
- **Default:** border border-gray-200 dark:border-gray-700
- **Accent:** border-2 border-primary for focus states
- **Gradient:** Use gradient borders for special achievement cards

## Page-Specific Guidelines

### Landing Page
- **Hero:** Full-screen with gradient background (blue to purple), large heading, animated leaderboard preview, dual CTAs (Sign Up primary, Demo secondary)
- **Features Section:** 3-column grid with icons, benefits-focused copy
- **Social Proof:** Animated counter showing active users, testimonials carousel
- **Preview Leaderboard:** Top 5 users with blurred avatars, point animations

### Dashboard
- **Stats Grid:** 4 cards showing total points, current rank, achievements unlocked, streak days
- **Activity Feed:** Timeline with icons, recent completions, point gains
- **Quick Actions:** Large cards for Study, Play Games, View Leaderboard
- **Progress Chart:** Line graph showing point accumulation over time

### Leaderboard
- **Top 3 Podium:** Elevated visual hierarchy with medals
- **Filter Bar:** Time period (Today, Week, Month, All-time), Category selector
- **User Highlight:** Current user row with distinctive blue background glow
- **Infinite Scroll:** Load more on scroll, smooth transitions

### Games Section
- **Game Grid:** Cards with preview images, difficulty indicator, point reward, play button
- **Categories:** Tabs or filter chips (Math, Science, Language, Trivia)
- **Game Detail:** Large hero image, description, high scores, difficulty selector, prominent Play button

## Images

### Hero Section
**Large Hero Image:** Yes - Use vibrant, energetic illustration or photo showing students engaged in learning/gaming. Position: Full-width background with overlay gradient (blue to transparent). Style: Modern, diverse students, bright colors, competitive/collaborative energy.

### Game Cards
**Thumbnail Images:** Each game card requires a distinctive thumbnail (400x300px). Style: Colorful, subject-themed illustrations (e.g., math equations, periodic table, globe for geography).

### Profile/Avatar
**User Avatars:** Circular, 40px default, 120px profile page. Support uploaded images with placeholder avatars (colorful geometric patterns based on username).

### Achievement Badges
**Icon-Based Graphics:** Custom SVG icons for each achievement type. Style: Flat design with gradients, gaming-inspired (trophies, medals, stars, crowns).